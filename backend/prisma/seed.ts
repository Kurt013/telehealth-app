import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create Specializations
  const cardiology = await prisma.specialization.upsert({
    where: { name: 'Cardiology' },
    update: {},
    create: { name: 'Cardiology' },
  });

  const dermatology = await prisma.specialization.upsert({
    where: { name: 'Dermatology' },
    update: {},
    create: { name: 'Dermatology' },
  });

  const neurology = await prisma.specialization.upsert({
    where: { name: 'Neurology' },
    update: {},
    create: { name: 'Neurology' },
  });

  const pediatrics = await prisma.specialization.upsert({
    where: { name: 'Pediatrics' },
    update: {},
    create: { name: 'Pediatrics' },
  });

  console.log('✅ Created specializations');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Patient Accounts and Profiles
  const patientAccount1 = await prisma.account.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      passwordHash: hashedPassword,
      role: 'PATIENT',
      isVerified: true,
      patientProfile: {
        create: {
          firstName: 'Jonathan',
          middleName: 'Michael',
          lastName: 'Doe',
          birthday: new Date('1990-05-15'),
          weight: 75.5,
          height: 180,
          phone: '+1 (555) 123-4567',
          address: '123 Main St, New York, NY 10001',
          emergencyName: 'Sarah Doe',
          emergencyPhone: '+1 (555) 987-6543',
          medicalHistory: {
            create: [
              { condition: 'Hypertension' },
              { condition: 'Diabetes Type 2' },
            ],
          },
        },
      },
    },
  });

  const patientAccount2 = await prisma.account.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      email: 'patient2@example.com',
      passwordHash: hashedPassword,
      role: 'PATIENT',
      isVerified: true,
      patientProfile: {
        create: {
          firstName: 'Emma',
          middleName: 'Louise',
          lastName: 'Smith',
          birthday: new Date('1985-08-22'),
          weight: 62.3,
          height: 168,
          phone: '+1 (555) 234-5678',
          address: '456 Oak Ave, Los Angeles, CA 90001',
          emergencyName: 'Robert Smith',
          emergencyPhone: '+1 (555) 345-6789',
          medicalHistory: {
            create: [{ condition: 'Asthma' }, { condition: 'Allergies' }],
          },
        },
      },
    },
  });

  console.log('✅ Created patient accounts and profiles');

  // Create Doctor Accounts and Profiles
  const doctorAccount1 = await prisma.account.upsert({
    where: { email: 'doctor1@example.com' },
    update: {},
    create: {
      email: 'doctor1@example.com',
      passwordHash: hashedPassword,
      role: 'DOCTOR',
      isVerified: true,
      doctorProfile: {
        create: {
          firstName: 'Jane',
          middleName: 'Marie',
          lastName: 'Johnson',
          bio: 'Board-certified cardiologist with 15+ years of experience. Specializing in preventive cardiology and heart disease management.',
          specializations: {
            create: [
              { specializationId: cardiology.id },
              { specializationId: pediatrics.id },
            ],
          },
        },
      },
    },
  });

  const doctorAccount2 = await prisma.account.upsert({
    where: { email: 'doctor2@example.com' },
    update: {},
    create: {
      email: 'doctor2@example.com',
      passwordHash: hashedPassword,
      role: 'DOCTOR',
      isVerified: true,
      doctorProfile: {
        create: {
          firstName: 'Michael',
          middleName: 'Robert',
          lastName: 'Williams',
          bio: 'Dermatologist with expertise in cosmetic and clinical dermatology. Treating all skin conditions.',
          specializations: {
            create: [{ specializationId: dermatology.id }],
          },
        },
      },
    },
  });

  const doctorAccount3 = await prisma.account.upsert({
    where: { email: 'doctor3@example.com' },
    update: {},
    create: {
      email: 'doctor3@example.com',
      passwordHash: hashedPassword,
      role: 'DOCTOR',
      isVerified: true,
      doctorProfile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Brown',
          bio: 'Neurologist specializing in headaches, migraines, and neurological disorders.',
          specializations: {
            create: [{ specializationId: neurology.id }],
          },
        },
      },
    },
  });

  console.log('✅ Created doctor accounts and profiles');

  console.log('🎉 Database seeding completed successfully!');
  console.log({
    patients: [patientAccount1.id, patientAccount2.id],
    doctors: [doctorAccount1.id, doctorAccount2.id, doctorAccount3.id],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
