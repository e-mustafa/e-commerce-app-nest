import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';
import path from 'node:path';
import { TFileType } from '../upload.type';
import { resolveFileTypes } from './mime-types';

/**
 * Validates actual binary signatures (Magic Bytes) against spoofing attacks
 */
export const verifyFileSignatures = async (
	files: Express.Multer.File[],
	categoryType: TFileType | TFileType[],
): Promise<void> => {
	const categories = Array.isArray(categoryType) ? categoryType : [categoryType];

	// Aggregate allowed mime types dynamically
	const allowedSet = new Set<string>();
	let isDocsAllowed = false;

	for (const cat of categories) {
		if (cat === 'docs' || cat === 'all') isDocsAllowed = true;
		// const list = allowedMimeTypes[cat] || [];
		// list.forEach((mime) => allowedSet.add(mime));
		resolveFileTypes(categoryType).allowedList?.forEach((mime) => allowedSet.add(mime));
	}

	const allowedList = Array.from(allowedSet);

	for (const file of files) {
		let actualMeta: { mime: string; ext: string } | undefined = undefined;

		// Detect file type from RAM Buffer or Temporary Disk File Path
		if (file.buffer) {
			actualMeta = await fileTypeFromBuffer(file.buffer);
		} else if (file.path) {
			actualMeta = await fileTypeFromFile(file.path);
		}

		// Handle plain text files (.txt) without standard binary header
		if (!actualMeta) {
			const fileExt = path.extname(file.originalname).toLowerCase();
			if (isDocsAllowed && fileExt === '.txt' && file.mimetype === 'text/plain') {
				continue;
			}

			throw new BadRequestException(`Security Alert: Corrupted or invalid file signature for "${file.originalname}".`);
		}

		// Block extension spoofing attacks
		if (allowedList.length > 0 && !allowedList.includes(actualMeta.mime)) {
			throw new BadRequestException(
				`Security Alert: Fake file detected! The actual content of "${file.originalname}" (${actualMeta.mime}) does not match allowed categories.`,
			);
		}
	}
};
