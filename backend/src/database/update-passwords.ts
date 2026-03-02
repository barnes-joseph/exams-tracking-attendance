import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const studentsService = app.get(StudentsService);

  console.log('🔐 Starting password update process...\n');

  // Update all student passwords to Student@123
  console.log('📋 Fetching all students...');
  const allStudents = await studentsService.findAll({ limit: 10000 });
  console.log(`Found ${allStudents.data.length} students\n`);

  console.log('🔄 Updating student passwords...');
  const studentPassword = 'Student@123';
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);
  
  for (const student of allStudents.data) {
    const studentDoc = student as any;
    await studentsService.update(studentDoc._id.toString(), {
      password: studentPassword,
    });
  }
  console.log(`✅ Updated ${allStudents.data.length} student passwords to "${studentPassword}"\n`);

  // Update all invigilator passwords to Invig@123
  console.log('📋 Fetching all invigilators...');
  const allUsers = await usersService.findAllPaginated(1, 10000, undefined, 'INVIGILATOR');
  console.log(`Found ${allUsers.data.length} invigilators\n`);

  console.log('🔄 Updating invigilator passwords...');
  const invigilatorPassword = 'Invig@123';
  
  for (const invigilator of allUsers.data) {
    const invigDoc = invigilator as any;
    await usersService.update(invigDoc._id.toString(), {
      password: invigilatorPassword,
    });
  }
  console.log(`✅ Updated ${allUsers.data.length} invigilator passwords to "${invigilatorPassword}"\n`);

  // Print Student Records
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    STUDENT RECORDS                         ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Students: ${allStudents.data.length}\n`);
  
  console.log('─'.repeat(80));
  console.log(`${'Index Number'.padEnd(15)} ${'Name'.padEnd(30)} ${'Email'.padEnd(30)}`);
  console.log('─'.repeat(80));
  
  for (const student of allStudents.data) {
    const fullName = `${student.firstName} ${student.lastName}`;
    console.log(
      `${student.indexNumber.padEnd(15)} ${fullName.padEnd(30)} ${student.email.padEnd(30)}`
    );
  }
  console.log('─'.repeat(80));

  // Print Invigilator Records
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                  INVIGILATOR RECORDS                       ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Invigilators: ${allUsers.data.length}\n`);
  
  console.log('─'.repeat(90));
  console.log(`${'ID'.padEnd(25)} ${'Name'.padEnd(25)} ${'Email'.padEnd(30)} ${'Department'.padEnd(20)}`);
  console.log('─'.repeat(90));
  
  for (const invigilator of allUsers.data) {
    const fullName = `${invigilator.firstName} ${invigilator.lastName}`;
    const dept = invigilator.department || 'N/A';
    const invigDoc = invigilator as any;
    console.log(
      `${invigDoc._id.toString().padEnd(25)} ${fullName.padEnd(25)} ${invigilator.email.padEnd(30)} ${dept.padEnd(20)}`
    );
  }
  console.log('─'.repeat(90));

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    LOGIN CREDENTIALS                       ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('All Students:');
  console.log('  Username: Index Number (e.g., 12345678)');
  console.log('  Password: Student@123');
  console.log('\nAll Invigilators:');
  console.log('  Username: Email address');
  console.log('  Password: Invig@123');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🎉 Password update process completed successfully!');

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Password update failed:', error);
  process.exit(1);
});
