// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DoctorDiscoveryService', () => {
  let service: DoctorDiscoveryService;
  const prismaMock: any = {
    doctorProfile: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorDiscoveryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DoctorDiscoveryService>(DoctorDiscoveryService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('searches doctors with query forwarded to prisma', async () => {
    prismaMock.doctorProfile.findMany.mockResolvedValue([{ id: 'd1' }]);
    const out = await service.searchDoctors({ search: 'john' } as any);
    expect(prismaMock.doctorProfile.findMany).toHaveBeenCalled();
    expect(out).toEqual([{ id: 'd1' }]);
  });
});
