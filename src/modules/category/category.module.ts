import { forwardRef, Module } from '@nestjs/common';
import { CategoryAdminController } from './category.controller.admin';
import { CategoryController } from './category.controller.public';
import { categoryModel } from './category.model';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import { UserModule } from '../user/user.module';

@Module({
	imports: [categoryModel, forwardRef(() => UserModule)],
	controllers: [CategoryController, CategoryAdminController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
