import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiController } from './ai.controller';

@Module({
  providers: [GeminiService],
  controllers: [AiController],
  exports: [GeminiService],
})
export class AiModule {}
