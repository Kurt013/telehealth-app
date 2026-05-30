import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/patient')
  registerPatient(@Body() dto: RegisterPatientDto) {
    return this.authService.registerPatient(dto);
  }

  @Post('register/doctor')
  registerDoctor(@Body() dto: RegisterDoctorDto) {
    return this.authService.registerDoctor(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      throw new BadRequestException(`Google OAuth error: ${error}`);
    }

    if (!code) {
      throw new BadRequestException('Missing Google authorization code');
    }

    return this.authService.exchangeGoogleAuthCode(code);
  }
}
