import { forwardRef, Module } from '@nestjs/common';
import { BrandAdminController } from './brand.controller.admin';
import { BrandController } from './brand.controller.public';
import { brandModel } from './brand.model';
import { BrandRepository } from './brand.repository';
import { BrandService } from './brand.service';
import { UserModule } from '../user/user.module';

@Module({
	imports: [brandModel, forwardRef(() => UserModule)],
	controllers: [BrandController, BrandAdminController],
	providers: [BrandService, BrandRepository],
	exports: [BrandService, BrandRepository],
})
export class BrandModule {}
