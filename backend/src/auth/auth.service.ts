import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ------------------------
  // CREATE ACCOUNT HELPER
  // ------------------------
  private async createAccount(email: string, password: string, role: any) {
    const existing = await this.prisma.account.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.account.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });
  }

  // ------------------------
  // PATIENT SIGNUP
  // ------------------------
  async registerPatient(dto: RegisterPatientDto) {
    const account = await this.createAccount(
      dto.email,
      dto.password,
      'PATIENT',
    );

    // Filter out empty conditions from the medical history array
    const conditions = dto.medicalHistory
      ? dto.medicalHistory.filter((c) => c && c.trim())
      : [];

    return this.prisma.patientProfile.create({
      data: {
        accountId: account.id,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        birthday: new Date(dto.birthday),
        weight: dto.weight ?? null,
        height: dto.height ?? null,
        profilePicture: dto.profilePicture,
        phone: dto.phone,
        address: dto.address,
        emergencyName: dto.emergencyName,
        emergencyPhone: dto.emergencyPhone,
        medicalHistory: conditions.length
          ? {
              create: conditions.map((condition) => ({ condition })),
            }
          : undefined,
      },
      include: {
        medicalHistory: true,
      },
    });
  }

  // ------------------------
  // DOCTOR SIGNUP
  // ------------------------
  async registerDoctor(dto: RegisterDoctorDto) {
    const account = await this.createAccount(dto.email, dto.password, 'DOCTOR');

    const specializationsCreate =
      dto.specializations && dto.specializations.length
        ? dto.specializations.map((name) => ({
            specialization: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          }))
        : [];

    return this.prisma.doctorProfile.create({
      data: {
        accountId: account.id,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        profilePicture: dto.profilePicture,
        bio: dto.bio,
        specializations: specializationsCreate.length
          ? { create: specializationsCreate }
          : undefined,
      },
      include: {
        specializations: true,
      },
    });
  }

  // ------------------------
  // LOGIN
  // ------------------------
  async login(dto: LoginDto) {
    const account = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, account.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: account.id,
      role: account.role,
    });

    return {
      accessToken: token,
      role: account.role,
    };
  }

  // ------------------------
  // GET CURRENT USER
  // ------------------------
  async getMe(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new UnauthorizedException('User not found');
    }

    if (account.role === 'PATIENT') {
      const profile = await this.prisma.patientProfile.findUnique({
        where: { accountId },
        include: {
          medicalHistory: true,
        },
      });

      return {
        id: account.id,
        email: account.email,
        role: account.role,
        profile,
      };
    }

    if (account.role === 'DOCTOR') {
      const profile = await this.prisma.doctorProfile.findUnique({
        where: { accountId },
        include: {
          specializations: true,
        },
      });

      return {
        id: account.id,
        email: account.email,
        role: account.role,
        profile,
      };
    }

    return {
      id: account.id,
      email: account.email,
      role: account.role,
    };
  }

  // ------------------------
  // GOOGLE OAUTH CALLBACK EXCHANGE
  // ------------------------
  async exchangeGoogleAuthCode(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3001/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET',
      );
    }

    if (!code || !code.trim()) {
      throw new BadRequestException('Missing Google authorization code');
    }

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code.trim());
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const payload = (await response.json()) as GoogleTokenResponse;

    if (!response.ok) {
      throw new BadRequestException(
        payload.error_description ||
          payload.error ||
          'Google token exchange failed',
      );
    }

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresIn: payload.expires_in,
      scope: payload.scope,
      tokenType: payload.token_type,
    };
  }
}
