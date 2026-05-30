import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from './dto/manage-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // normalize date/time input
  private normalize(input: string, baseDate = new Date()): Date {
    // full ISO datetime
    if (input.includes('T')) {
      return new Date(input);
    }

    // time only (HH:mm)
    if (/^\d{2}:\d{2}$/.test(input)) {
      const [hours, minutes] = input.split(':').map(Number);
      const date = new Date(baseDate);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    // date only (YYYY-MM-DD)
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private async ensureNoOverlap(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: string,
  ) {
    const overlapping = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        'Schedule overlaps with an existing availability slot',
      );
    }
  }

  async createDoctorSchedule(doctorId: string, data: CreateDoctorScheduleDto) {
    const startTime = this.normalize(data.startTime);
    const endTime = this.normalize(data.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Schedule endTime must be after startTime');
    }

    await this.ensureNoOverlap(doctorId, startTime, endTime);

    return this.prisma.doctorSchedule.create({
      data: {
        doctorId,
        startTime,
        endTime,
      },
    });
  }

  async createDoctorScheduleByAccountId(
    accountId: string,
    data: CreateDoctorScheduleDto,
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { accountId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.createDoctorSchedule(doctor.id, data);
  }

  async updateDoctorSchedule(
    doctorId: string,
    scheduleId: string,
    data: UpdateDoctorScheduleDto,
  ) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.doctorId !== doctorId) {
      throw new NotFoundException('Schedule not found');
    }

    const bookedAppointment = await this.prisma.appointment.findFirst({
      where: {
        scheduleId,
        status: { not: 'CANCELLED' },
      },
    });

    if (bookedAppointment) {
      throw new BadRequestException('Booked schedules cannot be edited');
    }

    const startTime = data.startTime
      ? this.normalize(data.startTime)
      : schedule.startTime;
    const endTime = data.endTime
      ? this.normalize(data.endTime)
      : schedule.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('Schedule endTime must be after startTime');
    }

    await this.ensureNoOverlap(doctorId, startTime, endTime, scheduleId);

    return this.prisma.doctorSchedule.update({
      where: { id: scheduleId },
      data: {
        startTime,
        endTime,
      },
    });
  }

  async updateDoctorScheduleByAccountId(
    accountId: string,
    scheduleId: string,
    data: UpdateDoctorScheduleDto,
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { accountId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.updateDoctorSchedule(doctor.id, scheduleId, data);
  }

  async deleteDoctorSchedule(doctorId: string, scheduleId: string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.doctorId !== doctorId) {
      throw new NotFoundException('Schedule not found');
    }

    const bookedAppointment = await this.prisma.appointment.findFirst({
      where: {
        scheduleId,
        status: { not: 'CANCELLED' },
      },
    });

    if (bookedAppointment) {
      throw new BadRequestException('Booked schedules cannot be deleted');
    }

    return this.prisma.doctorSchedule.delete({
      where: { id: scheduleId },
    });
  }

  async deleteDoctorScheduleByAccountId(accountId: string, scheduleId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { accountId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.deleteDoctorSchedule(doctor.id, scheduleId);
  }

  async getAvailableSchedulesByAccountId(
    accountId: string,
    from?: string,
    to?: string,
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { accountId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.getAvailableSchedules(doctor.id, from, to);
  }

  async getAvailableSchedules(doctorId: string, from?: string, to?: string) {
    let start: Date | undefined;
    let end: Date | undefined;

    if (from) {
      start = this.normalize(from);
    }

    if (to) {
      end = this.normalize(to);
    }

    const where: any = {
      doctorId,
      appointments: {
        none: {
          status: { not: 'CANCELLED' },
        },
      },
    };

    if (start || end) {
      where.AND = [];

      if (end) {
        where.AND.push({
          startTime: {
            lt: end,
          },
        });
      }

      if (start) {
        where.AND.push({
          endTime: {
            gt: start,
          },
        });
      }
    }

    return this.prisma.doctorSchedule.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });
  }
}
