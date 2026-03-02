import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as QRCode from 'qrcode';
import { QRCodeToken, QRCodeTokenDocument } from './qr-code.schema';

interface QrTokenPayload {
  assignmentId: string;
  studentId: string;
  examId: string;
  indexNumber: string;
  examCode: string;
  type: 'exam_qr';
}

@Injectable()
export class QrCodeService {
  constructor(
    @InjectModel(QRCodeToken.name) private qrCodeTokenModel: Model<QRCodeTokenDocument>,
    private jwtService: JwtService,
  ) {}

  async generateToken(
    examAssignmentId: string,
    examId: string,
    studentId: string,
    indexNumber: string,
    examCode: string,
    expiryMinutes: number = 30,
  ): Promise<QRCodeToken> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    const payload: QrTokenPayload = {
      assignmentId: examAssignmentId,
      studentId,
      examId,
      indexNumber,
      examCode,
      type: 'exam_qr',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: `${expiryMinutes}m`,
    });

    // Delete existing token for this assignment if exists
    await this.qrCodeTokenModel.deleteMany({
      examAssignmentId: new Types.ObjectId(examAssignmentId),
    });

    const qrCodeToken = new this.qrCodeTokenModel({
      examAssignmentId: new Types.ObjectId(examAssignmentId),
      examId: new Types.ObjectId(examId),
      studentId: new Types.ObjectId(studentId),
      indexNumber,
      examCode,
      token,
      generatedAt: now,
      expiresAt,
      status: 'ACTIVE',
      scanCount: 0,
    });

    return qrCodeToken.save();
  }

  async verifyToken(
    token: string,
    ipAddress?: string,
    deviceInfo?: string,
    scannedByUserId?: string,
  ): Promise<{
    valid: boolean;
    qrCodeToken?: QRCodeToken;
    payload?: QrTokenPayload;
    message?: string;
  }> {
    try {
      // Verify JWT
      const payload = this.jwtService.verify<QrTokenPayload>(token);

      if (payload.type !== 'exam_qr') {
        return { valid: false, message: 'Invalid QR code type' };
      }

      // Find the QR code token in database
      const qrCodeToken = await this.qrCodeTokenModel
        .findOne({ token })
        .populate('examId')
        .populate('studentId')
        .exec();

      if (!qrCodeToken) {
        return { valid: false, message: 'QR code not found' };
      }

      if (qrCodeToken.status === 'USED') {
        return { valid: false, message: 'QR code has already been used', qrCodeToken };
      }

      if (qrCodeToken.status === 'REVOKED') {
        return { valid: false, message: 'QR code has been revoked' };
      }

      if (qrCodeToken.status === 'EXPIRED' || new Date() > qrCodeToken.expiresAt) {
        return { valid: false, message: 'QR code has expired' };
      }

      // Update scan info
      const updateData: any = {
        scanCount: (qrCodeToken.scanCount || 0) + 1,
        lastScanAt: new Date(),
      };

      if (ipAddress) updateData.ipAddress = ipAddress;
      if (deviceInfo) updateData.deviceInfo = deviceInfo;
      if (scannedByUserId) updateData.scannedByUserId = new Types.ObjectId(scannedByUserId);

      await this.qrCodeTokenModel.findByIdAndUpdate(qrCodeToken._id, updateData);

      return { valid: true, qrCodeToken, payload };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, message: 'QR code has expired' };
      }
      if (error.name === 'JsonWebTokenError') {
        return { valid: false, message: 'Invalid QR code' };
      }
      throw error;
    }
  }

  async markAsUsed(token: string, ipAddress?: string, deviceInfo?: string): Promise<QRCodeToken> {
    const qrCodeToken = await this.qrCodeTokenModel
      .findOneAndUpdate(
        { token },
        {
          isUsed: true,
          usedAt: new Date(),
          status: 'USED',
          ipAddress,
          deviceInfo,
        },
        { new: true }
      )
      .exec();

    if (!qrCodeToken) {
      throw new NotFoundException('QR code token not found');
    }

    return qrCodeToken;
  }

  async revokeToken(id: string, reason: string): Promise<QRCodeToken> {
    const qrCodeToken = await this.qrCodeTokenModel
      .findByIdAndUpdate(
        id,
        {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedReason: reason,
        },
        { new: true }
      )
      .exec();

    if (!qrCodeToken) {
      throw new NotFoundException('QR code token not found');
    }

    return qrCodeToken;
  }

  async generateQrCodeImage(token: string): Promise<string> {
    return QRCode.toDataURL(token, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });
  }

  async findByAssignment(examAssignmentId: string): Promise<QRCodeToken | null> {
    return this.qrCodeTokenModel
      .findOne({
        examAssignmentId: new Types.ObjectId(examAssignmentId),
        status: 'ACTIVE',
      })
      .exec();
  }

  async findByExam(examId: string): Promise<QRCodeToken[]> {
    return this.qrCodeTokenModel
      .find({ examId: new Types.ObjectId(examId) })
      .populate('studentId')
      .sort({ indexNumber: 1 })
      .exec();
  }

  async findByStudent(studentId: string): Promise<QRCodeToken[]> {
    return this.qrCodeTokenModel
      .find({
        studentId: new Types.ObjectId(studentId),
        status: 'ACTIVE',
      })
      .populate('examId')
      .sort({ expiresAt: -1 })
      .exec();
  }

  async markEmailSent(id: string): Promise<QRCodeToken> {
    const qrCodeToken = await this.qrCodeTokenModel
      .findByIdAndUpdate(
        id,
        {
          emailSent: true,
          emailSentAt: new Date(),
        },
        { new: true }
      )
      .exec();

    if (!qrCodeToken) {
      throw new NotFoundException('QR code token not found');
    }

    return qrCodeToken;
  }

  async deleteByExam(examId: string): Promise<void> {
    await this.qrCodeTokenModel.deleteMany({ examId: new Types.ObjectId(examId) }).exec();
  }

  async count(examId?: string): Promise<number> {
    const filter: any = {};
    if (examId) {
      filter.examId = new Types.ObjectId(examId);
    }
    return this.qrCodeTokenModel.countDocuments(filter).exec();
  }

  async getTokenWithQrImage(assignmentId: string): Promise<{
    token: QRCodeToken;
    qrImage: string;
  } | null> {
    const token = await this.findByAssignment(assignmentId);
    if (!token) {
      return null;
    }

    const qrImage = await this.generateQrCodeImage(token.token);
    return { token, qrImage };
  }
}
