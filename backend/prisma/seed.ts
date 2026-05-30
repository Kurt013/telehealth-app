import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ----------------------
// DATE HELPERS (SAFE)
// ----------------------
const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);

const setTime = (base: Date, hour: number) => {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const createMeetCode = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const randomChars = (length: number) =>
    Array.from(
      { length },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');

  return `${randomChars(3)}-${randomChars(4)}-${randomChars(3)}`;
};

const createDummyMeetData = () => {
  const meetingId = createMeetCode();

  return {
    meetingId,
    meetingLink: `https://meet.google.com/${meetingId}`,
    calendarEventId: `event-${randomUUID()}`,
  };
};

async function main() {
  console.log('🌱 Seeding database...');

  // ----------------------
  // SPECIALIZATIONS
  // ----------------------
  const specializationNames = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Pediatrics',
    'Pulmonology',
    'Gastroenterology',
    'Orthopedics',
    'Obstetrics & Gynecology',
    'Psychiatry',
    'ENT',
    'Endocrinology',
  ];

  const specializations = await Promise.all(
    specializationNames.map((name) =>
      prisma.specialization.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const specializationMap = Object.fromEntries(
    specializations.map((specialization) => [
      specialization.name,
      specialization,
    ]),
  ) as Record<string, (typeof specializations)[number]>;

  console.log('✅ Specializations created');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ----------------------
  // PATIENTS
  // ----------------------
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
          phone: '09123456789',
          address: 'Laguna, Philippines',
          emergencyName: 'Sarah Doe',
          emergencyPhone: '09876543210',
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
          lastName: 'Smith',
          birthday: new Date('1985-08-22'),
          weight: 62.3,
          height: 168,
          phone: '09111111111',
          address: 'Manila, Philippines',
          emergencyName: 'Robert Smith',
          emergencyPhone: '09999999999',
          medicalHistory: {
            create: [{ condition: 'Asthma' }],
          },
        },
      },
    },
  });

  console.log('✅ Patients created');

  const patientProfiles = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { accountId: patientAccount1.id },
    }),
    prisma.patientProfile.findUnique({
      where: { accountId: patientAccount2.id },
    }),
  ]);

  // ----------------------
  // DOCTORS
  // ----------------------
  const doctorSeeds = [
    {
      email: 'doctor1@example.com',
      firstName: 'Jane',
      lastName: 'Johnson',
      bio: 'Cardiologist specializing in heart disease prevention and family screening.',
      specializations: ['Cardiology', 'General Medicine'],
    },
    {
      email: 'doctor2@example.com',
      firstName: 'Michael',
      lastName: 'Williams',
      bio: 'Dermatologist focused on acne, rashes, eczema, and skin cancer checks.',
      specializations: ['Dermatology'],
    },
    {
      email: 'doctor3@example.com',
      firstName: 'Sarah',
      lastName: 'Brown',
      bio: 'Neurologist handling headaches, dizziness, and nerve disorders.',
      specializations: ['Neurology'],
    },
    {
      email: 'doctor4@example.com',
      firstName: 'Daniel',
      lastName: 'Reyes',
      bio: 'Pulmonologist for asthma, chronic cough, and breathing concerns.',
      specializations: ['Pulmonology', 'General Medicine'],
    },
    {
      email: 'doctor5@example.com',
      firstName: 'Ava',
      lastName: 'Cruz',
      bio: 'Pediatrician for child wellness checks, vaccines, and developmental concerns.',
      specializations: ['Pediatrics', 'General Medicine'],
    },
    {
      email: 'doctor6@example.com',
      firstName: 'Luis',
      lastName: 'Mendoza',
      bio: 'Gastroenterologist for abdominal pain, reflux, bowel issues, and liver concerns.',
      specializations: ['Gastroenterology'],
    },
    {
      email: 'doctor7@example.com',
      firstName: 'Nina',
      lastName: 'Garcia',
      bio: 'Orthopedic specialist for bone, joint, back, and sports injuries.',
      specializations: ['Orthopedics'],
    },
    {
      email: 'doctor8@example.com',
      firstName: 'Grace',
      lastName: 'Lim',
      bio: "OB-GYN for pregnancy care, menstrual concerns, and women's health.",
      specializations: ['Obstetrics & Gynecology'],
    },
    {
      email: 'doctor9@example.com',
      firstName: 'Owen',
      lastName: 'Tan',
      bio: 'Psychiatrist providing mental health support, anxiety, and sleep treatment.',
      specializations: ['Psychiatry'],
    },
    {
      email: 'doctor10@example.com',
      firstName: 'Mara',
      lastName: 'Santos',
      bio: 'ENT specialist for sinus issues, ear infections, and throat problems.',
      specializations: ['ENT'],
    },
  ];

  const doctorAccounts = [] as Array<{ id: string; email: string }>;

  for (const doctor of doctorSeeds) {
    const account = await prisma.account.upsert({
      where: { email: doctor.email },
      update: {},
      create: {
        email: doctor.email,
        passwordHash: hashedPassword,
        role: 'DOCTOR',
        isVerified: true,
        doctorProfile: {
          create: {
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            bio: doctor.bio,
            specializations: {
              create: doctor.specializations.map((specializationName) => ({
                specializationId: specializationMap[specializationName].id,
              })),
            },
          },
        },
      },
    });

    doctorAccounts.push({ id: account.id, email: doctor.email });
  }

  console.log('✅ Doctors created');

  // ----------------------
  // FETCH PROFILES (FIX FOR YOUR ERROR)
  // ----------------------
  const doctorProfiles = await Promise.all(
    doctorAccounts.map((doctorAccount) =>
      prisma.doctorProfile.findUnique({
        where: { accountId: doctorAccount.id },
      }),
    ),
  );

  // ----------------------
  // SCHEDULES (CRITICAL FOR TESTING)
  // ----------------------
  const scheduleSeedData = [
    { doctorIndex: 0, dayOffset: 0, startHour: 9, endHour: 10 },
    { doctorIndex: 0, dayOffset: 0, startHour: 10, endHour: 11 },
    { doctorIndex: 1, dayOffset: 0, startHour: 13, endHour: 14 },
    { doctorIndex: 2, dayOffset: 1, startHour: 11, endHour: 12 },
    { doctorIndex: 3, dayOffset: 0, startHour: 8, endHour: 9 },
    { doctorIndex: 4, dayOffset: 1, startHour: 14, endHour: 15 },
    { doctorIndex: 5, dayOffset: 0, startHour: 15, endHour: 16 },
    { doctorIndex: 6, dayOffset: 2, startHour: 9, endHour: 10 },
    { doctorIndex: 7, dayOffset: 1, startHour: 9, endHour: 10 },
    { doctorIndex: 8, dayOffset: 0, startHour: 16, endHour: 17 },
    { doctorIndex: 9, dayOffset: 2, startHour: 10, endHour: 11 },
  ];

  const createdSchedules = [] as Array<{
    id: string;
    doctorId: string;
    startTime: Date;
    endTime: Date;
  }>;

  for (const schedule of scheduleSeedData) {
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() + schedule.dayOffset);

    const createdSchedule = await prisma.doctorSchedule.create({
      data: {
        doctorId: doctorProfiles[schedule.doctorIndex]!.id,
        startTime: setTime(baseDate, schedule.startHour),
        endTime: setTime(baseDate, schedule.endHour),
      },
    });

    createdSchedules.push(createdSchedule);
  }

  console.log('✅ Schedules created');

  // ----------------------
  // APPOINTMENTS + CONSULTATION SESSIONS
  // ----------------------
  const bookingSeedData = [
    { scheduleIndex: 0, reason: 'Chest discomfort and follow-up check' },
    { scheduleIndex: 2, reason: 'Persistent rash evaluation' },
    { scheduleIndex: 4, reason: 'Breathing concerns and inhaler review' },
  ];

  const seededAppointments = [] as Array<{ id: string; scheduleId: string }>;

  for (const booking of bookingSeedData) {
    const schedule = createdSchedules[booking.scheduleIndex]!;
    const doctorProfile =
      doctorProfiles[scheduleSeedData[booking.scheduleIndex]!.doctorIndex]!;
    const patientProfile = patientProfiles[0];

    if (!doctorProfile || !patientProfile) {
      continue;
    }

    const meetData = createDummyMeetData();

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientProfile.id,
        doctorId: doctorProfile.id,
        scheduleId: schedule.id,
        reason: booking.reason,
        status: 'CONFIRMED',
        consultationSession: {
          create: {
            meetingLink: meetData.meetingLink,
            meetingId: meetData.meetingId,
            calendarEventId: meetData.calendarEventId,
            status: 'SCHEDULED',
          },
        },
      },
    });

    seededAppointments.push({ id: appointment.id, scheduleId: schedule.id });
  }

  for (const appointment of seededAppointments) {
    const fullAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: { include: { account: true } },
        doctor: { include: { account: true } },
        schedule: true,
        consultationSession: true,
      },
    });

    if (!fullAppointment) {
      continue;
    }

    const appointmentTime = new Date(
      fullAppointment.schedule.startTime,
    ).toLocaleString();

    await prisma.notification.createMany({
      data: [
        {
          accountId: fullAppointment.patient.accountId,
          type: 'APPOINTMENT_BOOKED',
          title: 'Appointment booked',
          message: `Your appointment is scheduled for ${appointmentTime}.`,
          metadata: {
            appointmentId: fullAppointment.id,
            scheduleId: fullAppointment.scheduleId,
            role: 'PATIENT',
          },
        },
        {
          accountId: fullAppointment.doctor.accountId,
          type: 'SESSION_READY',
          title: 'Consultation session ready',
          message: `You have a confirmed appointment at ${appointmentTime}.`,
          metadata: {
            appointmentId: fullAppointment.id,
            scheduleId: fullAppointment.scheduleId,
            meetingLink: fullAppointment.consultationSession?.meetingLink,
            role: 'DOCTOR',
          },
        },
      ],
    });
  }

  console.log('✅ Patient bookings created');

  console.log('🎉 SEED COMPLETE');
  console.log({
    patients: [patientAccount1.id, patientAccount2.id],
    doctors: doctorAccounts.map((doctorAccount) => doctorAccount.id),
    appointments: seededAppointments,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
