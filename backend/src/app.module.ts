import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AcademicModule } from './academic/academic.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ExamsModule } from './exams/exams.module';
import { AttendanceModule } from './attendance/attendance.module';
import { QRCodeModule } from './qr-code/qr-code.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB Connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/exam-attendance',
      }),
      inject: [ConfigService],
    }),

    // Application Modules
    AuthModule,
    UsersModule,
    StudentsModule,
    AcademicModule,
    EnrollmentsModule,
    ExamsModule,
    AttendanceModule,
    QRCodeModule,
    ReportsModule,
    AuditModule,
  ],
})
export class AppModule {}
