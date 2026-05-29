// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';

// Mock Prisma and ScheduleService
const mockTx = {
  doctorSchedule: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  appointment: {
    create: jest.fn(),
  },
};

const prismaMock: any = {
  $transaction: jest.fn(async (fn: any) => fn(mockTx)),
  appointment: { findMany: jest.fn() },
};

const scheduleServiceMock = {};

describe('AppointmentService', () => {
  let service: AppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ScheduleService, useValue: scheduleServiceMock },
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
    mockTx.doctorSchedule.findUnique.mockResolvedValue({
      id: 's1',
      isBooked: false,
    });
    mockTx.doctorSchedule.update.mockResolvedValue({
      id: 's1',
      isBooked: true,
    });
    mockTx.appointment.create.mockResolvedValue({ id: 'a1' });

    const result = await service.bookAppointment({
      patientId: 'p1',
      doctorId: 'd1',
      scheduleId: 's1',
    } as any);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(mockTx.doctorSchedule.findUnique).toHaveBeenCalledWith({
      where: { id: 's1' },
    });
    expect(mockTx.doctorSchedule.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isBooked: true },
    });
    expect(mockTx.appointment.create).toHaveBeenCalledWith({
      data: {
        patientId: 'p1',
        doctorId: 'd1',
        scheduleId: 's1',
        reason: undefined,
      },
    });
    expect(result).toEqual({ id: 'a1' });
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
      include: { doctor: true, schedule: true },
    });
    expect(out).toEqual([{ id: 'a1' }]);
  });
});
