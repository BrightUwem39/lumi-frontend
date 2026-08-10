import 'reflect-metadata'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module.js'
import { parseCorsOrigins, parseTrustProxy } from './config/environment.js'

async function bootstrap() {
  // Fastify provides a small, high-performance HTTP layer beneath Nest.
  const adapter = new FastifyAdapter({
    bodyLimit: 1_048_576,
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY ?? 'false'),
  })
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true, rawBody: true },
  )
  const config = app.get(ConfigService)

  app.useLogger(app.get(Logger))
  app.enableShutdownHooks()
  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  // Unknown fields are rejected to reduce injection and mass-assignment risk.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
  await app.register(cookie, {
    secret: config.getOrThrow<string>('COOKIE_SECRET'),
    hook: 'onRequest',
  })
  app.enableCors({
    origin: parseCorsOrigins(config.getOrThrow<string>('CORS_ORIGINS')),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'X-CSRF-Token',
      'X-Cart-CSRF-Token',
      'Idempotency-Key',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 600,
  })

  // Interactive API documentation is useful in development but off by default in production.
  if (config.get<boolean>('API_DOCS_ENABLED')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Lumi API')
        .setDescription('Versioned API for the Lumi ecommerce platform')
        .setVersion('1.0')
        .addCookieAuth('lumi_session')
        .build(),
    )
    // Serve the machine-readable contract without a static documentation UI.
    // This avoids adding a vulnerable or unsupported static-file dependency.
    app.getHttpAdapter().getInstance().get('/api/docs-json', async () => document)
  }

  await app.listen(
    config.getOrThrow<number>('PORT'),
    config.getOrThrow<string>('HOST'),
  )
}

void bootstrap()
