import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {
  @Post('/uploadImage')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file) {
    const API_URL = process.env.APP_URL ?? "http://localhost:3001"

    const fileUrl = `${API_URL}/uploads/${file.filename}`;
    return {
      url: fileUrl,
    };
  }
}