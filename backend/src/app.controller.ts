import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('contact')
  async submitInquiry(
    @Body()
    body: {
      name: string;
      email: string;
      subject: string;
      message: string;
    },
  ) {
    if (!body.name || !body.email || !body.subject || !body.message) {
      throw new BadRequestException(
        'All fields (name, email, subject, message) are required',
      );
    }
    return this.appService.createInquiry(body);
  }
}
