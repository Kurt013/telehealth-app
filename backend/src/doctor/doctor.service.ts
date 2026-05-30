import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

const symptomMap: Record<string, string[]> = {
  fever: ['General Medicine', 'Pediatrics'],
  cough: ['Pulmonology', 'General Medicine'],
  chestPain: ['Cardiology'],
  skin: ['Dermatology'],
};

function normalizeDateTime(input: string, baseDate = new Date()) {
  // If full ISO datetime
  if (input.includes('T')) {
    return new Date(input);
  }

  // If time only (HH:mm)
  if (/^\d{2}:\d{2}$/.test(input)) {
    const [hours, minutes] = input.split(':').map(Number);

    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // If date only (YYYY-MM-DD)
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  // DISCOVERY
  async findDoctors(
    search?: string,
    specialization?: string,
    symptom?: string,
  ) {
    const mappedSpecs = symptom ? symptomMap[symptom] || [] : [];

    return this.prisma.doctorProfile.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},

          specialization
            ? {
                specializations: {
                  some: {
                    specialization: { name: specialization },
                  },
                },
              }
            : mappedSpecs.length
              ? {
                  specializations: {
                    some: {
                      specialization: { name: { in: mappedSpecs } },
                    },
                  },
                }
              : {},
        ],
      },
      include: {
        specializations: { include: { specialization: true } },
      },
    });
  }

  async findDoctorById(id: string) {
    return this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        specializations: { include: { specialization: true } },
        schedules: true,
        account: true,
      },
    });
  }

  async findDoctorByAccountId(accountId: string) {
    let doctor = await this.prisma.doctorProfile.findUnique({
      where: { accountId },
      include: {
        specializations: { include: { specialization: true } },
        schedules: true,
        account: true,
      },
    });

    if (!doctor) {
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { id: true, email: true, role: true },
      });

      if (account?.role === 'DOCTOR') {
        const emailLocal = account.email
          ? account.email.split('@')[0]
          : 'doctor';

        const created = await this.prisma.doctorProfile.create({
          data: {
            accountId: account.id,
            firstName: String(emailLocal).slice(0, 50) || 'Doctor',
            lastName: 'User',
          },
          include: {
            specializations: { include: { specialization: true } },
            schedules: true,
            account: true,
          },
        });

        doctor = created;
      } else {
        throw new NotFoundException('Doctor profile not found');
      }
    }

    return doctor;
  }

  async updateDoctorProfile(id: string, data: UpdateDoctorProfileDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    const specializations = data.specializations
      ? Array.from(
          new Set(data.specializations.filter((name) => name && name.trim())),
        )
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      await txAny.doctorProfile.update({
        where: { id },
        data: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          profilePicture: data.profilePicture,
          bio: data.bio,
        },
      });

      if (specializations) {
        await txAny.doctorSpecialization.deleteMany({
          where: { doctorId: id },
        });

        for (const name of specializations) {
          const specialization = await txAny.specialization.upsert({
            where: { name },
            create: { name },
            update: {},
          });

          await txAny.doctorSpecialization.create({
            data: {
              doctorId: id,
              specializationId: specialization.id,
            },
          });
        }
      }

      return txAny.doctorProfile.findUnique({
        where: { id },
        include: {
          account: true,
          specializations: { include: { specialization: true } },
          schedules: true,
        },
      });
    });
  }

  async updateDoctorProfileByAccountId(
    accountId: string,
    data: UpdateDoctorProfileDto,
  ) {
    let doctor = await this.prisma.doctorProfile.findUnique({
      where: { accountId },
    });

    if (!doctor) {
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { id: true, email: true, role: true },
      });

      if (account?.role === 'DOCTOR') {
        const emailLocal = account.email
          ? account.email.split('@')[0]
          : 'doctor';

        doctor = await this.prisma.doctorProfile.create({
          data: {
            accountId: account.id,
            firstName: String(emailLocal).slice(0, 50) || 'Doctor',
            lastName: 'User',
          },
        });
      } else {
        throw new NotFoundException('Doctor profile not found');
      }
    }

    return this.updateDoctorProfile(doctor.id, data);
  }

  async getSchedules(doctorId: string, from?: string, to?: string) {
    const where: any = {
      doctorId,
      appointments: {
        none: {
          status: { not: 'CANCELLED' },
        },
      },
    };

    if (from || to) {
      const start = from ? normalizeDateTime(from) : new Date('1970-01-01');

      const end = to ? normalizeDateTime(to) : new Date('2999-12-31');

      where.AND = [
        {
          startTime: {
            lt: end,
          },
        },
        {
          endTime: {
            gt: start,
          },
        },
      ];
    }

    return this.prisma.doctorSchedule.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async getSchedulesByAccountId(accountId: string, from?: string, to?: string) {
    let doctor = await this.prisma.doctorProfile.findUnique({
      where: { accountId },
    });

    if (!doctor) {
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { id: true, email: true, role: true },
      });

      if (account?.role === 'DOCTOR') {
        const emailLocal = account.email
          ? account.email.split('@')[0]
          : 'doctor';

        doctor = await this.prisma.doctorProfile.create({
          data: {
            accountId: account.id,
            firstName: String(emailLocal).slice(0, 50) || 'Doctor',
            lastName: 'User',
          },
        });
      } else {
        throw new NotFoundException('Doctor profile not found');
      }
    }

    return this.getSchedules(doctor.id, from, to);
  }
}
