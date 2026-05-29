import { Controller, Get, Param, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleRangeDto } from './dto/get-schedules.dto';

@Controller('doctors/:doctorId/schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  getSchedules(
    @Param('doctorId') doctorId: string,
    @Query() query: ScheduleRangeDto,
  ) {
    return this.scheduleService.getAvailableSchedules(
      doctorId,
      query.from,
      query.to,
    );
  }
}
