import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import * as bcrypt from "bcrypt";

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

async function main() {
  console.log("🌱 Seeding database...");

  // ----------------------
  // SPECIALIZATIONS
  // ----------------------
  const cardiology = await prisma.specialization.upsert({
    where: { name: "Cardiology" },
    update: {},
    create: { name: "Cardiology" },
  });

  const dermatology = await prisma.specialization.upsert({
    where: { name: "Dermatology" },
    update: {},
    create: { name: "Dermatology" },
  });

  const neurology = await prisma.specialization.upsert({
    where: { name: "Neurology" },
    update: {},
    create: { name: "Neurology" },
  });

  const pediatrics = await prisma.specialization.upsert({
    where: { name: "Pediatrics" },
    update: {},
    create: { name: "Pediatrics" },
  });

  console.log("✅ Specializations created");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // ----------------------
  // PATIENTS
  // ----------------------
  const patientAccount1 = await prisma.account.upsert({
    where: { email: "patient1@example.com" },
    update: {},
    create: {
      email: "patient1@example.com",
      passwordHash: hashedPassword,
      role: "PATIENT",
      isVerified: true,
      patientProfile: {
        create: {
          firstName: "Jonathan",
          middleName: "Michael",
          lastName: "Doe",
          birthday: new Date("1990-05-15"),
          weight: 75.5,
          height: 180,
          phone: "09123456789",
          address: "Laguna, Philippines",
          emergencyName: "Sarah Doe",
          emergencyPhone: "09876543210",
          medicalHistory: {
            create: [
              { condition: "Hypertension" },
              { condition: "Diabetes Type 2" },
            ],
          },
        },
      },
    },
  });

  const patientAccount2 = await prisma.account.upsert({
    where: { email: "patient2@example.com" },
    update: {},
    create: {
      email: "patient2@example.com",
      passwordHash: hashedPassword,
      role: "PATIENT",
      isVerified: true,
      patientProfile: {
        create: {
          firstName: "Emma",
          lastName: "Smith",
          birthday: new Date("1985-08-22"),
          weight: 62.3,
          height: 168,
          phone: "09111111111",
          address: "Manila, Philippines",
          emergencyName: "Robert Smith",
          emergencyPhone: "09999999999",
          medicalHistory: {
            create: [{ condition: "Asthma" }],
          },
        },
      },
    },
  });

  console.log("✅ Patients created");

  // ----------------------
  // DOCTORS
  // ----------------------
  const doctorAccount1 = await prisma.account.upsert({
    where: { email: "doctor1@example.com" },
    update: {},
    create: {
      email: "doctor1@example.com",
      passwordHash: hashedPassword,
      role: "DOCTOR",
      isVerified: true,
      doctorProfile: {
        create: {
          firstName: "Jane",
          lastName: "Johnson",
          bio: "Cardiologist specializing in heart disease prevention.",
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
    where: { email: "doctor2@example.com" },
    update: {},
    create: {
      email: "doctor2@example.com",
      passwordHash: hashedPassword,
      role: "DOCTOR",
      isVerified: true,
      doctorProfile: {
        create: {
          firstName: "Michael",
          lastName: "Williams",
          bio: "Dermatologist expert in skin diseases.",
          specializations: {
            create: [{ specializationId: dermatology.id }],
          },
        },
      },
    },
  });

  const doctorAccount3 = await prisma.account.upsert({
    where: { email: "doctor3@example.com" },
    update: {},
    create: {
      email: "doctor3@example.com",
      passwordHash: hashedPassword,
      role: "DOCTOR",
      isVerified: true,
      doctorProfile: {
        create: {
          firstName: "Sarah",
          lastName: "Brown",
          bio: "Neurologist specializing in brain disorders.",
          specializations: {
            create: [{ specializationId: neurology.id }],
          },
        },
      },
    },
  });

  console.log("✅ Doctors created");

  // ----------------------
  // FETCH PROFILES (FIX FOR YOUR ERROR)
  // ----------------------
  const doctor1 = await prisma.doctorProfile.findUnique({
    where: { accountId: doctorAccount1.id },
  });

  const doctor2 = await prisma.doctorProfile.findUnique({
    where: { accountId: doctorAccount2.id },
  });

  const doctor3 = await prisma.doctorProfile.findUnique({
    where: { accountId: doctorAccount3.id },
  });

  // ----------------------
  // SCHEDULES (CRITICAL FOR TESTING)
  // ----------------------
  await prisma.doctorSchedule.createMany({
    data: [
      {
        doctorId: doctor1!.id,
        startTime: setTime(today, 9),
        endTime: setTime(today, 10),
        isBooked: false,
      },
      {
        doctorId: doctor1!.id,
        startTime: setTime(today, 10),
        endTime: setTime(today, 11),
        isBooked: true,
      },
      {
        doctorId: doctor2!.id,
        startTime: setTime(today, 13),
        endTime: setTime(today, 14),
        isBooked: false,
      },
      {
        doctorId: doctor3!.id,
        startTime: setTime(tomorrow, 11),
        endTime: setTime(tomorrow, 12),
        isBooked: false,
      },
    ],
  });

  console.log("✅ Schedules created");

  console.log("🎉 SEED COMPLETE");
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
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });