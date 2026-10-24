import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { CategoryController } from './category.controller';
import { CategoryAdminController } from './category.controller.admin';
import { categoryModel } from './category.model';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';
import { CategoryResolver } from './qraphql/category.gql.resolver';

@Module({
	imports: [categoryModel, forwardRef(() => UserModule)],
	controllers: [CategoryController, CategoryAdminController],
	providers: [CategoryService, CategoryRepository, CategoryResolver],
	exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
