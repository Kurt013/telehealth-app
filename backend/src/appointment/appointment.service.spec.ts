// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';
import { NotificationService } from '../notification/notification.service';
import { GoogleMeetService } from '../google-meet/google-meet.service';

// Mock Prisma and ScheduleService
const mockTx = {
  doctorSchedule: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  appointment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  consultationSession: {
    create: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  consultationNote: {
    upsert: jest.fn(),
  },
  prescription: {
    upsert: jest.fn(),
  },
};

const prismaMock: any = {
  $transaction: jest.fn(async (fn: any) => fn(mockTx)),
  patientProfile: { findUnique: jest.fn() },
  doctorProfile: { findUnique: jest.fn() },
  doctorSchedule: { findUnique: jest.fn() },
  appointment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  consultationSession: { update: jest.fn() },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const scheduleServiceMock = {};
const notificationServiceMock = {
  createNotification: jest.fn(),
  listNotifications: jest.fn(),
  markAsRead: jest.fn(),
  streamNotifications: jest.fn(),
};
const googleMeetServiceMock = {
  createMeeting: jest.fn(),
  updateMeeting: jest.fn(),
  cancelMeeting: jest.fn(),
  hasGoogleAuth: jest.fn(),
};

describe('AppointmentService', () => {
  let service: AppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ScheduleService, useValue: scheduleServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: GoogleMeetService, useValue: googleMeetServiceMock },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('books an appointment when schedule available', async () => {
    prismaMock.patientProfile.findUnique.mockResolvedValue({
      id: 'p1',
      account: { email: 'patient@example.com' },
      firstName: 'Pat',
      lastName: 'Ient',
    });
    prismaMock.doctorProfile.findUnique.mockResolvedValue({
      id: 'd1',
      account: { email: 'doctor@example.com' },
      firstName: 'Doc',
      lastName: 'Tor',
    });
    prismaMock.doctorSchedule.findUnique.mockResolvedValue({
      id: 's1',
      doctorId: 'd1',
    });
    prismaMock.appointment.findFirst.mockResolvedValue(null);
    mockTx.doctorSchedule.findUnique.mockResolvedValue({
      id: 's1',
      doctorId: 'd1',
    });
    mockTx.appointment.findFirst.mockResolvedValue(null);
    mockTx.appointment.create.mockResolvedValue({ id: 'a1' });
    mockTx.consultationSession.create.mockResolvedValue({
      appointmentId: 'a1',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      meetingId: 'abc-defg-hij',
    });
    googleMeetServiceMock.createMeeting.mockResolvedValue({
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      meetingId: 'abc-defg-hij',
      calendarEventId: 'event-1',
    });
    mockTx.appointment.findUnique.mockResolvedValue({
      id: 'a1',
      schedule: {
        startTime: new Date('2024-01-01T09:00:00.000Z'),
        endTime: new Date('2024-01-01T10:00:00.000Z'),
      },
      patient: {
        accountId: 'p-account',
        firstName: 'Pat',
        lastName: 'Ient',
        account: { email: 'patient@example.com' },
      },
      doctor: {
        accountId: 'd-account',
        firstName: 'Doc',
        lastName: 'Tor',
        account: { email: 'doctor@example.com' },
      },
      consultationSession: {
        appointmentId: 'a1',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        meetingId: 'abc-defg-hij',
        calendarEventId: 'event-1',
      },
    });

    const result = await service.bookAppointment({
      patientId: 'p1',
      doctorId: 'd1',
      scheduleId: 's1',
    } as any);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(mockTx.doctorSchedule.findUnique).toHaveBeenCalledWith({
      where: { id: 's1' },
    });
    expect(mockTx.appointment.create).toHaveBeenCalledWith({
      data: {
        patientId: 'p1',
        doctorId: 'd1',
        scheduleId: 's1',
        reason: undefined,
        status: 'CONFIRMED',
      },
    });
    expect(mockTx.consultationSession.create).toHaveBeenCalledWith({
      data: {
        appointmentId: 'a1',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        meetingId: 'abc-defg-hij',
        status: 'SCHEDULED',
      },
    });
    expect(googleMeetServiceMock.createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'Consultation: Doc Tor with Pat Ient',
        description: 'Telehealth consultation',
        attendees: ['patient@example.com', 'doctor@example.com'],
      }),
    );
    expect(mockTx.consultationSession.update).toHaveBeenCalledWith({
      where: { appointmentId: 'a1' },
      data: {
        calendarEventId: 'event-1',
      },
    });
    expect(result).toEqual({
      id: 'a1',
      schedule: {
        startTime: new Date('2024-01-01T09:00:00.000Z'),
        endTime: new Date('2024-01-01T10:00:00.000Z'),
      },
      patient: {
        accountId: 'p-account',
        firstName: 'Pat',
        lastName: 'Ient',
        account: { email: 'patient@example.com' },
      },
      doctor: {
        accountId: 'd-account',
        firstName: 'Doc',
        lastName: 'Tor',
        account: { email: 'doctor@example.com' },
      },
      consultationSession: {
        appointmentId: 'a1',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        meetingId: 'abc-defg-hij',
        calendarEventId: 'event-1',
      },
    });
  });

  it('throws when schedule not available', async () => {
    mockTx.doctorSchedule.findUnique.mockResolvedValue(null);

    await expect(
      service.bookAppointment({
        patientId: 'p1',
        doctorId: 'd1',
        scheduleId: 's-missing',
      } as any),
    ).rejects.toBeDefined();
  });

  it('returns patient appointments', async () => {
    prismaMock.appointment.findMany.mockResolvedValue([{ id: 'a1' }]);

    const out = await service.getPatientAppointments('p1');
    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
      where: { patientId: 'p1' },
      include: expect.objectContaining({
        doctor: expect.any(Object),
        schedule: true,
        consultationSession: true,
        consultationNote: true,
        prescription: true,
      }),
      orderBy: { createdAt: 'desc' },
    });
    expect(out).toEqual([{ id: 'a1' }]);
  });
});
