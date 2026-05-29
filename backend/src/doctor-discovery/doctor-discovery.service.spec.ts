// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';

describe('DoctorDiscoveryService', () => {
  let service: DoctorDiscoveryService;
  const prismaMock: any = {
    doctorProfile: { findMany: jest.fn() },
  };
  const geminiMock: any = {
    recommendSpecializationsFromText: jest.fn(),
    heuristicFromText: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorDiscoveryService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: GeminiService, useValue: geminiMock },
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

  it('recommends and ranks all matching doctors', async () => {
    geminiMock.recommendSpecializationsFromText.mockResolvedValue({
      specializations: [{ name: 'Cardiology', confidence: 0.9 }],
      source: 'gemini',
      raw: '{"specializations":[{"name":"Cardiology","confidence":0.9}]}',
    });
    geminiMock.heuristicFromText.mockReturnValue([
      { name: 'General Medicine', confidence: 0.5 },
    ]);

    prismaMock.doctorProfile.findMany.mockResolvedValue([
      {
        id: 'd1',
        firstName: 'Jane',
        lastName: 'Johnson',
        specializations: [
          { specialization: { name: 'Cardiology' } },
          { specialization: { name: 'General Medicine' } },
        ],
        schedules: [{ id: 's1' }],
      },
      {
        id: 'd2',
        firstName: 'John',
        lastName: 'Doe',
        specializations: [{ specialization: { name: 'Cardiology' } }],
        schedules: [{ id: 's2' }],
      },
    ]);

    const out = await service.recommendDoctors('chest pain');

    expect(geminiMock.recommendSpecializationsFromText).toHaveBeenCalledWith(
      'chest pain',
    );
    expect(geminiMock.heuristicFromText).toHaveBeenCalledWith('chest pain');
    expect(prismaMock.doctorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          specializations: {
            some: {
              specialization: {
                name: { in: ['Cardiology', 'General Medicine'] },
              },
            },
          },
        },
      }),
    );
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('d1');
    expect(out[0].recommendation.confidence).toBeGreaterThan(
      out[1].recommendation.confidence,
    );
    expect(out[0].recommendation.matchedSpecializations).toContain(
      'Cardiology',
    );
    expect(out[0].recommendation.matchedSpecializations).toContain(
      'General Medicine',
    );
  });
});
