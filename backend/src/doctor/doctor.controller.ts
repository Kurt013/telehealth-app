import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { FindDoctorsDto } from './dto/find-doctors.dto';
import { GetSchedulesDto } from './dto/get-schedules.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('doctors')
export class DoctorController {
  constructor(private service: DoctorService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return this.service.findDoctorByAccountId(req.user.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Request() req: any, @Body() body: UpdateDoctorProfileDto) {
    return this.service.updateDoctorProfileByAccountId(req.user.userId, body);
  }

  // Discovery (search/filter)
  @Get()
  getDoctors(@Query() query: FindDoctorsDto) {
    return this.service.findDoctors(
      query.search,
      query.specialization,
      query.symptom,
    );
  }

  // Doctor profile
  @Get(':id')
  getDoctor(@Param('id') id: string) {
    return this.service.findDoctorById(id);
  }

  // Doctor schedules
  @Get(':id/schedules')
  getSchedules(@Param('id') id: string, @Query() query: GetSchedulesDto) {
    return this.service.getSchedules(id, query.date);
  }

  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() body: UpdateDoctorProfileDto) {
    return this.service.updateDoctorProfile(id, body);
  }
}
