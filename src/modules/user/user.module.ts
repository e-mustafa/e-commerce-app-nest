import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserResolver } from './qraphql/user.gql.resolver';
import UserAdminController from './user.admin.controller';
import UserController from './user.controller';
import { userModel } from './user.model';
import { UserRepository } from './user.repository';
import UserService from './user.service';

@Module({
	imports: [ConfigModule, userModel],
	controllers: [UserController, UserAdminController],
	providers: [UserService, UserRepository, UserResolver],
	exports: [UserService, UserRepository, userModel],
})
export class UserModule {}
