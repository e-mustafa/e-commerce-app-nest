import { appConfig, type AppConfig } from '@/config';
import { RedisService } from '@/providers/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class OrderNumberGeneratorService {
	private readonly COUNTER_KEY = 'counters:orders:global';
	private readonly orderPrefix: string = 'ORDER-';

	constructor(
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly redisService: RedisService,
	) {
		const { orderNumberPrefix } = this.APP.order;
		if (orderNumberPrefix) this.orderPrefix = orderNumberPrefix;
	}

	/**
	 * Generate a unique sequential 6-digit order number padded with leading zeros (e.g., ORDER-000001, ORDER-000002)
	 */
	async generateOrderNumber(): Promise<string> {
		const sequence = await this.redisService.increment(this.COUNTER_KEY);

		// Pad sequence with leading zeros to maintain a minimum length of 6 digits
		const formattedSequence = sequence.toString().padStart(6, '0');
		return `${this.orderPrefix}${formattedSequence}`;
	}
}
