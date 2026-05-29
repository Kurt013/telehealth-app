import { Module } from '@nestjs/common';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DoctorDiscoveryController],
  providers: [DoctorDiscoveryService],
})
export class DoctorDiscoveryModule {}
