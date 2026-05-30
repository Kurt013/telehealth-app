import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';

const symptomMap: Record<string, string[]> = {
  fever: ['General Medicine'],
  cough: ['Pulmonology', 'General Medicine'],
  chestPain: ['Cardiology'],
  skin: ['Dermatology'],
};

@Injectable()
export class DoctorDiscoveryService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async searchDoctors(dto: any) {
    const specializationsFromSymptom = dto.symptom
      ? symptomMap[dto.symptom] || []
      : [];

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
          where: {
            appointments: {
              none: {
                status: { not: 'CANCELLED' },
              },
            },
          },
        },
      },
    });
  }

  async recommendDoctors(text: string) {
    const result = await this.gemini.recommendSpecializationsFromText(
      text || '',
    );

    const heuristicSpecs = this.gemini.heuristicFromText(text || '');
    const scoreMap = new Map<string, number>();

    for (const spec of [...result.specializations, ...heuristicSpecs]) {
      const current = scoreMap.get(spec.name) || 0;
      scoreMap.set(spec.name, Math.max(current, spec.confidence || 0));
    }

    const specs = Array.from(scoreMap.entries()).map(([name, confidence]) => ({
      name,
      confidence,
    }));

    const names = specs.map((s) => s.name);

    if (names.length === 0) {
      specs.push({ name: 'General Medicine', confidence: 0.5 });
      names.push('General Medicine');
      scoreMap.set('General Medicine', 0.5);
    }

    const doctors = await this.prisma.doctorProfile.findMany({
      where: {
        specializations: {
          some: {
            specialization: {
              name: { in: names },
            },
          },
        },
      },
      include: {
        specializations: { include: { specialization: true } },
        schedules: {
          where: {
            appointments: {
              none: {
                status: { not: 'CANCELLED' },
              },
            },
          },
        },
      },
    });

    const rankedDoctors = doctors
      .map((doctor) => {
        const matchedSpecializations = doctor.specializations
          .map((s) => s.specialization.name)
          .filter((name) => scoreMap.has(name));

        const confidence = matchedSpecializations.length
          ? Math.max(
              ...matchedSpecializations.map((name) => scoreMap.get(name) || 0),
            )
          : 0;

        const breadthBonus = Math.min(
          matchedSpecializations.length * 0.05,
          0.15,
        );

        return {
          ...doctor,
          recommendation: {
            confidence: Math.min(1, confidence + breadthBonus),
            source: result.source,
            raw: result.raw,
            matchedSpecializations,
          },
        };
      })
      .sort(
        (a, b) => b.recommendation.confidence - a.recommendation.confidence,
      );

    return rankedDoctors;
  }
}
