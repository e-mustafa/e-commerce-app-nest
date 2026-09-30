import { Id, IFile, IUserBody } from '@/common/types';
import type * as dto from './category.dto';

export interface ICreateCategoryPayload extends dto.CreateCategoryDTO {
	userId: Id;
	icon?: IFile;
	cover?: IFile;
}

export interface IUpdateCategoryPayload extends dto.UpdateCategoryDTO {
	userId: Id;
	categoryId: string;
	files: { icon?: IFile; cover?: IFile };
}

export interface IListCategoryPayload extends dto.CategoryQueryDTO {
	user: IUserBody;
}
