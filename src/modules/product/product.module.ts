import { UploadModule } from '@/providers/upload/upload.module';
import { forwardRef, Module } from '@nestjs/common';
import { BrandModule } from '../brand/brand.module';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';
import { ProductAdminController } from './product.admin.controller';
import { ProductController } from './product.controller';
import { productModel } from './product.model';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';
import { ProductResolver } from './qraphql/product.gql.resolver';

@Module({
	imports: [
		productModel,
		forwardRef(() => CategoryModule),
		forwardRef(() => UserModule),
		forwardRef(() => BrandModule),
		forwardRef(() => UploadModule),
	],
	controllers: [ProductController, ProductAdminController],
	providers: [ProductService, ProductRepository, ProductResolver],
	exports: [ProductService, ProductRepository],
})
export class ProductModule {}
