import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export type RedisClient = RedisClientType;

export interface IRedisService {
	set(key: string, value: string, ttl?: number): Promise<void>;
	get(key: string): Promise<string | null>;
	delete(key: string): Promise<void>;
	exists(key: string): Promise<boolean>;
	ttl(key: string): Promise<number>;
	expire(key: string, seconds: number): Promise<number>;
	increment(key: string): Promise<number>;
	incrementWithExpiration(key: string, expirationInSeconds: number): Promise<number>;
	deletePattern(key: string): Promise<void>;
	getByPattern<TValue>(key: string, isJson: boolean): Promise<TValue[]>;
	getByPatternWithKeys<TValue>(key: string, isJson: boolean): Promise<Array<{ key: string; value: TValue }>>;
}

@Injectable()
export class RedisService implements IRedisService {
	constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}
	public async set(key: string, value: string, ttl?: number): Promise<void> {
		if (ttl && ttl > 0) {
			await this.client.set(key, value, {
				expiration: {
					type: 'EX',
					value: ttl,
				},
			});

			return;
		}

		await this.client.set(key, value);
	}

	public async get(key: string): Promise<string | null> {
		return this.client.get(key);
	}

	public async delete(key: string): Promise<void> {
		await this.client.del(key);
	}

	public async exists(key: string): Promise<boolean> {
		return (await this.client.exists(key)) > 0;
	}

	public async ttl(key: string): Promise<number> {
		return this.client.ttl(key);
	}

	public async expire(key: string, seconds: number): Promise<number> {
		return this.client.expire(key, seconds);
	}

	public async increment(key: string): Promise<number> {
		return this.client.incr(key);
	}

	public async incrementWithExpiration(key: string, expirationInSeconds: number): Promise<number> {
		const value = await this.client.incr(key);

		if (value === 1) {
			await this.client.expire(key, expirationInSeconds);
		}

		return value;
	}

	public async deletePattern(key: string): Promise<void> {
		const pattern = key;
		let batch: string[] = [];
		const BATCH_SIZE = 200;

		// Stream matching keys asynchronously using SCAN iterator
		for await (const result of this.client.scanIterator({ MATCH: pattern, COUNT: BATCH_SIZE })) {
			const keyFound = Array.isArray(result) ? result[0] : result;
			if (keyFound) {
				batch.push(keyFound);
			}

			// Execute non-blocking batch unlink when threshold is reached
			if (batch.length >= BATCH_SIZE) {
				await this.client.unlink(batch);
				batch = [];
			}
		}

		// Unlink any remaining keys in the last chunk
		if (batch.length > 0) {
			await this.client.unlink(batch);
		}
	}

	public async getByPattern<TValue>(key: string, isJson: boolean = false): Promise<TValue[]> {
		const pattern = key;
		const foundKeys: string[] = [];
		const BATCH_SIZE = 200;

		for await (const result of this.client.scanIterator({ MATCH: pattern, COUNT: BATCH_SIZE })) {
			const keyFound = Array.isArray(result) ? result[0] : result;
			if (keyFound) {
				foundKeys.push(keyFound);
			}
		}

		if (foundKeys.length === 0) {
			return [];
		}

		const results: TValue[] = [];

		for (let i = 0; i < foundKeys.length; i += BATCH_SIZE) {
			const chunkKeys = foundKeys.slice(i, i + BATCH_SIZE);
			const rawValues = await this.client.mGet(chunkKeys);

			for (const rawValue of rawValues) {
				if (!rawValue) continue;

				if (isJson) {
					try {
						const parsedValue = JSON.parse(rawValue) as TValue;
						results.push(parsedValue);
					} catch {
						continue;
					}
				} else {
					results.push(rawValue as unknown as TValue);
				}
			}
		}

		return results;
	}

	public async getByPatternWithKeys<TValue>(
		key: string,
		isJson: boolean = false,
	): Promise<Array<{ key: string; value: TValue }>> {
		const pattern = key;
		const foundKeys: string[] = [];
		const BATCH_SIZE = 200;

		for await (const result of this.client.scanIterator({ MATCH: pattern, COUNT: BATCH_SIZE })) {
			if (Array.isArray(result)) {
				foundKeys.push(...result);
			} else if (result) {
				foundKeys.push(result);
			}
		}

		if (foundKeys.length === 0) {
			return [];
		}

		const results: Array<{ key: string; value: TValue }> = [];

		for (let i = 0; i < foundKeys.length; i += BATCH_SIZE) {
			const chunkKeys = foundKeys.slice(i, i + BATCH_SIZE);
			const rawValues = await this.client.mGet(chunkKeys);

			chunkKeys.forEach((redisKey, index) => {
				const rawValue = rawValues[index];
				if (!rawValue) return;

				if (isJson) {
					try {
						const parsedValue = JSON.parse(rawValue) as TValue;
						results.push({ key: redisKey, value: parsedValue });
					} catch {
						// Skip corrupted JSON values gracefully
					}
				} else {
					results.push({ key: redisKey, value: rawValue as unknown as TValue });
				}
			});
		}

		return results;
	}
}
