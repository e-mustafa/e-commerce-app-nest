import { type EnvConfig, envConfig } from '@/config';
import { Inject, Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

@Injectable()
export class EncryptionService {
	private algorithm = 'aes-256-cbc';
	private ENCRYPTION_SECRET_KEY = Buffer.from('', 'hex');
	private IV_LENGTH = 16;

	constructor(@Inject(envConfig.KEY) private readonly ENV: EnvConfig) {
		const { algorithm, encKey, iv } = this.ENV.security.encryption;
		this.algorithm = algorithm;
		this.ENCRYPTION_SECRET_KEY = Buffer.from(encKey || '', 'hex');
		this.IV_LENGTH = Number(iv) || 12;
	}

	/**
	 * Checks if a string is encrypted
	 * @param {string} text - The text to check
	 * @returns {boolean} - True if the text is encrypted, false otherwise
	 */
	public isEncrypted(text: string): boolean {
		return text.startsWith('enc:');
	}

	/**
	 * Encrypts a string using AES-256-CBC
	 * @param {string} text - The text to encrypt
	 * @returns {string} - The encrypted text in the format "iv:encryptedText"
	 */
	public encrypt(text: string): string {
		try {
			if (!text) return text;

			const iv = randomBytes(this.IV_LENGTH);
			const cipher = createCipheriv(this.algorithm, this.ENCRYPTION_SECRET_KEY, iv);

			let encryptedText = cipher.update(text, 'utf8', 'hex');
			encryptedText += cipher.final('hex');
			// return `${iv.toString('hex')}:${encryptedText}`;
			// add prefix to identify encrypted data
			return `enc:${iv.toString('hex')}:${encryptedText}`;
		} catch (error) {
			console.error('Error encrypting text:', error);
			return text;
		}
	}

	/**
	 * Decrypts a string using AES-256-CBC
	 * @param {string} encryptedData - The encrypted data in the format "iv:encryptedText"
	 * @returns {string} - The decrypted text
	 */
	public decrypt(encryptedData = '') {
		try {
			if (!encryptedData.startsWith('enc:')) {
				return encryptedData;
			}
			const [_, iv, encryptedText] = encryptedData.split(':');

			const binaryLikeIv = Buffer.from(iv || '', 'hex');

			const decipher = createDecipheriv(this.algorithm, this.ENCRYPTION_SECRET_KEY, binaryLikeIv);

			let decryptedText = decipher.update(encryptedText || '', 'hex', 'utf8');
			decryptedText += decipher.final('utf8');
			return decryptedText;
		} catch (error) {
			console.error('Error decrypting text:', error);
			return encryptedData;
		}
	}
}
