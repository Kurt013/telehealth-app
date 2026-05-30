import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { NotificationModule } from '../notification/notification.module';
import { GoogleMeetModule } from '../google-meet/google-meet.module';

@Module({
  imports: [PrismaModule, ScheduleModule, NotificationModule, GoogleMeetModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
