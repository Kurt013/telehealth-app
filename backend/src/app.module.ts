import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { ScheduleModule } from './schedule/schedule.module';
import { AppointmentModule } from './appointment/appointment.module';
import { DoctorDiscoveryModule } from './doctor-discovery/doctor-discovery.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    AuthModule,
    UploadModule,
    DoctorModule,
    PatientModule,
    ScheduleModule,
    AppointmentModule,
    DoctorDiscoveryModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
