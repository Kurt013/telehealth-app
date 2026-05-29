import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
