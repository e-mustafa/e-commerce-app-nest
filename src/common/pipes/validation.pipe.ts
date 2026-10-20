import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';
import { BadRequestException } from '../exceptions';
import { formatZodErrors } from '../validation';

@Injectable()
export class ValidationPipe implements PipeTransform {
	constructor(private readonly schema: ZodType) {}

	transform(value: unknown, _metadata: ArgumentMetadata) {
		// if (!this.schema) return { success: false };
		if (!this.schema) return value;

		const result = this.schema.safeParse(value ?? {});

		if (!result.success) {
			// return { success: false, errors: formatZodErrors(result.error) };
			throw new BadRequestException('Fields validation error', formatZodErrors(result.error.issues));
		}

		return result.data;
	}
}
