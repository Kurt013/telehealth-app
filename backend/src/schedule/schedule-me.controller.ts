import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from './dto/manage-schedule.dto';
import { ScheduleRangeDto } from './dto/get-schedules.dto';
import { ScheduleService } from './schedule.service';

@Controller('doctors/me/schedules')
export class ScheduleMeController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getMySchedules(@Request() req: any, @Query() query: ScheduleRangeDto) {
    return this.scheduleService.getAvailableSchedulesByAccountId(
      req.user.userId,
      query.from,
      query.to,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createMySchedule(@Request() req: any, @Body() body: CreateDoctorScheduleDto) {
    return this.scheduleService.createDoctorScheduleByAccountId(
      req.user.userId,
      body,
    );
  }

  @Patch(':scheduleId')
  @UseGuards(JwtAuthGuard)
  updateMySchedule(
    @Request() req: any,
    @Param('scheduleId') scheduleId: string,
    @Body() body: UpdateDoctorScheduleDto,
  ) {
    return this.scheduleService.updateDoctorScheduleByAccountId(
      req.user.userId,
      scheduleId,
      body,
    );
  }

  @Delete(':scheduleId')
  @UseGuards(JwtAuthGuard)
  deleteMySchedule(
    @Request() req: any,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.scheduleService.deleteDoctorScheduleByAccountId(
      req.user.userId,
      scheduleId,
    );
  }
}
