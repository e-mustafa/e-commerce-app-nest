import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { EncryptionService } from './services/encryption.service';
import { GoogleAuthService } from './services/google-auth.service';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
	imports: [ConfigModule],
	providers: [EncryptionService, HashingService, TokenService, JwtService, GoogleAuthService, OAuth2Client],
	exports: [EncryptionService, HashingService, TokenService, JwtService, GoogleAuthService, OAuth2Client],
})
export class SecurityModule {}
