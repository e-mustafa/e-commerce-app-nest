import { forwardRef, Module } from '@nestjs/common';
import { BrandModule } from '../brand/brand.module';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { CouponController } from './coupon.controller';
import { CouponAdminController } from './coupon.controller.admin';
import { couponModel } from './coupon.model';
import { CouponRepository } from './coupon.repository';
import { CouponService } from './coupon.service';

@Module({
	imports: [
		couponModel,
		forwardRef(() => UserModule),
		forwardRef(() => ProductModule),
		forwardRef(() => CategoryModule),
		forwardRef(() => BrandModule),
	],
	controllers: [CouponController, CouponAdminController],
	providers: [CouponService, CouponRepository],
	exports: [CouponService, CouponRepository, CouponService],
})
export class CouponModule {}
