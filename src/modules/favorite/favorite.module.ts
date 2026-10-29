import { forwardRef, Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { FavoriteController } from './favorite.controller';
import { favoriteModel } from './favorite.model';
import { FavoriteRepository } from './favorite.repository';
import { FavoriteService } from './favorite.service';

@Module({
	imports: [favoriteModel, forwardRef(() => UserModule), forwardRef(() => ProductModule)],
	controllers: [FavoriteController],
	providers: [FavoriteService, FavoriteRepository],
	exports: [FavoriteService, FavoriteRepository],
})
export class FavoriteModule {}
