import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { NotificationController } from './notification.controller';
import { notificationModel } from './notification.model';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';

@Module({
	imports: [notificationModel, forwardRef(() => UserModule)],
	controllers: [NotificationController],
	providers: [NotificationService, NotificationRepository],
	exports: [notificationModel, NotificationService, NotificationRepository],
})
export class NotificationModule {}
