// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

describe('ScheduleController', () => {
  let controller: ScheduleController;
  const mockService = { getAvailableSchedules: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [{ provide: ScheduleService, useValue: mockService }],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates getSchedules to service', async () => {
    (mockService.getAvailableSchedules as jest.Mock).mockResolvedValue(['s1']);
    const res = await controller.getSchedules('d1', {
      from: '2023-01-01',
    } as any);
    expect(mockService.getAvailableSchedules).toHaveBeenCalledWith(
      'd1',
      '2023-01-01',
      undefined,
    );
    expect(res).toEqual(['s1']);
  });
});
