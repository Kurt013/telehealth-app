import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const symptomMap: Record<string, string[]> = {
  fever: ['General Medicine'],
  cough: ['Pulmonology', 'General Medicine'],
  chestPain: ['Cardiology'],
  skin: ['Dermatology'],
};

@Injectable()
export class DoctorDiscoveryService {
  constructor(private prisma: PrismaService) {}

  async searchDoctors(dto: any) {
    const specializationsFromSymptom =
      dto.symptom ? symptomMap[dto.symptom] || [] : [];

    return this.prisma.doctorProfile.findMany({
      where: {
        AND: [
          dto.search
            ? {
                OR: [
                  { firstName: { contains: dto.search, mode: 'insensitive' } },
                  { lastName: { contains: dto.search, mode: 'insensitive' } },
                ],
              }
            : {},

          dto.specialization
            ? {
                specializations: {
                  some: {
                    specialization: {
                      name: dto.specialization,
                    },
                  },
                },
              }
            : specializationsFromSymptom.length
            ? {
                specializations: {
                  some: {
                    specialization: {
                      name: { in: specializationsFromSymptom },
                    },
                  },
                },
              }
            : {},
        ],
      },
      include: {
        specializations: { include: { specialization: true } },
        schedules: {
          where: { isBooked: false },
        },
      },
    });
  }
}