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
    doctorSchedule: { findMany: jest.fn() },
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
    prismaMock.doctorSchedule.findMany.mockResolvedValue([{ id: 's1' }]);
    const out = await service.getAvailableSchedules('d1');
    expect(prismaMock.doctorSchedule.findMany).toHaveBeenCalled();
    expect(out).toEqual([{ id: 's1' }]);
  });
});
