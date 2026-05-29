import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
