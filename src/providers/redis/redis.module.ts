import { type EnvConfig, envConfig } from '@/config';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import chalk from 'chalk';
import { createClient } from 'redis';
import { REDIS_CLIENT, RedisService } from './redis.service';

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: REDIS_CLIENT,
			inject: [envConfig.KEY],
			useFactory: async (ENV: EnvConfig) => {
				const logger = new Logger('RedisModule', { timestamp: false });
				const client = createClient({
					url: ENV.db.redisUrl,
					socket: {
						connectTimeout: 5000,
						reconnectStrategy: (retries: number) => {
							if (retries > 3) return new Error('Redis connection failed permanently.');
							return Math.min(retries * 100, 2000);
						},
					},
				});

				// Register lifecycle logging events
				// client.on('error', (error: Error) => console.error(chalk.red('❌ Redis Error:'), error.message));
				// client.on('connect', () => console.log(chalk.yellow('⏳ Connecting to Redis...')));
				// client.on('ready', () => console.log(chalk.green('✔ Redis connected successfully.')));
				// client.on('reconnecting', () => console.log(chalk.yellow('🔄 Reconnecting to Redis...')));
				// client.on('end', () => console.log(chalk.gray('Redis connection closed.')));

				client.on('error', (error: Error) => logger.error('❌ Redis Error:', error.message));
				client.on('connect', () => logger.warn('⏳ Connecting to Redis...'));
				client.on('ready', () => logger.log(chalk.underline.underlineWhite('✅ Redis connected successfully.')));
				client.on('reconnecting', () => logger.warn('🔄 Reconnecting to Redis...'));
				client.on('end', () => logger.log(chalk.gray('Redis connection closed.')));

				// Connect automatically before delivering the client instance
				await client.connect();
				return client;
			},
		},
		RedisService,
	],
	exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
