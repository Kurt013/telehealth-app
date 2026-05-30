import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async findPatientById(id: string) {
    return this.prisma.patientProfile.findUnique({
      where: { id },
      include: {
        account: true,
        medicalHistory: true,
        appointments: true,
      },
    });
  }

  async findPatientByAccountId(accountId: string) {
    return this.prisma.patientProfile.findUnique({
      where: { accountId },
      include: {
        account: true,
        medicalHistory: true,
        appointments: true,
      },
    });
  }

  async updatePatientProfile(id: string, data: UpdatePatientProfileDto) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const medicalHistory = data.medicalHistory
      ? data.medicalHistory.filter((condition) => condition && condition.trim())
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      await txAny.patientProfile.update({
        where: { id },
        data: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          birthday: data.birthday ? new Date(data.birthday) : undefined,
          weight: data.weight,
          height: data.height,
          profilePicture: data.profilePicture,
          phone: data.phone,
          address: data.address,
          emergencyName: data.emergencyName,
          emergencyPhone: data.emergencyPhone,
        },
      });

      if (medicalHistory) {
        await txAny.medicalHistory.deleteMany({
          where: { patientId: id },
        });

        if (medicalHistory.length > 0) {
          await txAny.medicalHistory.createMany({
            data: medicalHistory.map((condition: string) => ({
              patientId: id,
              condition,
            })),
          });
        }
      }

      return txAny.patientProfile.findUnique({
        where: { id },
        include: {
          account: true,
          medicalHistory: true,
          appointments: true,
        },
      });
    });
  }

  async updatePatientProfileByAccountId(
    accountId: string,
    data: UpdatePatientProfileDto,
  ) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { accountId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return this.updatePatientProfile(patient.id, data);
  }
}
