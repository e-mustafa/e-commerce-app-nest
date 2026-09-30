import { Id, IFile, IUserBody } from '@/common/types';
import type * as dto from './product.dto';

export interface ICreateProductPayload extends dto.CreateProductDTO {
	userId: Id;
	// cover?: IFile;
	files?: IFile[];
}

export interface IUpdateProductPayload extends dto.UpdateProductDTO {
	userId: Id;
	productId: string;
	files: IFile[];
}

export interface IListProductPayload extends dto.ProductQueryDTO {
	user: IUserBody;
}
