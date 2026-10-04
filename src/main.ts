import { StandardSchemaValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import chalk from 'chalk';
import helmet from 'helmet';
import { $ZodIssue } from 'zod/v4/core';
import { AppModule } from './app.module';
import { ValidationErrorsException } from './common/exceptions';
import { TransformResponseInterceptor } from './common/interceptors';
import { formatZodErrors } from './common/validation';
import { envConfig } from './config';

(async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// instrument: ObserveInstrument,
		cors: true,
	});

	app.use(helmet());
	app.enableCors();
	// TODO: implement Rate limiting with redis
	// TODO: implement CSRF
	// const {
	// 	invalidCsrfTokenError, // This is provided purely for convenience if you plan on creating your own middleware.
	// 	generateToken, // Use this in your routes to generate and provide a CSRF hash, along with a token cookie and token.
	// 	validateRequest, // Also a convenience if you plan on making your own middleware.
	// 	doubleCsrfProtection, // This is the default CSRF protection middleware.
	// } = doubleCsrf(doubleCsrfOptions);
	// app.use(doubleCsrfProtection);

	// Serve static files from the uploads directory
	// app.useStaticAssets(join(process.cwd(), 'uploads'), {
	// 	prefix: '/uploads/',
	// });

	// app.useGlobalFilters(GlobalExceptionFilter);
	app.useGlobalInterceptors(new TransformResponseInterceptor()); //
	app.useGlobalPipes(
		new StandardSchemaValidationPipe({
			validateCustomDecorators: true,
			transform: true,
			// exceptionFactory: (errors) => ({ success: false, message: 'Fields validation error', errors }),
			exceptionFactory: (errors) => {
				throw new ValidationErrorsException({ body: formatZodErrors(errors as $ZodIssue[]) });
			},
		}),
	); // use zod validation by schema

	app.setGlobalPrefix(envConfig().apiBaseUrlPrefix);
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: envConfig().apiBaseUrlVersion,
	});

	await app.listen(envConfig().port, () =>
		// process.env.PORT ?? 3000, () =>
		console.log(chalk.bgGreenBright.bold(`✔✔ App is running on port: 🏃🏻‍♂️  ${envConfig().port}`)),
	);
})();
// await bootstrap();

//! 👈🏻👈🏻👈🏻👈🏻 <-- postman collection
// https://documenter.getpostman.com/view/49016393/2sBYHNVhU6

//! 👈🏻👈🏻👈🏻👈🏻 <-- Github link
// https://github.com/e-mustafa/e-commerce-app-nest
