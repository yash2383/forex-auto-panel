import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmailService, OtpService],
  exports: [AuthService, EmailService, OtpService],
})
export class AuthModule {}
