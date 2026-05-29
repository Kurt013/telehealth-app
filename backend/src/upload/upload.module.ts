import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { UploadController } from './upload.controller';

const uploadDir = join(process.cwd(), 'uploads');

// Allowed MIME types → extension map
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const ext = ALLOWED_MIME_TYPES[file.mimetype] ?? extname(file.originalname).toLowerCase();
          const filename = `${randomUUID()}${ext}`;   // e.g. 3f2a1c4d-...-7b9e.jpg
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,   // 5MB max
      },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype in ALLOWED_MIME_TYPES) {
          cb(null, true);
        } else {
          cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}