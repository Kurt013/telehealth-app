// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  const prismaMock: any = {
    account: { findUnique: jest.fn() },
    doctorProfile: { findUnique: jest.fn(), create: jest.fn() },
    doctorSchedule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns available schedules without filters', async () => {
    prismaMock.doctorProfile.findUnique.mockResolvedValueOnce({ id: 'd1' });
    prismaMock.doctorSchedule.findMany.mockResolvedValue([{ id: 's1' }]);
    const out = await service.getAvailableSchedules('d1');
    expect(prismaMock.doctorSchedule.findMany).toHaveBeenCalled();
    expect(out).toEqual([{ id: 's1' }]);
  });

  it('creates a schedule by resolving the current account to a doctor profile', async () => {
    prismaMock.doctorProfile.findUnique.mockResolvedValueOnce(null);
    prismaMock.account.findUnique.mockResolvedValueOnce({
      id: 'account-1',
      email: 'doctor@example.com',
      role: 'DOCTOR',
    });
    prismaMock.doctorProfile.create.mockResolvedValueOnce({ id: 'doctor-1' });
    prismaMock.doctorSchedule.findFirst.mockResolvedValueOnce(null);
    prismaMock.doctorSchedule.create.mockResolvedValueOnce({
      id: 'schedule-1',
      doctorId: 'doctor-1',
    });

    const result = await service.createDoctorScheduleByAccountId('account-1', {
      startTime: '2026-05-30T09:00:00.000Z',
      endTime: '2026-05-30T10:00:00.000Z',
    } as any);

    expect(prismaMock.doctorProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'account-1',
        }),
      }),
    );
    expect(prismaMock.doctorSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          doctorId: 'doctor-1',
        }),
      }),
    );
    expect(result).toEqual({ id: 'schedule-1', doctorId: 'doctor-1' });
  });
});
