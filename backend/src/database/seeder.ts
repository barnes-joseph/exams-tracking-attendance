import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('🌱 Starting database seeder...');

  // Check if superadmin already exists
  const existingSuperAdmin = await usersService.findByEmail('superadmin@examtrack.com');

  if (existingSuperAdmin) {
    console.log('✅ Superadmin user already exists');
    console.log('   Email: superadmin@examtrack.com');
    console.log('   Role: ADMIN');
  } else {
    // Create superadmin user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const superAdmin = await usersService.create({
      email: 'superadmin@examtrack.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      department: 'IT Administration',
      phoneNumber: '+233000000000',
      isActive: true,
    });

    console.log('✅ Superadmin user created successfully!');
    console.log('   Email: superadmin@examtrack.com');
    console.log('   Password: Admin@123');
    console.log('   Role: ADMIN');
    console.log('   ID:', (superAdmin as any)._id);
  }

  // Create sample invigilator if not exists
  const existingInvigilator = await usersService.findByEmail('invigilator@examtrack.com');

  if (!existingInvigilator) {
    const hashedPassword = await bcrypt.hash('Invigilator@123', 10);

    const invigilator = await usersService.create({
      email: 'invigilator@examtrack.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'INVIGILATOR',
      department: 'Examination Office',
      phoneNumber: '+233000000001',
      isActive: true,
    });

    console.log('✅ Sample invigilator user created successfully!');
    console.log('   Email: invigilator@examtrack.com');
    console.log('   Password: Invigilator@123');
    console.log('   Role: INVIGILATOR');
  } else {
    console.log('✅ Sample invigilator already exists');
  }

  console.log('\n🎉 Seeding completed!');
  console.log('\nYou can now login with:');
  console.log('   Superadmin: superadmin@examtrack.com / Admin@123');
  console.log('   Invigilator: invigilator@examtrack.com / Invigilator@123');

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
