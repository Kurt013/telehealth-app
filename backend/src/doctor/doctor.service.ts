import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      },
    });
  }

  async getSchedules(doctorId: string, from?: string, to?: string) {
    const where: any = {
      doctorId,
      isBooked: false,
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
}
