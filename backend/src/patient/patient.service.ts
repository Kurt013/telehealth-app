import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async findPatientById(id: string) {
    return this.prisma.patientProfile.findUnique({
      where: { id },
    });
  }
}