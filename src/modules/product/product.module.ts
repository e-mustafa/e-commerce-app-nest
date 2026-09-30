import { UploadModule } from '@/providers/upload/upload.module';
import { forwardRef, Module } from '@nestjs/common';
import { BrandModule } from '../brand/brand.module';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';
import { ProductAdminController } from './product.controller.admin';
import { ProductController } from './product.controller.public';
import { productModel } from './product.model';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';

@Module({
	imports: [
		productModel,
		forwardRef(() => CategoryModule),
		forwardRef(() => UserModule),
		forwardRef(() => BrandModule),
		forwardRef(() => UploadModule),
	],
	controllers: [ProductController, ProductAdminController],
	providers: [ProductService, ProductRepository],
	exports: [ProductService, ProductRepository],
})
export class ProductModule {}
