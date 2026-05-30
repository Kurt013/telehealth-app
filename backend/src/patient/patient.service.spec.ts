// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PatientService', () => {
  let service: PatientService;
  const prismaMock: any = {
    patientProfile: { findUnique: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('finds patient by id', async () => {
    prismaMock.patientProfile.findUnique.mockResolvedValue({
      id: 'p1',
      firstName: 'A',
    });
    const out = await service.findPatientById('p1');
    expect(prismaMock.patientProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      include: {
        account: true,
        medicalHistory: true,
        appointments: {
          include: {
            doctor: {
              include: {
                account: true,
                specializations: { include: { specialization: true } },
              },
            },
            schedule: true,
            consultationSession: true,
          },
        },
      },
    });
    expect(out).toEqual({ id: 'p1', firstName: 'A' });
  });

  it('finds all patients', async () => {
    prismaMock.patientProfile.findMany.mockResolvedValue([
      { id: 'p1', firstName: 'A' },
      { id: 'p2', firstName: 'B' },
    ]);

    const out = await service.findAllPatients();

    expect(prismaMock.patientProfile.findMany).toHaveBeenCalledWith({
      include: {
        account: true,
        medicalHistory: true,
        appointments: {
          include: {
            doctor: {
              include: {
                account: true,
                specializations: { include: { specialization: true } },
              },
            },
            schedule: true,
            consultationSession: true,
          },
        },
      },
    });
    expect(out).toEqual([
      { id: 'p1', firstName: 'A' },
      { id: 'p2', firstName: 'B' },
    ]);
  });
});
