import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix (exclude root / and /metrics to handle health check and scraping cleanly)
  app.setGlobalPrefix('api', { exclude: ['/', '/metrics'] });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[NestJS] Backend running on http://localhost:${port}`);
}
bootstrap();
