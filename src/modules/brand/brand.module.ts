import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { BrandController } from './brand.controller';
import { BrandAdminController } from './brand.controller.admin';
import { brandModel } from './brand.model';
import { BrandRepository } from './brand.repository';
import { BrandService } from './brand.service';
import { BrandResolver } from './qraphql/brand.gql.resolver';

@Module({
	imports: [brandModel, forwardRef(() => UserModule)],
	controllers: [BrandController, BrandAdminController],
	providers: [BrandService, BrandRepository, BrandResolver],
	exports: [BrandService, BrandRepository],
})
export class BrandModule {}
