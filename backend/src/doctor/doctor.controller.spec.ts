// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

describe('DoctorController', () => {
  let controller: DoctorController;
  const mockService = {
    findDoctors: jest.fn(),
    findDoctorById: jest.fn(),
    getSchedules: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [{ provide: DoctorService, useValue: mockService }],
    }).compile();

    controller = module.get<DoctorController>(DoctorController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates getDoctors to service', async () => {
    (mockService.findDoctors as jest.Mock).mockResolvedValue(['d1']);
    const res = await controller.getDoctors({ search: 'a' } as any);
    expect(mockService.findDoctors).toHaveBeenCalledWith(
      'a',
      undefined,
      undefined,
    );
    expect(res).toEqual(['d1']);
  });
});
