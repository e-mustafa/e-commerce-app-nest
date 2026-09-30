import { forwardRef, Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { CartController } from './cart.controller';
import { cartModel } from './cart.model';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

@Module({
	imports: [cartModel, forwardRef(() => UserModule), forwardRef(() => ProductModule)],
	controllers: [CartController],
	providers: [CartService, CartRepository],
	exports: [CartService, CartRepository],
})
export class CartModule {}
