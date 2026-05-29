import { Module } from '@nestjs/common';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [DoctorDiscoveryController],
  providers: [DoctorDiscoveryService],
})
export class DoctorDiscoveryModule {}
