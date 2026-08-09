import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import type { FastifyReply } from 'fastify'

@Injectable()
export class NoStoreInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Authentication responses and development tokens must never enter caches.
    context
      .switchToHttp()
      .getResponse<FastifyReply>()
      .header('Cache-Control', 'no-store')
    return next.handle()
  }
}
