// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DoctorDiscoveryController } from './doctor-discovery.controller';
import { DoctorDiscoveryService } from './doctor-discovery.service';

describe('DoctorDiscoveryController', () => {
  let controller: DoctorDiscoveryController;
  const mockService = { searchDoctors: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorDiscoveryController],
      providers: [{ provide: DoctorDiscoveryService, useValue: mockService }],
    }).compile();

    controller = module.get<DoctorDiscoveryController>(
      DoctorDiscoveryController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates search to service', async () => {
    (mockService.searchDoctors as jest.Mock).mockResolvedValue(['d1']);
    const res = await controller.search({ search: 'a' } as any);
    expect(mockService.searchDoctors).toHaveBeenCalledWith({ search: 'a' });
    expect(res).toEqual(['d1']);
  });
});
