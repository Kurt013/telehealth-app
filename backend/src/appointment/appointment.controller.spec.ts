// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  const mockService = {
    bookAppointment: jest.fn(),
    getPatientAppointments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [{ provide: AppointmentService, useValue: mockService }],
    }).compile();

    controller = module.get<AppointmentController>(AppointmentController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates book to service', async () => {
    (mockService.bookAppointment as jest.Mock).mockResolvedValue({ id: 'a1' });
    const res = await controller.book({ patientId: 'p1' } as any);
    expect(mockService.bookAppointment).toHaveBeenCalledWith({
      patientId: 'p1',
    });
    expect(res).toEqual({ id: 'a1' });
  });

  it('delegates getMyAppointments to service', async () => {
    (mockService.getPatientAppointments as jest.Mock).mockResolvedValue([
      { id: 'a1' },
    ]);
    const res = await controller.getMyAppointments('p1');
    expect(mockService.getPatientAppointments).toHaveBeenCalledWith('p1');
    expect(res).toEqual([{ id: 'a1' }]);
  });
});
