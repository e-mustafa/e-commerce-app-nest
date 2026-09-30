import { envConfig } from '@/config';

export const formatFilePath = (filePath: string): string | null => {
	if (filePath) {
		if (filePath.startsWith('http')) return filePath;

		return `${envConfig().appUrl}/${filePath.replace(/\\/g, '/')}`;
	}
	return null;
};
