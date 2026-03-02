import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { LoginDto, RegisterDto, StudentLoginDto, StudentRegisterDto, ChangePasswordDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private studentsService: StudentsService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const userDoc = user as any;
      const { password: _, ...result } = userDoc.toObject ? userDoc.toObject() : userDoc;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
      type: 'user'
    };

    await this.usersService.update(user._id.toString(), { lastLogin: new Date() });

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        type: 'user',
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const userDoc = user as any;
    const userObj = userDoc.toObject ? userDoc.toObject() : userDoc;
    const { password: _, ...result } = userObj;
    const payload = {
      email: result.email,
      sub: result._id,
      role: result.role,
      type: 'user'
    };

    return {
      user: { ...result, type: 'user' },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async studentLogin(studentLoginDto: StudentLoginDto) {
    const student = await this.studentsService.findByIndexNumber(studentLoginDto.indexNumber);

    if (!student) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.studentsService.validatePassword(student, studentLoginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!student.isActive || student.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const studentDoc = student as any;
    const payload = {
      email: studentDoc.email,
      sub: studentDoc._id,
      indexNumber: studentDoc.indexNumber,
      role: 'STUDENT',
      type: 'student'
    };

    await this.studentsService.updateLastLogin(studentDoc._id.toString());

    return {
      user: {
        id: studentDoc._id,
        email: studentDoc.email,
        indexNumber: studentDoc.indexNumber,
        firstName: studentDoc.firstName,
        lastName: studentDoc.lastName,
        role: 'STUDENT',
        type: 'student',
        programId: studentDoc.programId,
        level: studentDoc.level,
        currentAcademicYear: studentDoc.currentAcademicYear,
        currentSemester: studentDoc.currentSemester,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async studentRegister(studentRegisterDto: StudentRegisterDto) {
    try {
      await this.studentsService.findByIndexNumber(studentRegisterDto.indexNumber);
      throw new ConflictException('Index number already exists');
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    const existingByEmail = await this.studentsService.findByEmail(studentRegisterDto.email);
    if (existingByEmail) {
      throw new ConflictException('Email already exists');
    }

    const student = await this.studentsService.create(studentRegisterDto);
    const studentDoc = student as any;

    const payload = {
      email: studentDoc.email,
      sub: studentDoc._id,
      indexNumber: studentDoc.indexNumber,
      role: 'STUDENT',
      type: 'student'
    };

    return {
      user: {
        id: studentDoc._id,
        email: studentDoc.email,
        indexNumber: studentDoc.indexNumber,
        firstName: studentDoc.firstName,
        lastName: studentDoc.lastName,
        role: 'STUDENT',
        type: 'student',
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto, isStudent: boolean = false) {
    if (isStudent) {
      const student = await this.studentsService.findOne(userId);
      const isValid = await this.studentsService.validatePassword(student, changePasswordDto.currentPassword);
      if (!isValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      await this.studentsService.update(userId, { password: changePasswordDto.newPassword });
    } else {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const isValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
      if (!isValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
      await this.usersService.update(userId, { password: hashedPassword });
    }

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string, type: string) {
    if (type === 'student') {
      const student = await this.studentsService.findOne(userId);
      const studentDoc = student as any;
      return {
        id: studentDoc._id,
        email: studentDoc.email,
        indexNumber: studentDoc.indexNumber,
        firstName: studentDoc.firstName,
        lastName: studentDoc.lastName,
        role: 'STUDENT',
        type: 'student',
        programId: studentDoc.programId,
        level: studentDoc.level,
        currentAcademicYear: studentDoc.currentAcademicYear,
        currentSemester: studentDoc.currentSemester,
        photo: studentDoc.photo,
      };
    } else {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const userDoc = user as any;
      return {
        id: userDoc._id,
        email: userDoc.email,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        role: userDoc.role,
        type: 'user',
        department: userDoc.department,
      };
    }
  }
}
