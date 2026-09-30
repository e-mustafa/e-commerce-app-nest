import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppEventEmitter } from './typed-event-emitter.service';

@Global()
@Module({
	imports: [EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' })],
	providers: [AppEventEmitter],
	exports: [AppEventEmitter],
})
export class EventModule {}
