import { Id, IFile, IUserBody } from '@/common/types';
import type * as dto from './brand.dto';

export interface ICreateBrandPayload extends dto.CreateBrandDTO {
	userId: Id;
	icon?: IFile;
	cover?: IFile;
}

export interface IUpdateBrandPayload extends dto.UpdateBrandDTO {
	userId: Id;
	brandId: string;
	files: { icon?: IFile; cover?: IFile };
}

export interface IListBrandPayload extends dto.BrandQueryDTO {
	user: IUserBody;
}
