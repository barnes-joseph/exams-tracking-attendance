import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { College, CollegeSchema } from './college.schema';
import { CollegeService } from './college.service';
import { CollegeController } from './college.controller';

import { Department, DepartmentSchema } from './department.schema';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';

import { Program, ProgramSchema } from './program.schema';
import { ProgramService } from './program.service';
import { ProgramController } from './program.controller';

import { Course, CourseSchema } from './course.schema';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: College.name, schema: CollegeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Program.name, schema: ProgramSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [
    CollegeController,
    DepartmentController,
    ProgramController,
    CourseController,
  ],
  providers: [
    CollegeService,
    DepartmentService,
    ProgramService,
    CourseService,
  ],
  exports: [
    CollegeService,
    DepartmentService,
    ProgramService,
    CourseService,
  ],
})
export class AcademicModule {}
