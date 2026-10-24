import { forwardRef, Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { ReviewResolver } from './qraphql/review.gql.resolver';
import { ReviewController } from './review.controller';
import { reviewModel } from './review.model';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

@Module({
	imports: [reviewModel, forwardRef(() => UserModule), forwardRef(() => ProductModule)],
	controllers: [ReviewController],
	providers: [ReviewService, ReviewRepository, ReviewResolver],
	exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
