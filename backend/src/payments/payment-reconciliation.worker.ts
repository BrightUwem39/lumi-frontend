import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PaystackClient } from './paystack.client.js'
import { PaymentsService } from './payments.service.js'

@Injectable()
export class PaymentReconciliationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentReconciliationWorker.name)
  private timer: NodeJS.Timeout | undefined
  private running = false

  constructor(
    private readonly config: ConfigService,
    private readonly paystack: PaystackClient,
    private readonly payments: PaymentsService,
  ) {}

  onModuleInit() {
    if (!this.paystack.isEnabled()) return
    const interval = this.config.getOrThrow<number>('PAYMENT_RECONCILIATION_INTERVAL_SECONDS') * 1000
    this.timer = setInterval(() => void this.run(), interval)
    this.timer.unref()
    setTimeout(() => void this.run(), Math.min(interval, 5_000)).unref()
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  async run() {
    if (this.running) return
    this.running = true
    try {
      const result = await this.payments.reconcileBatch(
        this.config.getOrThrow<number>('PAYMENT_RECONCILIATION_BATCH_SIZE'),
      )
      if (result.examined > 0) this.logger.log({ ...result }, 'Payment reconciliation completed')
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : 'Unknown reconciliation failure' },
        'Payment reconciliation batch failed',
      )
    } finally {
      this.running = false
    }
  }
}
