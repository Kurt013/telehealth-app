import { Controller, Get, Query } from '@nestjs/common';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { SearchDoctorsDto } from './dto/search-doctors.dto';

@Controller('doctor-discovery')
export class DoctorDiscoveryController {
  constructor(private service: DoctorDiscoveryService) {}

  @Get()
  search(@Query() query: SearchDoctorsDto) {
    return this.service.searchDoctors(query);
  }
}
