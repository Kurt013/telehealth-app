import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleRangeDto } from './dto/get-schedules.dto';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from './dto/manage-schedule.dto';

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

  @Post()
  createSchedule(
    @Param('doctorId') doctorId: string,
    @Body() body: CreateDoctorScheduleDto,
  ) {
    return this.scheduleService.createDoctorSchedule(doctorId, body);
  }

  @Patch(':scheduleId')
  updateSchedule(
    @Param('doctorId') doctorId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() body: UpdateDoctorScheduleDto,
  ) {
    return this.scheduleService.updateDoctorSchedule(
      doctorId,
      scheduleId,
      body,
    );
  }

  @Delete(':scheduleId')
  deleteSchedule(
    @Param('doctorId') doctorId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.scheduleService.deleteDoctorSchedule(doctorId, scheduleId);
  }
}
