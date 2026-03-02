import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private studentsService: StudentsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'exam-attendance-secret-key',
    });
  }

  async validate(payload: any) {
    const type = payload.type || 'user';

    if (type === 'student') {
      try {
        const student = await this.studentsService.findOne(payload.sub);
        if (!student) {
          throw new UnauthorizedException();
        }
        const studentDoc = student as any;
        return {
          id: studentDoc._id,
          email: studentDoc.email,
          indexNumber: studentDoc.indexNumber,
          role: 'STUDENT',
          type: 'student',
        };
      } catch {
        throw new UnauthorizedException();
      }
    } else {
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      const userDoc = user as any;
      return {
        id: userDoc._id,
        email: userDoc.email,
        role: userDoc.role,
        type: 'user',
      };
    }
  }
}
