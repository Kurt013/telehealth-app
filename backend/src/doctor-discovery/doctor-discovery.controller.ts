import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { DoctorDiscoveryService } from './doctor-discovery.service';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { RecommendDoctorsDto } from './dto/recommend-doctors.dto';

@Controller('doctor-discovery')
export class DoctorDiscoveryController {
  constructor(private service: DoctorDiscoveryService) {}

  @Get()
  search(@Query() query: SearchDoctorsDto) {
    return this.service.searchDoctors(query);
  }

  @Post('recommend')
  recommend(@Body() body: RecommendDoctorsDto) {
    return this.service.recommendDoctors(body.text);
  }
}
