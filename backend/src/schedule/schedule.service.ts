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

  private async resolveDoctorId(doctorIdOrAccountId: string) {
    const byDoctorId = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorIdOrAccountId },
      select: { id: true },
    });

    if (byDoctorId) {
      return byDoctorId.id;
    }

    const byAccountId = await this.prisma.doctorProfile.findUnique({
      where: { accountId: doctorIdOrAccountId },
      select: { id: true },
    });

    if (byAccountId) {
      return byAccountId.id;
    }

    const account = await this.prisma.account.findUnique({
      where: { id: doctorIdOrAccountId },
      select: { id: true, role: true },
    });

    if (account?.role === 'DOCTOR') {
      // Auto-create a minimal doctor profile for legacy accounts that have
      // an Account with role DOCTOR but no DoctorProfile row yet. This keeps
      // schedule creation and other doctor flows working for migrated data.
      // Attempt to read the account email if available; fall back to a
      // generic name if not present.
      const accountWithEmail = await this.prisma.account.findUnique({
        where: { id: account.id },
        select: { email: true },
      });

      const emailLocal = accountWithEmail?.email
        ? accountWithEmail.email.split('@')[0]
        : 'doctor';

      const created = await this.prisma.doctorProfile.create({
        data: {
          accountId: account.id,
          firstName: String(emailLocal).slice(0, 50) || 'Doctor',
          lastName: 'User',
        },
        select: { id: true },
      });

      return created.id;
    }

    throw new NotFoundException('Doctor profile not found');
  }

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
    const resolvedDoctorId = await this.resolveDoctorId(doctorId);
    return this.createScheduleForDoctorId(resolvedDoctorId, data);
  }

  private async createScheduleForDoctorId(
    resolvedDoctorId: string,
    data: CreateDoctorScheduleDto,
  ) {
    const startTime = this.normalize(data.startTime);
    const endTime = this.normalize(data.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Schedule endTime must be after startTime');
    }

    await this.ensureNoOverlap(resolvedDoctorId, startTime, endTime);

    return this.prisma.doctorSchedule.create({
      data: {
        doctorId: resolvedDoctorId,
        startTime,
        endTime,
      },
    });
  }

  async createDoctorScheduleByAccountId(
    accountId: string,
    data: CreateDoctorScheduleDto,
  ) {
    const resolvedDoctorId = await this.resolveDoctorId(accountId);

    return this.createScheduleForDoctorId(resolvedDoctorId, data);
  }

  async updateDoctorSchedule(
    doctorId: string,
    scheduleId: string,
    data: UpdateDoctorScheduleDto,
  ) {
    const resolvedDoctorId = await this.resolveDoctorId(doctorId);
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.doctorId !== resolvedDoctorId) {
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

    await this.ensureNoOverlap(
      resolvedDoctorId,
      startTime,
      endTime,
      scheduleId,
    );

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
    const resolvedDoctorId = await this.resolveDoctorId(accountId);

    return this.updateDoctorSchedule(resolvedDoctorId, scheduleId, data);
  }

  async deleteDoctorSchedule(doctorId: string, scheduleId: string) {
    const resolvedDoctorId = await this.resolveDoctorId(doctorId);
    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.doctorId !== resolvedDoctorId) {
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
    const resolvedDoctorId = await this.resolveDoctorId(accountId);

    return this.deleteDoctorSchedule(resolvedDoctorId, scheduleId);
  }

  async getAvailableSchedulesByAccountId(
    accountId: string,
    from?: string,
    to?: string,
  ) {
    const resolvedDoctorId = await this.resolveDoctorId(accountId);

    return this.getAvailableSchedules(resolvedDoctorId, from, to);
  }

  async getAvailableSchedules(doctorId: string, from?: string, to?: string) {
    const resolvedDoctorId = await this.resolveDoctorId(doctorId);
    let start: Date | undefined;
    let end: Date | undefined;

    if (from) {
      start = this.normalize(from);
    }

    if (to) {
      end = this.normalize(to);
    }

    const where: any = {
      doctorId: resolvedDoctorId,
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
