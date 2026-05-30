import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return this.patientService.findPatientByAccountId(req.user.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Request() req: any, @Body() body: UpdatePatientProfileDto) {
    return this.patientService.updatePatientProfileByAccountId(
      req.user.userId,
      body,
    );
  }

  @Get()
  getAllPatients() {
    return this.patientService.findAllPatients();
  }

  @Get(':id')
  getPatient(@Param('id') id: string) {
    return this.patientService.findPatientById(id);
  }

  @Patch(':id/profile')
  updateProfile(
    @Param('id') id: string,
    @Body() body: UpdatePatientProfileDto,
  ) {
    return this.patientService.updatePatientProfile(id, body);
  }
}
