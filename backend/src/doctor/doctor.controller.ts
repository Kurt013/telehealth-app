import { Controller, Get, Param, Query } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { FindDoctorsDto } from './dto/find-doctors.dto';
import { GetSchedulesDto } from './dto/get-schedules.dto';

@Controller('doctors')
export class DoctorController {
  constructor(private service: DoctorService) {}

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
}
