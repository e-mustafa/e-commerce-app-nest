import { type EnvConfig, envConfig } from '@/config';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import chalk from 'chalk';
import { Connection } from 'mongoose';

@Global()
@Module({
	imports: [
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [envConfig.KEY],
			useFactory: (env: EnvConfig) => {
				const logger = new Logger('DatabaseModule');
				return {
					uri: env.db.dbUrl,
					// dbName: env.db.dbName,
					onConnectionCreate: (connection: Connection) => {
						// connection.on('connected', () => console.log(chalk.green(`✔✔ Database connected successfully`)));
						// connection.on('disconnected', () => console.log(chalk.yellow(`⚠️ Database disconnected`)));
						// connection.on('reconnected', () => console.log(chalk.green(`✔✔ Database reconnected successfully`)));
						// connection.on('error', (error) => console.error(chalk.red('❌ Database connection error:'), error));
						// connection.on('close', () => console.log(chalk.yellow(`🔒⚠️ Database connection closed`)));

						connection.on('connected', () =>
							logger.log(chalk.underline.underlineWhite(`✅ Database Mongodb connected successfully`)),
						);
						connection.on('disconnected', () => logger.warn(`⚠️ Database Mongodb disconnected`));
						connection.on('reconnected', () =>
							logger.log(chalk.underline.underlineWhite(`✅ Database Mongodb reconnected successfully`)),
						);
						connection.on('error', (error) => logger.error('❌ Database Mongodb connection error:', error));
						connection.on('close', () => logger.warn(`🔒⚠️ Database Mongodb connection closed`));

						return connection;
					},
				};
			},
		}),
	],

	exports: [MongooseModule],
})
export class DatabaseModule {}
