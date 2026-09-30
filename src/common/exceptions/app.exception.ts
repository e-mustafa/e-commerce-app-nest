import { HttpException, HttpStatus } from '@nestjs/common';
import { IFieldErrors } from '../types';

/**
 * Base custom application exception with stack-trace reflection for auto-context discovery
 */
export class AppException extends HttpException {
	public context: string;

	constructor(
		statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
		message: string,
		context?: string,
		public errors: IFieldErrors | undefined = undefined,
		public isOperational: boolean = true,
		public remainingSeconds?: number,
		public originalError?: unknown,
	) {
		super(message, statusCode);
		this.name = this.constructor.name;

		// Auto-assign context if not explicitly provided
		this.context = context || this.extractCallerContext();

		// Preserve original stack trace if wrapping an existing error
		if (originalError instanceof Error && originalError.stack) {
			this.stack = originalError.stack;
		}
	}

	/**
	 * Inspects the call stack to extract the class name and method name of the caller
	 */
	private extractCallerContext(): string {
		const stack = new Error().stack;
		if (!stack) return 'ApplicationContext';

		const lines = stack.split('\n');

		for (const line of lines) {
			const match = line.match(/at\s+([A-Za-z0-9_$.]+)\s+\(/);
			if (match && match[1]) {
				const caller = match[1];

				const isExceptionClass =
					caller.includes('AppException') ||
					caller.endsWith('Exception') ||
					caller.includes('extractCallerContext') ||
					caller.includes('Error');

				if (!isExceptionClass && !caller.includes('node_modules')) {
					return caller;
				}
			}
		}

		return 'ApplicationContext';
	}
}
