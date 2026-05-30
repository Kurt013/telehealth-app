import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ConsultationNoteDto } from './dto/consultation-note.dto';
import { PrescriptionDto } from './dto/prescription.dto';

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

  @Get('patient/:patientId/records')
  getPatientRecords(@Param('patientId') patientId: string) {
    return this.service.getPatientMedicalRecords(patientId);
  }

  @Get('doctor/:doctorId')
  getDoctorAppointments(@Param('doctorId') doctorId: string) {
    return this.service.getDoctorAppointments(doctorId);
  }

  @Get('doctor/:doctorId/records')
  getDoctorRecords(@Param('doctorId') doctorId: string) {
    return this.service.getDoctorMedicalRecords(doctorId);
  }

  @Get(':appointmentId')
  getOne(@Param('appointmentId') appointmentId: string) {
    return this.service.getAppointmentById(appointmentId);
  }

  @Patch(':appointmentId/reschedule')
  reschedule(
    @Param('appointmentId') appointmentId: string,
    @Body() body: RescheduleAppointmentDto,
  ) {
    return this.service.rescheduleAppointment(appointmentId, body);
  }

  @Patch(':appointmentId/cancel')
  cancel(@Param('appointmentId') appointmentId: string) {
    return this.service.cancelAppointment(appointmentId);
  }

  @Post(':appointmentId/session/join')
  joinSession(@Param('appointmentId') appointmentId: string) {
    return this.service.joinConsultationSession(appointmentId);
  }

  @Post(':appointmentId/session/end')
  endSession(@Param('appointmentId') appointmentId: string) {
    return this.service.endConsultationSession(appointmentId);
  }

  @Post(':appointmentId/doctors/:doctorId/notes')
  addNote(
    @Param('appointmentId') appointmentId: string,
    @Param('doctorId') doctorId: string,
    @Body() body: ConsultationNoteDto,
  ) {
    return this.service.addConsultationNote(appointmentId, doctorId, body);
  }

  @Post(':appointmentId/doctors/:doctorId/prescriptions')
  addPrescription(
    @Param('appointmentId') appointmentId: string,
    @Param('doctorId') doctorId: string,
    @Body() body: PrescriptionDto,
  ) {
    return this.service.addPrescription(appointmentId, doctorId, body);
  }
}
