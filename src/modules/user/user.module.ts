import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import UserController from './user.controller';
import { userModel } from './user.model';
import { UserRepository } from './user.repository';
import UserService from './user.service';

@Module({
	imports: [ConfigModule, userModel],
	controllers: [UserController],
	providers: [UserService, UserRepository],
	exports: [UserService, UserRepository, userModel],
})
export class UserModule {}
