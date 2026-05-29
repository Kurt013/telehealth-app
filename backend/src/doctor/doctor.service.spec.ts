// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DoctorService', () => {
  let service: DoctorService;
  const prismaMock: any = {
    doctorProfile: { findMany: jest.fn(), findUnique: jest.fn() },
    doctorSchedule: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findDoctors calls prisma.findMany', async () => {
    prismaMock.doctorProfile.findMany.mockResolvedValue([{ id: 'd1' }]);
    const out = await service.findDoctors('john');
    expect(prismaMock.doctorProfile.findMany).toHaveBeenCalled();
    expect(out).toEqual([{ id: 'd1' }]);
  });

  it('findDoctorById calls prisma.findUnique', async () => {
    prismaMock.doctorProfile.findUnique.mockResolvedValue({ id: 'd1' });
    const out = await service.findDoctorById('d1');
    expect(prismaMock.doctorProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 'd1' },
      include: {
        specializations: { include: { specialization: true } },
        schedules: true,
      },
    });
    expect(out).toEqual({ id: 'd1' });
  });

  it('getSchedules calls doctorSchedule.findMany', async () => {
    prismaMock.doctorSchedule.findMany.mockResolvedValue([{ id: 's1' }]);
    const out = await service.getSchedules('d1', '2023-01-01');
    expect(prismaMock.doctorSchedule.findMany).toHaveBeenCalled();
    expect(out).toEqual([{ id: 's1' }]);
  });
});
