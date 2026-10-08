import { forwardRef, Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { CouponModule } from '../coupon/coupon.module';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { OrderNumberGeneratorService } from './order-number-generator';
import { OrderAdminController } from './order.admin.controller';
import { OrderController } from './order.controller';
import { orderModel } from './order.model';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

@Module({
	imports: [
		orderModel,
		forwardRef(() => UserModule),
		forwardRef(() => ProductModule),
		forwardRef(() => CouponModule),
		forwardRef(() => CartModule),
	],
	controllers: [OrderAdminController, OrderController],
	providers: [OrderService, OrderRepository, OrderNumberGeneratorService],
	exports: [OrderService, OrderRepository, OrderNumberGeneratorService],
})
export class OrderModule {}
