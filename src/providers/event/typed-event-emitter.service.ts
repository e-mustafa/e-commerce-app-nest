import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TMailEventPayloadMap } from '../mail/mail.type-classes';

@Injectable()
export class AppEventEmitter {
	constructor(private readonly eventEmitter: EventEmitter2) {}

	/**
	 * Strongly-typed emit method ensuring event name matches its required payload
	 */
	emit<K extends keyof TMailEventPayloadMap>(event: K, payload: TMailEventPayloadMap[K]): boolean {
		return this.eventEmitter.emit(event, payload);
	}
}
