import { ConflictException, NotFoundException } from '@/common/exceptions';
import { Id, IUserBody } from '@/common/types';
import { slugify } from '@/common/utils/slugify.util';
import { sortOrderEnum } from '@/providers/database/query.enum';
import { DBImage } from '@/providers/database/schemas';
import { type IUploadService, TDeleteAttachment, UPLOAD_SERVICE, UploadPathBuilder } from '@/providers/upload';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { AdminRoleEnum, AdminRoles } from '../user';
import type * as I from './brand-service.interface';
import { BrandRepository } from './brand.repository';
import { IBrand } from './brand.types';

@Injectable()
export class BrandService {
	constructor(
		private readonly brandRepo: BrandRepository,
		@Inject(UPLOAD_SERVICE) private readonly uploadService: IUploadService,
	) {}

	async listBrands({ user, page, limit, order, search, isPublished }: I.IListBrandPayload) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const filter: QueryFilter<IBrand> = {};

		// Safely filter by publishedAt date type to prevent Mongoose CastError
		if (typeof isPublished === 'boolean' && isAdmin) {
			if (isPublished) {
				filter.publishedAt = { $type: 'date' } as unknown as Date;
			} else {
				filter.publishedAt = null;
			}
		}

		if (search?.trim()) {
			// Escape special regex characters to prevent regex injection (ReDoS)
			const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const searchRegex = { $regex: escapedSearch, $options: 'i' };
			filter.$or = [{ name: searchRegex }, { slug: searchRegex }, { description: searchRegex }];
		}

		const brands = await this.brandRepo
			.find(filter, { ignoreDefaultFilters: isAdmin })
			.lean()
			.sort({ createdAt: order === sortOrderEnum.ASC ? 1 : -1 })
			.paginate(page, limit)
			.exec();

		return brands;
	}

	async getBrand(user: IUserBody, brandId: Id) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const brand = await this.brandRepo.findById(brandId, { ignoreDefaultFilters: isAdmin }).lean<IBrand>().exec();
		if (!brand) throw new NotFoundException('Brand not found.');

		return brand;
	}

	async createBrandAdmin(payload: I.ICreateBrandPayload) {
		const { userId, icon, cover, ...body } = payload;

		let slug = body.slug ? slugify(body.slug) : slugify(body.name);

		const isExist = await this.brandRepo.isExist(slug, body.name);
		if (isExist) {
			if (!body.slug) {
				slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
			} else {
				throw new ConflictException('Brand name or slug already exists.');
			}
		}

		const _id = new Types.ObjectId();

		// Explicit positional upload tasks avoiding Promise.all destructuring bugs
		const iconUploadPromise = icon
			? this.uploadService.uploadFile({
					file: icon,
					folder: UploadPathBuilder.getBrandLocation(_id.toString(), 'icon').folder,
					filename: UploadPathBuilder.getBrandLocation(_id.toString(), 'icon').filename!,
				})
			: Promise.resolve(null);

		const coverUploadPromise = cover
			? this.uploadService.uploadFile({
					file: cover,
					folder: UploadPathBuilder.getBrandLocation(_id.toString(), 'cover').folder,
					filename: UploadPathBuilder.getBrandLocation(_id.toString(), 'cover').filename!,
				})
			: Promise.resolve(null);

		const [iconRes, coverRes] = await Promise.all([iconUploadPromise, coverUploadPromise]);

		const iconImage: DBImage | null = iconRes?.id && iconRes?.url ? { id: iconRes.id, url: iconRes.url } : null;
		const coverImage: DBImage | null = coverRes?.id && coverRes?.url ? { id: coverRes.id, url: coverRes.url } : null;

		try {
			const brand = await this.brandRepo.create({
				_id,
				createdBy: userId,
				icon: iconImage,
				cover: coverImage,
				name: body.name,
				slug,
				description: body.description,
				publishedAt: body.isPublished ? new Date() : null,
				order: body.order,
			});

			return brand;
		} catch (error) {
			// Safely filter valid uploaded files to delete on failure
			const filesToDelete = [
				iconImage?.id ? { id: iconImage.id, resourceType: 'image' as const } : null,
				coverImage?.id ? { id: coverImage.id, resourceType: 'image' as const } : null,
			].filter((file): file is { id: string; resourceType: 'image' } => file !== null);

			if (filesToDelete.length > 0) {
				await this.uploadService.deleteMultipleFiles(filesToDelete);
			}
			throw error;
		}
	}

	async updateBrandAdmin(payload: I.IUpdateBrandPayload) {
		const { userId, brandId, files, ...body } = payload;
		const { name, slug, description, isPublished, publishedAt, order } = body || {};

		const brand = await this.brandRepo.findById(brandId, { ignoreDefaultFilters: true }).lean().exec();
		if (!brand) {
			throw new NotFoundException('Brand not found.');
		}

		if ((name && name !== brand.name) || (slug && slug !== brand.slug)) {
			const isExist = await this.brandRepo.isExist(slug || '', name || '', { ignoreDefaultFilters: true });
			if (isExist) {
				throw new ConflictException('Brand name or slug already exists.');
			}
		}

		const uploadTasks: Promise<void>[] = [];
		const deleteTasks: Promise<void>[] = [];
		const newFiles: TDeleteAttachment[] = [];

		let iconImage: DBImage | null | undefined = undefined;
		let coverImage: DBImage | null | undefined = undefined;

		if (files?.icon?.path) {
			const location = UploadPathBuilder.getBrandLocation(brandId.toString(), 'icon');
			if (brand.icon?.id) {
				deleteTasks.push(this.uploadService.deleteFile(brand.icon.id, 'image'));
			}
			uploadTasks.push(
				this.uploadService
					.uploadFile({
						file: files.icon,
						folder: location.folder,
						filename: location.filename!,
					})
					.then((res) => {
						if (res.id && res.url) {
							iconImage = { id: res.id, url: res.url };
							newFiles.push(res);
						}
					}),
			);
		}

		if (files?.cover?.path) {
			const location = UploadPathBuilder.getBrandLocation(brandId.toString(), 'cover');
			if (brand.cover?.id) {
				deleteTasks.push(this.uploadService.deleteFile(brand.cover.id, 'image'));
			}
			uploadTasks.push(
				this.uploadService
					.uploadFile({
						file: files.cover,
						folder: location.folder,
						filename: location.filename!,
					})
					.then((res) => {
						if (res.id && res.url) {
							coverImage = { id: res.id, url: res.url };
							newFiles.push(res);
						}
					}),
			);
		}

		await Promise.all(uploadTasks);
		const setSlug = slug === brand.slug ? slug : slugify(slug || name || brand.name);

		try {
			const updatedBrand = await this.brandRepo
				.findOneAndUpdate(
					{ _id: brandId },
					{
						$set: {
							slug: setSlug,
							...(name !== undefined && { name }),
							...(isPublished !== undefined && {
								publishedAt: isPublished ? publishedAt || new Date() : null,
							}),
							...(description !== undefined && { description }),
							...(order !== undefined && { order }),
							// Update image fields safely without overwriting with null
							...(iconImage !== undefined && { icon: iconImage }),
							...(coverImage !== undefined && { cover: coverImage }),
						},
					},
				)
				.lean<IBrand>()
				.exec();

			await Promise.all(deleteTasks);
			return updatedBrand;
		} catch (error) {
			if (newFiles.length > 0) await this.uploadService.deleteMultipleFiles(newFiles);
			throw error;
		}
	}

	async deleteBrandAdmin(brandId: Id) {
		const brand = await this.brandRepo.findById(brandId, { ignoreDefaultFilters: true }).lean().exec();
		if (!brand) return;

		const filesToDelete = [
			brand.icon?.id ? { id: brand.icon.id, resourceType: 'image' as const } : null,
			brand.cover?.id ? { id: brand.cover.id, resourceType: 'image' as const } : null,
		].filter((file): file is { id: string; resourceType: 'image' } => file !== null);

		if (filesToDelete.length > 0) {
			await this.uploadService.deleteMultipleFiles(filesToDelete);
		}

		await this.brandRepo.findByIdAndUpdate(brandId, { deletedAt: new Date() }).lean().exec();
	}

	async togglePublishedAdmin(brandId: Id) {
		const brand = await this.brandRepo.findById(brandId, { ignoreDefaultFilters: true }).lean().exec();
		if (!brand) throw new NotFoundException('Brand not found');

		const newState = !brand.publishedAt ? new Date() : null;

		const updated = await this.brandRepo
			.findOneAndUpdate({ _id: brandId }, { $set: { publishedAt: newState } })
			.lean<IBrand>()
			.exec();

		if (!updated) throw new NotFoundException('Brand not found');

		return updated;
	}
}
