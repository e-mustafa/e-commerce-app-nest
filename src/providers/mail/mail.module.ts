import { type EnvConfig, envConfig } from '@/config';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { MailListener } from './mail.listener';
import { MAIL_SERVICE, MailService } from './mail.service';

@Module({
	imports: [
		ConfigModule,
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [envConfig.KEY],
			useFactory: (ENV: EnvConfig) =>
				({
					transport: {
						service: ENV.mail.service,
						auth: {
							user: ENV.mail.googleEmail,
							pass: ENV.mail.googleAppPassword,
						},
					},
					defaults: {
						// from: `"${ENV.appName}" <${ENV.mail.googleEmail}>`,
						from: {
							name: ENV.appName,
							address: ENV.mail.googleEmail,
						},
					},
					template: {
						dir: join(__dirname, 'templates'),
						adapter: new EjsAdapter(),
					},
				}) as MailerOptions,
		}),
	],
	providers: [
		{
			// Bind MAIL_SERVICE DI token to MailService implementation class
			provide: MAIL_SERVICE,
			useClass: MailService,
		},
		MailListener, // Registered listener so NestJS attaches @OnEvent handlers
	],
	exports: [MAIL_SERVICE, MailListener], // Export token and typed emitter for other modules
})
export class MailModule {}
