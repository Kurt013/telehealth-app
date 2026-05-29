import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  @Post()
  book(@Body() body: CreateAppointmentDto) {
    return this.service.bookAppointment(body);
  }

  @Get('me/:patientId')
  getMyAppointments(@Param('patientId') patientId: string) {
    return this.service.getPatientAppointments(patientId);
  }
}
