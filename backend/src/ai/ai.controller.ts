import { Body, Controller, Logger, Post } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('ai/symptoms')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly gemini: GeminiService) {}

  @Post('recommendations')
  async recommendations(@Body() body: { symptoms: string }) {
    const text = (body?.symptoms || '').toString();
    this.logger.debug(
      `Received symptoms for recommendation: ${text.substring(0, 200)}`,
    );

    const result = await this.gemini.recommendSpecializationsFromText(text);

    const recommendedSpecializations = (result?.specializations || []).map(
      (s) => s.name,
    );

    return { recommendedSpecializations };
  }
}
