import { ConflictException, NotFoundException } from '@/common/exceptions';
import { Id, IUserBody } from '@/common/types';
import { slugify } from '@/common/utils/slugify.util';
import { sortOrderEnum } from '@/providers/database/query.enum';
import { DBImage } from '@/providers/database/schemas';
import { type IUploadService, TDeleteAttachment, UPLOAD_SERVICE, UploadPathBuilder } from '@/providers/upload';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { AdminRoleEnum, AdminRoles } from '../user';
import type * as I from './category-service.interface';
import { CategoryRepository } from './category.repository';
import { ICategory } from './category.types';

@Injectable()
export class CategoryService {
	constructor(
		private readonly categoryRepo: CategoryRepository,
		@Inject(UPLOAD_SERVICE) private readonly uploadService: IUploadService,
	) {}

	async listCategories({ user, page, limit, order, search, parentId, isPublished }: I.IListCategoryPayload) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const filter: QueryFilter<ICategory> = {};

		if (parentId) filter.parentId = parentId;

		if (typeof isPublished === 'boolean' && isAdmin) {
			filter.publishedAt = isPublished ? ({ $type: 'date' } as unknown as Date) : null;
		}

		if (search?.trim()) {
			// Escape special characters to prevent regex injection attacks
			const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const searchRegex = { $regex: escapedSearch, $options: 'i' };
			filter.$or = [{ name: searchRegex }, { slug: searchRegex }, { description: searchRegex }];
		}

		const categories = await this.categoryRepo
			.find(filter, { ignoreDefaultFilters: isAdmin })
			.lean()
			.sort({ createdAt: order === sortOrderEnum.ASC ? 1 : -1 })
			.paginate(page, limit)
			.exec();

		return categories;
	}

	async getCategory(user: IUserBody, categoryId: Id) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const category = await this.categoryRepo.findById(categoryId, { ignoreDefaultFilters: isAdmin }).lean().exec();
		if (!category) throw new NotFoundException('Category not found.');

		return category;
	}

	async createCategoryAdmin(payload: I.ICreateCategoryPayload) {
		const { userId, icon, cover, ...body } = payload;

		let slug = body.slug ? slugify(body.slug) : slugify(body.name);

		const isExist = await this.categoryRepo.isExist(slug, body.name);
		if (isExist) {
			if (!body.slug) {
				slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
			} else {
				throw new ConflictException('Category name or slug already exists.');
			}
		}

		if (body.parentId) {
			const parentCategory = await this.categoryRepo.findById(body.parentId).lean().exec();
			if (!parentCategory) {
				throw new NotFoundException('Parent category not found.');
			}
		}

		const _id = new Types.ObjectId();

		// Handle upload tasks positionally using explicit promises to avoid index mismatch
		const iconUploadPromise =
			icon && (icon.path || icon.buffer)
				? this.uploadService.uploadFile({
						file: icon,
						folder: UploadPathBuilder.getCategoryLocation(_id.toString(), 'icon').folder,
						filename: UploadPathBuilder.getCategoryLocation(_id.toString(), 'icon').filename!,
					})
				: Promise.resolve(null);

		const coverUploadPromise =
			cover && (cover.path || cover.buffer)
				? this.uploadService.uploadFile({
						file: cover,
						folder: UploadPathBuilder.getCategoryLocation(_id.toString(), 'cover').folder,
						filename: UploadPathBuilder.getCategoryLocation(_id.toString(), 'cover').filename!,
					})
				: Promise.resolve(null);

		const [iconRes, coverRes] = await Promise.all([iconUploadPromise, coverUploadPromise]);

		const iconImage: DBImage | null = iconRes?.id && iconRes?.url ? { id: iconRes.id, url: iconRes.url } : null;
		const coverImage: DBImage | null = coverRes?.id && coverRes?.url ? { id: coverRes.id, url: coverRes.url } : null;

		try {
			const category = await this.categoryRepo.create({
				_id,
				createdBy: userId,
				icon: iconImage,
				cover: coverImage,
				name: body.name,
				slug,
				description: body.description,
				publishedAt: body.isPublished ? new Date() : null,
				order: body.order,
				parentId: body.parentId,
			});

			return category;
		} catch (error) {
			// Safely filter out null or undefined files before triggering rollback
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

	async updateCategoryAdmin(payload: I.IUpdateCategoryPayload) {
		const { userId, categoryId, files, ...body } = payload;
		const { name, slug, description, isPublished, publishedAt, order, parentId } = body || {};

		const category = await this.categoryRepo.findById(categoryId, { ignoreDefaultFilters: true }).lean().exec();
		if (!category) {
			throw new NotFoundException('Category not found.');
		}

		// Prevent category from becoming its own parent
		if (parentId && parentId.toString() === categoryId.toString()) {
			throw new ConflictException('Category cannot be its own parent.');
		}

		if ((name && name !== category.name) || (slug && slug !== category.slug)) {
			const isExist = await this.categoryRepo.isExist(slug || '', name || '', { ignoreDefaultFilters: true });
			if (isExist) {
				throw new ConflictException('Category name or slug already exists.');
			}
		}

		if (parentId && parentId !== category.parentId) {
			const parentCategory = await this.categoryRepo.findById(parentId).lean().exec();
			if (!parentCategory) {
				throw new NotFoundException('Parent category not found.');
			}
		}

		const uploadTasks: Promise<void>[] = [];
		const deleteTasks: Promise<void>[] = [];
		const newFiles: TDeleteAttachment[] = [];

		// Set as undefined so missing files won't overwrite existing ones with null
		let iconImage: DBImage | null | undefined = undefined;
		let coverImage: DBImage | null | undefined = undefined;

		if (files?.icon && (files.icon.path || files.icon.buffer)) {
			const location = UploadPathBuilder.getCategoryLocation(categoryId.toString(), 'icon');
			if (category.icon?.id) {
				deleteTasks.push(this.uploadService.deleteFile(category.icon.id, 'image'));
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

		if (files?.cover && (files.cover.path || files.cover.buffer)) {
			const location = UploadPathBuilder.getCategoryLocation(categoryId.toString(), 'cover');
			if (category.cover?.id) {
				deleteTasks.push(this.uploadService.deleteFile(category.cover.id, 'image'));
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
		const setSlug = slug === category.slug ? slug : slugify(slug || name || category.name);

		try {
			const updatedCategory = await this.categoryRepo
				.findOneAndUpdate(
					{ _id: categoryId },
					{
						$set: {
							slug: setSlug,
							...(name !== undefined && { name }),
							...(parentId !== undefined && { parentId }),
							// Correct target field to publishedAt
							...(isPublished !== undefined && {
								publishedAt: isPublished ? publishedAt || new Date() : null,
							}),
							...(description !== undefined && { description }),
							...(order !== undefined && { order }),
							// Only update image fields if a new image was uploaded
							...(iconImage !== undefined && { icon: iconImage }),
							...(coverImage !== undefined && { cover: coverImage }),
						},
					},
				)
				.lean()
				.exec();

			await Promise.all(deleteTasks);
			return updatedCategory;
		} catch (error) {
			if (newFiles.length > 0) await this.uploadService.deleteMultipleFiles(newFiles);
			throw error;
		}
	}

	async deleteCategoryAdmin(categoryId: Id) {
		const category = await this.categoryRepo.findById(categoryId, { ignoreDefaultFilters: true }).lean().exec();
		if (!category) return;

		const filesToDelete = [
			category.icon?.id ? { id: category.icon.id, resourceType: 'image' as const } : null,
			category.cover?.id ? { id: category.cover.id, resourceType: 'image' as const } : null,
		].filter((file): file is { id: string; resourceType: 'image' } => file !== null);

		if (filesToDelete.length > 0) {
			await this.uploadService.deleteMultipleFiles(filesToDelete);
		}

		await this.categoryRepo
			.findByIdAndUpdate(categoryId, { $set: { isDeleted: true } })
			.lean()
			.exec();
	}

	async togglePublishedAdmin(categoryId: Id) {
		const category = await this.categoryRepo.findById(categoryId, { ignoreDefaultFilters: true }).lean().exec();
		if (!category) throw new NotFoundException('Category not found');

		const newState = !category.publishedAt ? new Date() : null;

		const updated = await this.categoryRepo
			.findOneAndUpdate({ _id: categoryId }, { $set: { publishedAt: newState } })
			.lean<ICategory>()
			.exec();

		if (!updated) throw new NotFoundException('Category not found');

		return updated;
	}
}
