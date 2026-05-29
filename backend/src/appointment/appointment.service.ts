import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    private prisma: PrismaService,
    private scheduleService: ScheduleService,
  ) {}

  async bookAppointment(data: CreateAppointmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.doctorSchedule.findUnique({
        where: { id: data.scheduleId },
      });

      if (!schedule || schedule.isBooked) {
        throw new BadRequestException('Schedule not available');
      }

      await tx.doctorSchedule.update({
        where: { id: data.scheduleId },
        data: { isBooked: true },
      });

      return tx.appointment.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          scheduleId: data.scheduleId,
          reason: data.reason,
        },
      });
    });
  }

  async getPatientAppointments(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  }
}
