import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AppController } from './app.controller.js'
import { AuthModule } from './auth/auth.module.js'
import { validateEnvironment } from './config/environment.js'
import { DatabaseModule } from './database/database.module.js'
import { HealthModule } from './health/health.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.getOrThrow<string>('LOG_LEVEL'),
          // Prevent credentials and personal/payment fields from entering logs.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.currentPassword',
              'req.body.newPassword',
              'req.body.cardNumber',
              'req.body.securityCode',
              'res.headers.set-cookie',
            ],
            censor: '[REDACTED]',
          },
          transport:
            config.getOrThrow<string>('NODE_ENV') === 'development'
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
