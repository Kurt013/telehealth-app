import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleMeController } from './schedule-me.controller';
import { ScheduleService } from './schedule.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScheduleController, ScheduleMeController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
