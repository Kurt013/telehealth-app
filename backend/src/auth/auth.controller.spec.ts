// Prevent importing the real Prisma client during tests by mocking PrismaService
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    registerPatient: jest.fn(),
    registerDoctor: jest.fn(),
    login: jest.fn(),
    exchangeGoogleAuthCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('registerPatient delegates to AuthService', async () => {
    const dto = { email: 'a@b.com' } as any;
    (mockAuthService.registerPatient as jest.Mock).mockResolvedValue({
      id: 'p1',
    });

    const res = await controller.registerPatient(dto);
    expect(mockAuthService.registerPatient).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'p1' });
  });

  it('registerDoctor delegates to AuthService', async () => {
    const dto = { email: 'd@b.com' } as any;
    (mockAuthService.registerDoctor as jest.Mock).mockResolvedValue({
      id: 'd1',
    });

    const res = await controller.registerDoctor(dto);
    expect(mockAuthService.registerDoctor).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ id: 'd1' });
  });

  it('login delegates to AuthService', async () => {
    const dto = { email: 'x@b.com', password: 'pw' } as any;
    (mockAuthService.login as jest.Mock).mockResolvedValue({
      accessToken: 't',
      role: 'PATIENT',
    });

    const res = await controller.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ accessToken: 't', role: 'PATIENT' });
  });

  it('googleCallback delegates to AuthService', async () => {
    (mockAuthService.exchangeGoogleAuthCode as jest.Mock).mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const res = await controller.googleCallback('auth-code');

    expect(mockAuthService.exchangeGoogleAuthCode).toHaveBeenCalledWith(
      'auth-code',
    );
    expect(res).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });
});
