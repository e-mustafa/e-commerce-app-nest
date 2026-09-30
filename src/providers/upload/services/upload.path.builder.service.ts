export interface TStorageUploadConfig {
	folder: string;
	filename?: string;
	prefix?: string;
}

export class UploadPathBuilder {
	/**
	 * Generates storage configuration for user profile picture.
	 * Guarantees explicit folder and filename for deterministic overwrites.
	 */
	static getUserPicLocation(
		userId: string,
		prefix: string = 'avatar',
	): Required<Pick<TStorageUploadConfig, 'folder' | 'filename'>> {
		return {
			folder: `users/${userId}/profile`,
			filename: `${prefix}_${userId}`,
		};
	}

	/**
	 * Generates storage configuration for category assets (icon or cover).
	 * Uses categoryId directory and explicit filename to guarantee clean overwrites.
	 */
	/**
	 * Generates storage configuration for category assets (icon or cover).
	 * Uses categoryId directory and explicit filename to guarantee clean overwrites.
	 */
	static getCategoryLocation(
		categoryIdOrSlug: string,
		assetType: 'icon' | 'cover',
	): Required<Pick<TStorageUploadConfig, 'folder' | 'filename'>> {
		return {
			folder: `categories/${categoryIdOrSlug}`,
			filename: `${assetType}_${categoryIdOrSlug}`,
		};
	}

	/**
	 * Generates storage configuration for brand media (logos or covers).
	 */
	static getBrandLocation(
		brandIdOrSlug: string,
		assetType: 'icon' | 'cover',
	): Required<Pick<TStorageUploadConfig, 'folder' | 'filename'>> {
		return {
			folder: `brands/${brandIdOrSlug}`,
			filename: `${assetType}_${brandIdOrSlug}`,
		};
	}

	/**
	 * Generates storage configuration for product assets (main thumbnail, gallery, or variants).
	 */
	static getProductLocation(
		productId: string,
		subFolder: 'main' | 'gallery' | 'variants' = 'gallery',
	): Required<Pick<TStorageUploadConfig, 'folder' | 'prefix'>> {
		return {
			folder: `products/${productId}/${subFolder}`,
			prefix: subFolder,
		};
	}

	/**
	 * Generates storage configuration for post attachment files.
	 */
	static getPostAttachmentLocation(
		userId: string,
		postId: string,
		prefix: string = 'attachment',
	): Required<Pick<TStorageUploadConfig, 'folder' | 'prefix'>> {
		return {
			folder: `users/${userId}/posts/${postId}`,
			prefix,
		};
	}

	/**
	 * Generates storage configuration for comment attachment files.
	 */
	static getCommentAttachmentLocation(
		userId: string,
		postId: string,
		commentId: string,
	): Required<Pick<TStorageUploadConfig, 'folder' | 'prefix'>> {
		return {
			folder: `users/${userId}/posts/${postId}/comments/${commentId}`,
			prefix: 'attachment',
		};
	}
}
