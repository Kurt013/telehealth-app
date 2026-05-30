import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Observable, Subject } from 'rxjs';

export type NotificationPayload = {
  type:
    | 'APPOINTMENT_BOOKED'
    | 'APPOINTMENT_RESCHEDULED'
    | 'APPOINTMENT_CANCELLED'
    | 'SESSION_READY'
    | 'SESSION_STARTED'
    | 'SESSION_ENDED'
    | 'NOTE_CREATED'
    | 'PRESCRIPTION_CREATED';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private readonly streams = new Map<string, Subject<MessageEvent>>();
  private reminderTimer?: NodeJS.Timeout;
  private readonly sentUpcomingReminderKeys = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.sendUpcomingAppointmentReminders().catch((error) => {
      this.logger.warn(
        `Initial upcoming appointment reminder scan failed: ${error?.message ?? error}`,
      );
    });

    this.reminderTimer = setInterval(() => {
      void this.sendUpcomingAppointmentReminders().catch((error) => {
        this.logger.warn(
          `Upcoming appointment reminder scan failed: ${error?.message ?? error}`,
        );
      });
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
    }
  }

  private getStream(accountId: string) {
    let stream = this.streams.get(accountId);

    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.streams.set(accountId, stream);
    }

    return stream;
  }

  streamNotifications(accountId: string): Observable<MessageEvent> {
    return this.getStream(accountId).asObservable();
  }

  async createNotification(accountId: string, payload: NotificationPayload) {
    const notification = await (this.prisma as any).notification.create({
      data: {
        accountId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata ?? undefined,
      },
    });

    this.getStream(accountId).next({
      type: 'message',
      data: notification,
    });

    return notification;
  }

  async listNotifications(accountId: string) {
    const notifications = await (this.prisma as any).notification.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((notification: any) => ({
      ...notification,
      isRead: Boolean(notification.readAt),
    }));
  }

  async markAsRead(notificationId: string, accountId: string) {
    const notification = await (this.prisma as any).notification.findFirst({
      where: { id: notificationId, accountId },
    });

    if (!notification) {
      return null;
    }

    return (this.prisma as any).notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
  }

  notifyError(accountId: string, message: string) {
    this.logger.warn(`Notification stream issue for ${accountId}: ${message}`);
  }

  private async sendUpcomingAppointmentReminders() {
    const now = new Date();
    const reminderCutoff = new Date(now.getTime() + 15 * 60 * 1000);

    const appointments = await (this.prisma as any).appointment.findMany({
      where: {
        status: 'CONFIRMED',
        schedule: {
          startTime: {
            gte: now,
            lte: reminderCutoff,
          },
        },
      },
      include: {
        patient: { include: { account: true } },
        doctor: { include: { account: true } },
        schedule: true,
      },
    });

    for (const appointment of appointments) {
      const reminderKey = `upcoming:${appointment.id}`;

      if (this.sentUpcomingReminderKeys.has(reminderKey)) {
        continue;
      }

      this.sentUpcomingReminderKeys.add(reminderKey);

      const message = `Your appointment starts at ${new Date(appointment.schedule.startTime).toLocaleString()}.`;

      await Promise.all([
        this.createNotification(appointment.patient.accountId, {
          type: 'SESSION_READY',
          title: 'Upcoming appointment',
          message,
          metadata: { appointmentId: appointment.id, role: 'PATIENT' },
        }),
        this.createNotification(appointment.doctor.accountId, {
          type: 'SESSION_READY',
          title: 'Upcoming appointment',
          message,
          metadata: { appointmentId: appointment.id, role: 'DOCTOR' },
        }),
      ]);
    }
  }
}
