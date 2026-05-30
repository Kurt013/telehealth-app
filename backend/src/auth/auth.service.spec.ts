// Prevent importing the real Prisma client (which references ESM .js files) during tests
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

// Mock bcrypt to make it safe to spy/mock compare/hash
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Partial<Record<string, any>>;
  let jwt: Partial<JwtService>;

  beforeEach(async () => {
    // lightweight mocks for Prisma client methods used by AuthService
    prisma = {
      account: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      patientProfile: {
        create: jest.fn(),
      },
      doctorProfile: {
        create: jest.fn(),
      },
    };

    jwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerPatient', () => {
    it('creates account and patientProfile when email is new', async () => {
      const dto = {
        email: 'a@b.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'Last',
        birthday: '1990-01-01',
        weight: 70,
        height: 170,
        phone: '555',
        address: 'addr',
      } as any;

      // no existing account
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      // when creating account return an id
      (prisma.account.create as jest.Mock).mockResolvedValue({
        id: 'acct-1',
        email: dto.email,
      });
      (prisma.patientProfile.create as jest.Mock).mockResolvedValue({
        id: 'patient-1',
        firstName: dto.firstName,
      });

      const result = await service.registerPatient(dto);

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.account.create).toHaveBeenCalled();
      expect(prisma.patientProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acct-1',
            firstName: dto.firstName,
          }),
        }),
      );
      expect(result).toEqual({ id: 'patient-1', firstName: dto.firstName });
    });

    it('throws if email already exists', async () => {
      const dto = {
        email: 'a@b.com',
        password: 'password123',
        firstName: 'F',
        lastName: 'L',
        birthday: '1990-01-01',
      } as any;
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 'acct-1',
      });

      await expect(service.registerPatient(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('registerDoctor', () => {
    it('creates doctor profile with specializations connectOrCreate objects', async () => {
      const dto = {
        email: 'doc@b.com',
        password: 'password123',
        firstName: 'Doc',
        lastName: 'Tor',
        bio: 'bio',
        specializations: ['Cardiology'],
      } as any;

      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue({
        id: 'acct-doc',
      });
      (prisma.doctorProfile.create as jest.Mock).mockResolvedValue({
        id: 'doc-1',
        firstName: dto.firstName,
      });

      const res = await service.registerDoctor(dto);

      expect(prisma.account.create).toHaveBeenCalled();
      expect(prisma.doctorProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accountId: 'acct-doc' }),
        }),
      );

      // inspect the specializations payload
      const createArg = (prisma.doctorProfile.create as jest.Mock).mock
        .calls[0][0].data.specializations;
      expect(createArg).toBeDefined();
      expect(createArg.create).toHaveLength(1);
      expect(createArg.create[0]).toHaveProperty('specialization');
      expect(createArg.create[0].specialization).toHaveProperty(
        'connectOrCreate',
      );
      expect(createArg.create[0].specialization.connectOrCreate.where).toEqual({
        name: 'Cardiology',
      });
      expect(res).toEqual({ id: 'doc-1', firstName: dto.firstName });
    });
  });

  describe('login', () => {
    it('returns token when credentials valid', async () => {
      const dto = { email: 'u@b.com', password: 'pw' } as any;
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 'acct-1',
        passwordHash: 'hash',
        role: 'PATIENT',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);

      const out = await service.login(dto);

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(out).toEqual({ accessToken: 'signed-token', role: 'PATIENT' });
    });

    it('throws UnauthorizedException when account not found', async () => {
      const dto = { email: 'x@b.com', password: 'pw' } as any;
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password invalid', async () => {
      const dto = { email: 'u@b.com', password: 'pw' } as any;
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        id: 'acct-1',
        passwordHash: 'hash',
        role: 'PATIENT',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
