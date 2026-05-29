import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async getAvailableSchedules(
    doctorId: string,
    from?: string,
    to?: string,
  ) {
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
      isBooked: false,
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