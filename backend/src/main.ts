import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
const compression = require('compression');
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('corsOrigin') || '*';

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());

  // CORS Configuration
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-api-key, x-correlation-id, x-request-id',
    credentials: true,
  });

  // Global Prefix (Excluding root discovery and health endpoints)
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['', '/', 'health', 'health/live', 'health/ready'],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Enable Graceful Shutdown Hooks
  app.enableShutdownHooks();

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Data Contract & Schema Drift Monitor API')
    .setDescription(
      'Enterprise API for AI-assisted data contract monitoring, schema and data-quality drift detection, consumer impact mapping, and approval-gated migration execution.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Operator or Administrator JWT Token',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Service-to-Service API Key',
      },
      'x-api-key',
    )
    .addTag('Data Contracts', 'Register, version, and inspect data contracts')
    .addTag('Schema Snapshots', 'Ingest and sanitize production schema snapshots')
    .addTag('Schema & Quality Drift', 'Detect breaking, non-breaking, and quality drift')
    .addTag('Downstream Consumers', 'Map and trace affected downstream dependencies')
    .addTag('Migration Proposals', 'AI and deterministic schema evolution plans')
    .addTag('Approval Gates & Governance', 'Human-in-the-loop review and publishing')
    .addTag('Audit Trail', 'Immutable audit history of contract decisions')
    .addTag('Demo & Simulation Sandbox', 'Interactive drift scenario simulations')
    .addTag('Health', 'Readiness and liveness health probes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Bind to 0.0.0.0 and process.env.PORT as required for Render
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend server running on http://0.0.0.0:${port} with prefix /${apiPrefix}`);
  logger.log(`OpenAPI Swagger documentation available at http://localhost:${port}/docs`);
  logger.log(`Health check available at http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('BOOTSTRAP ERROR:', err);
  const logger = new Logger('Bootstrap');
  logger.error(`Application failed to start: ${err.message}`, err.stack);
  process.exit(1);
});
