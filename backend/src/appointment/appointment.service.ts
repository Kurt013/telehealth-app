import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ConsultationNoteDto } from './dto/consultation-note.dto';
import { PrescriptionDto } from './dto/prescription.dto';
import { NotificationService } from '../notification/notification.service';
import { GoogleMeetService } from '../google-meet/google-meet.service';

type AppointmentInclude = {
  patient: { include: { account: true; medicalHistory: true } };
  doctor: {
    include: {
      account: true;
      specializations: { include: { specialization: true } };
    };
  };
  schedule: true;
  consultationSession: true;
  consultationNote: true;
  prescription: true;
};

const appointmentInclude: AppointmentInclude = {
  patient: { include: { account: true, medicalHistory: true } },
  doctor: {
    include: {
      account: true,
      specializations: { include: { specialization: true } },
    },
  },
  schedule: true,
  consultationSession: true,
  consultationNote: true,
  prescription: true,
};

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly googleMeet: GoogleMeetService,
  ) {}

  private getJoinLink(appointmentId: string) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontend}/consultation/${appointmentId}`;
  }

  private getMeetSessionId(appointmentId: string) {
    return `session-${appointmentId}`;
  }

  private getFallbackMeetLink(appointmentId: string) {
    return this.getJoinLink(appointmentId);
  }

  private async attachGoogleMeetToSession(appointment: any) {
    const session = appointment.consultationSession;

    const meetingInput = {
      summary: `Consultation: ${appointment.doctor.firstName} ${appointment.doctor.lastName} with ${appointment.patient.firstName} ${appointment.patient.lastName}`,
      description: appointment.reason || 'Telehealth consultation',
      startTime: new Date(appointment.schedule.startTime),
      endTime: new Date(appointment.schedule.endTime),
      attendees: [
        appointment.patient.account.email,
        appointment.doctor.account.email,
      ].filter(Boolean),
    };

    const meeting = session?.calendarEventId
      ? await this.googleMeet.updateMeeting(
          session.calendarEventId,
          meetingInput,
        )
      : await this.googleMeet.createMeeting(meetingInput);

    if (!meeting) {
      const fallbackLink = this.getFallbackMeetLink(appointment.id);
      await (this.prisma as any).consultationSession.update({
        where: { appointmentId: appointment.id },
        data: {
          meetingLink: fallbackLink,
          meetingId: this.getMeetSessionId(appointment.id),
          calendarEventId: null,
        },
      });

      return {
        meetingLink: fallbackLink,
        meetingId: this.getMeetSessionId(appointment.id),
        calendarEventId: null,
      };
    }

    await (this.prisma as any).consultationSession.update({
      where: { appointmentId: appointment.id },
      data: {
        meetingLink: meeting.meetingLink,
        meetingId: meeting.meetingId,
        calendarEventId: meeting.calendarEventId,
      },
    });

    return meeting;
  }

  private async loadAppointment(appointmentId: string) {
    return (this.prisma as any).appointment.findUnique({
      where: { id: appointmentId },
      include: appointmentInclude as any,
    });
  }

  private async notifyAppointmentParticipants(
    appointment: any,
    payload: {
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
    },
  ) {
    const tasks = [
      this.notifications.createNotification(
        appointment.patient.accountId,
        payload,
      ),
      this.notifications.createNotification(
        appointment.doctor.accountId,
        payload,
      ),
    ];

    await Promise.all(tasks);
  }

  async bookAppointment(data: CreateAppointmentDto) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: data.patientId },
      include: { account: true },
    });

    if (!patient) {
      throw new BadRequestException(
        'Invalid patientId. Use the PatientProfile id, not the Account id.',
      );
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: data.doctorId },
      include: { account: true },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { id: data.scheduleId },
    });

    if (!schedule) {
      throw new BadRequestException('Schedule not available');
    }

    if (schedule.doctorId !== data.doctorId) {
      throw new BadRequestException(
        'Schedule does not belong to the selected doctor',
      );
    }

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        scheduleId: data.scheduleId,
        status: { not: 'CANCELLED' },
      },
    });

    if (existingAppointment) {
      throw new BadRequestException('Schedule not available');
    }

    const meetingInput = {
      summary: `Consultation: ${doctor.firstName} ${doctor.lastName} with ${patient.firstName} ${patient.lastName}`,
      description: data.reason || 'Telehealth consultation',
      startTime: new Date(schedule.startTime),
      endTime: new Date(schedule.endTime),
      attendees: [patient.account?.email, doctor.account?.email].filter(
        Boolean,
      ),
    };

    const meeting = await this.googleMeet.createMeeting(meetingInput);

    if (!meeting?.meetingLink || !meeting?.meetingId) {
      throw new BadRequestException(
        'Google Meet generation failed. Appointment was not booked.',
      );
    }

    let created: any = null;

    try {
      created = await this.prisma.$transaction(async (tx) => {
        const txAny = tx as any;

        const recheckSchedule = await txAny.doctorSchedule.findUnique({
          where: { id: data.scheduleId },
        });

        if (!recheckSchedule || recheckSchedule.doctorId !== data.doctorId) {
          throw new BadRequestException('Schedule not available');
        }

        const recheckExistingAppointment = await txAny.appointment.findFirst({
          where: {
            scheduleId: data.scheduleId,
            status: { not: 'CANCELLED' },
          },
        });

        if (recheckExistingAppointment) {
          throw new BadRequestException('Schedule not available');
        }

        const appointment = await txAny.appointment.create({
          data: {
            patientId: data.patientId,
            doctorId: data.doctorId,
            scheduleId: data.scheduleId,
            reason: data.reason,
            status: 'CONFIRMED',
          },
        });

        await txAny.consultationSession.create({
          data: {
            appointmentId: appointment.id,
            meetingLink: meeting.meetingLink,
            meetingId: meeting.meetingId,
            status: 'SCHEDULED',
          },
        });

        if (meeting.calendarEventId) {
          await txAny.consultationSession.update({
            where: { appointmentId: appointment.id },
            data: { calendarEventId: meeting.calendarEventId },
          });
        }

        return txAny.appointment.findUnique({
          where: { id: appointment.id },
          include: appointmentInclude as any,
        });
      });
    } catch (error) {
      if (meeting.calendarEventId) {
        await this.googleMeet
          .cancelMeeting(meeting.calendarEventId)
          .catch(() => undefined);
      }

      throw error;
    }

    if (created) {
      await this.notifyAppointmentParticipants(created, {
        type: 'APPOINTMENT_BOOKED',
        title: 'Appointment booked',
        message: `Your appointment for ${created.schedule.startTime.toISOString()} has been booked.`,
        metadata: { appointmentId: created.id },
      });

      await this.notifyAppointmentParticipants(created, {
        type: 'SESSION_READY',
        title: 'Consultation session ready',
        message: 'Your consultation session link is now available.',
        metadata: {
          appointmentId: created.id,
          meetingLink: created.consultationSession?.meetingLink,
        },
      });
    }

    return created;
  }

  async rescheduleAppointment(
    appointmentId: string,
    data: RescheduleAppointmentDto,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      const appointment = await txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          schedule: true,
          consultationSession: true,
          patient: true,
          doctor: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (
        appointment.status === 'CANCELLED' ||
        appointment.status === 'COMPLETED'
      ) {
        throw new BadRequestException(
          'Appointment can no longer be rescheduled',
        );
      }

      const newSchedule = await txAny.doctorSchedule.findUnique({
        where: { id: data.scheduleId },
      });

      const existingAppointment = await txAny.appointment.findFirst({
        where: {
          scheduleId: data.scheduleId,
          status: { not: 'CANCELLED' },
        },
      });

      if (!newSchedule || existingAppointment) {
        throw new BadRequestException('New schedule not available');
      }

      if (newSchedule.doctorId !== appointment.doctorId) {
        throw new BadRequestException(
          'New schedule must belong to the same doctor',
        );
      }

      await txAny.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduleId: data.scheduleId,
          status: 'CONFIRMED',
        },
      });

      await txAny.consultationSession.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          meetingLink: this.getFallbackMeetLink(appointmentId),
          meetingId: this.getMeetSessionId(appointmentId),
          status: 'SCHEDULED',
        },
        update: {
          meetingLink: this.getFallbackMeetLink(appointmentId),
          meetingId: this.getMeetSessionId(appointmentId),
          status: 'SCHEDULED',
        },
      });

      return txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: appointmentInclude as any,
      });
    });

    if (updated) {
      const enriched = await this.attachGoogleMeetToSession(updated);
      updated.consultationSession = {
        ...(updated.consultationSession as any),
        meetingLink: enriched.meetingLink,
        meetingId: enriched.meetingId,
        calendarEventId: enriched.calendarEventId,
      };

      await this.notifyAppointmentParticipants(updated, {
        type: 'APPOINTMENT_RESCHEDULED',
        title: 'Appointment rescheduled',
        message: 'Your appointment time has been updated.',
        metadata: { appointmentId: updated.id, scheduleId: updated.scheduleId },
      });
    }

    return updated;
  }

  async cancelAppointment(appointmentId: string) {
    const cancelled = await this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      const appointment = await txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          schedule: true,
          consultationSession: true,
          patient: true,
          doctor: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.status === 'CANCELLED') {
        throw new BadRequestException('Appointment is already cancelled');
      }

      await txAny.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      });

      await txAny.consultationSession.updateMany({
        where: { appointmentId },
        data: {
          status: 'CANCELLED',
          endedAt: new Date(),
        },
      });

      return txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: appointmentInclude as any,
      });
    });

    if (cancelled) {
      const session = (cancelled as any).consultationSession;
      if (session?.calendarEventId) {
        await this.googleMeet.cancelMeeting(session.calendarEventId);
      }

      await this.notifyAppointmentParticipants(cancelled, {
        type: 'APPOINTMENT_CANCELLED',
        title: 'Appointment cancelled',
        message: 'Your appointment has been cancelled.',
        metadata: { appointmentId: cancelled.id },
      });
    }

    return cancelled;
  }

  async joinConsultationSession(appointmentId: string) {
    const session = await this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      const appointment = await txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          consultationSession: true,
          patient: true,
          doctor: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.status === 'CANCELLED') {
        throw new BadRequestException(
          'Cancelled appointments cannot be joined',
        );
      }

      const consultationSession =
        appointment.consultationSession ??
        (await txAny.consultationSession.create({
          data: {
            appointmentId,
            meetingLink: this.getFallbackMeetLink(appointmentId),
            meetingId: this.getMeetSessionId(appointmentId),
            status: 'SCHEDULED',
          },
        }));

      await txAny.consultationSession.update({
        where: { appointmentId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: consultationSession.startedAt ?? new Date(),
          meetingLink: consultationSession.meetingLink,
          meetingId: this.getMeetSessionId(appointmentId),
        },
      });

      await txAny.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CONFIRMED',
        },
      });

      return txAny.consultationSession.findUnique({
        where: { appointmentId },
        include: {
          appointment: {
            include: appointmentInclude,
          },
        },
      });
    });

    if (session?.appointment) {
      await this.notifyAppointmentParticipants(session.appointment, {
        type: 'SESSION_STARTED',
        title: 'Consultation session started',
        message: 'Your consultation session is now in progress.',
        metadata: { appointmentId },
      });
    }

    return session;
  }

  async endConsultationSession(appointmentId: string) {
    const session = await this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      const appointment = await txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          consultationSession: true,
          patient: true,
          doctor: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      await txAny.consultationSession.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          meetingLink: this.getFallbackMeetLink(appointmentId),
          meetingId: this.getMeetSessionId(appointmentId),
          status: 'ENDED',
          endedAt: new Date(),
        },
        update: {
          status: 'ENDED',
          endedAt: new Date(),
        },
      });

      await txAny.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });

      return txAny.consultationSession.findUnique({
        where: { appointmentId },
        include: {
          appointment: {
            include: appointmentInclude,
          },
        },
      });
    });

    if (session?.appointment) {
      await this.notifyAppointmentParticipants(session.appointment, {
        type: 'SESSION_ENDED',
        title: 'Consultation session ended',
        message: 'Your consultation session has ended.',
        metadata: { appointmentId },
      });
    }

    return session;
  }

  async addConsultationNote(
    appointmentId: string,
    doctorId: string,
    data: ConsultationNoteDto,
  ) {
    const note = await this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      const appointment = await txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      return txAny.consultationNote.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          doctorId,
          patientId: appointment.patientId,
          summary: data.summary,
          findings: data.findings,
          recommendations: data.recommendations,
        },
        update: {
          summary: data.summary,
          findings: data.findings,
          recommendations: data.recommendations,
        },
      });
    });

    const appointment = await this.loadAppointment(appointmentId);

    if (appointment) {
      await this.notifyAppointmentParticipants(appointment, {
        type: 'NOTE_CREATED',
        title: 'Consultation note saved',
        message: 'A doctor note has been added to your appointment.',
        metadata: { appointmentId, noteId: note.id },
      });
    }

    return note;
  }

  async addPrescription(
    appointmentId: string,
    doctorId: string,
    data: PrescriptionDto,
  ) {
    const prescription = await this.prisma.$transaction(async (tx) => {
      const txAny = tx as any;

      const appointment = await txAny.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      return txAny.prescription.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          doctorId,
          patientId: appointment.patientId,
          diagnosis: data.diagnosis,
          instructions: data.instructions,
          medications: data.medications,
        },
        update: {
          diagnosis: data.diagnosis,
          instructions: data.instructions,
          medications: data.medications,
        },
      });
    });

    const appointment = await this.loadAppointment(appointmentId);

    if (appointment) {
      await this.notifyAppointmentParticipants(appointment, {
        type: 'PRESCRIPTION_CREATED',
        title: 'Prescription added',
        message: 'A prescription has been added to your appointment.',
        metadata: { appointmentId, prescriptionId: prescription.id },
      });
    }

    return prescription;
  }

  async getPatientAppointments(patientId: string) {
    return (this.prisma as any).appointment.findMany({
      where: { patientId },
      include: appointmentInclude as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDoctorAppointments(doctorId: string) {
    return (this.prisma as any).appointment.findMany({
      where: { doctorId },
      include: appointmentInclude as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAppointmentById(appointmentId: string) {
    const appointment = await this.loadAppointment(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async getPatientMedicalRecords(patientId: string) {
    return (this.prisma as any).appointment.findMany({
      where: { patientId, status: { not: 'CANCELLED' } },
      include: appointmentInclude as any,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getDoctorMedicalRecords(doctorId: string) {
    return (this.prisma as any).appointment.findMany({
      where: { doctorId, status: { not: 'CANCELLED' } },
      include: appointmentInclude as any,
      orderBy: { updatedAt: 'desc' },
    });
  }
}
