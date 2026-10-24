import { calcAge } from '@/common/utils/date';
import { DBImage, schemaOptions } from '@/providers/database/schemas';
import { EncryptionService } from '@/providers/security/services/encryption.service';
import { HashingService } from '@/providers/security/services/hashing.service';
import { Field, ObjectType } from '@nestjs/graphql';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { AccountProviderEnum, GenderEnum, RoleEnum, StatusReasonEnum, UserStatusEnum } from './user.enums';
import { HUser } from './user.types';

export type UserTransformRet = Partial<User> & {
	_id?: Types.ObjectId;
	id?: string;
	password?: string;
	__v?: number;
};

@ObjectType(User.name, {
	description: 'User model',
})
@Schema(schemaOptions)
export class User {
	@Field(() => String)
	@Prop({
		type: String,
		required: true,
		minLength: [3, 'FirstName must be at least 3 characters'],
		maxLength: [30, 'FirstName must be at most 30 characters'],
		trim: true,
	})
	firstName: string;

	@Field(() => String)
	@Prop({
		type: String,
		required: true,
		minLength: [3, 'LastName must be at least 3 characters'],
		maxLength: [30, 'LastName must be at most 30 characters'],
		trim: true,
	})
	lastName: string;

	@Field(() => String)
	@Prop({
		type: String,
		required: true,
		minLength: [6, 'Username must be at least 6 characters'],
		maxLength: [30, 'Username must be at most 30 characters'],
		unique: true,
		trim: true,
		lowercase: true,
	})
	username: string;

	@Field(() => String)
	@Prop({
		type: String,
		required: [true, 'Email required.'],
		unique: true,
		maxLength: [50, 'Email must be at most 50 characters'],
		trim: true,
		lowercase: true,
		match: [/^\w+([-.]?\w+)*@\w+([-.]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
	})
	email: string;

	// @Field(() => String, { nullable: true })
	@Prop({
		type: String,
		required: [
			function (this: HUser) {
				return this.provider === AccountProviderEnum.SYSTEM;
			},
			'Password required.',
		],
		minLength: [8, 'Password must be at least 8 characters'],
	})
	password: string;

	@Field(() => AccountProviderEnum, { defaultValue: AccountProviderEnum.SYSTEM })
	@Prop({
		type: String,
		enum: {
			values: Object.values(AccountProviderEnum),
			message: "'{VALUE}' is not a valid provider", // {VALUE} will be replaced by the invalid value
		},
		default: AccountProviderEnum.SYSTEM,
	})
	provider: AccountProviderEnum;

	@Field(() => RoleEnum, { defaultValue: RoleEnum.USER })
	@Prop({
		type: String,
		enum: Object.values(RoleEnum),
		default: RoleEnum.USER,
	})
	role: RoleEnum;

	@Field(() => GenderEnum, { defaultValue: GenderEnum.MALE })
	@Prop({
		type: String,
		enum: Object.values(GenderEnum),
		default: GenderEnum.MALE,
	})
	gender: GenderEnum;

	@Field(() => String)
	@Prop(String)
	bio: string;

	@Field(() => DBImage, { nullable: true })
	@Prop({ type: DBImage, default: null, nullable: true })
	avatar: DBImage | null;

	@Field(() => DBImage, { nullable: true })
	@Prop({ type: DBImage, default: null, nullable: true })
	cover: DBImage | null;

	@Field(() => Date)
	@Prop({
		type: Date,
		validate: {
			validator: function (value: Date) {
				return value ? calcAge(value) || 0 >= 18 : true;
			},
			message: 'Age must be at least 18 years old!',
		},
	})
	birthdate: Date;

	@Field(() => String)
	@Prop(String)
	phone: string;

	@Field(() => Date)
	@Prop(Date)
	verifiedAt: Date;

	@Field(() => Date)
	@Prop(Date)
	loggedOutAllAt: Date;

	@Field(() => UserStatusEnum, { defaultValue: UserStatusEnum.ACTIVE })
	@Prop({
		type: String,
		enum: Object.values(UserStatusEnum),
		default: UserStatusEnum.ACTIVE,
	})
	status: UserStatusEnum;

	@Field(() => StatusReasonEnum, { nullable: true })
	@Prop({
		type: String,
		enum: Object.values(StatusReasonEnum),
	})
	statusReason: StatusReasonEnum;

	@Field(() => Date)
	@Prop(Date)
	statusChangedAt: Date;

	// @Field(() => [String])
	@Prop([String])
	deviceTokens: string[];

	@Field(() => Boolean, { defaultValue: true })
	@Prop({
		type: Boolean,
		default: true,
	})
	notificationEnabled: boolean;

	@Field(() => Date)
	@Prop(Date)
	deletedAt: Date;

	@Field(() => Date)
	@Prop(Date)
	lastSeenAt: Date;

	// TODO - add addresses model
}

export function createUserSchema(hashingService: HashingService, encryptionService: EncryptionService) {
	const userSchema = SchemaFactory.createForClass(User);

	// use mongoose-lean-virtuals to get virtuals in lean queries
	userSchema.plugin(mongooseLeanVirtuals);
	// userSchema.plugin(mongooseLeanGetters);

	// indexing ------------------------------------
	// Compound index for active and non-deleted user queries
	userSchema.index({ deletedAt: 1, status: 1 });
	userSchema.index({ friends: 1 });
	userSchema.index({ blockedUsers: 1 });

	// Virtuals ------------------------------------
	userSchema.virtual('name').get(function () {
		if (!this.firstName || !this.lastName) return '';
		return `${this.firstName} ${this.lastName || ''}`.trim();
	});

	// Dynamic Path Setters -------------------------
	userSchema.path('phone').set(function (value: string) {
		if (!value) return value;
		return encryptionService.isEncrypted(value) ? value : encryptionService.encrypt(value);
	});

	// userSchema.path('phone').get(function (value: string) {
	// 	if (!value) return value;
	// 	return encryptionService.isEncrypted(value) ? encryptionService.decrypt(value) : value;
	// });

	// Serialization Options ------------------------
	userSchema.set('toJSON', {
		virtuals: true,
		getters: true,
		transform(_doc, ret: UserTransformRet) {
			if (ret._id) {
				ret.id = ret._id.toString();
			}

			// Decrypt phone number only when transforming document to JSON response
			// if (ret.phone && encryptionService.isEncrypted(ret.phone)) {
			// 	ret.phone = encryptionService.decrypt(ret.phone);
			// }

			delete ret.password;
			delete ret.__v;
			return ret;
		},
	});

	// Middlewares ----------------------------------
	userSchema.pre('save', async function () {
		if (this.password && this.isModified('password')) {
			this.password = await hashingService.generateHash(this.password, undefined, true);
		}
	});

	return userSchema;
}

// export const userModel = MongooseModule.forFeature([{ name: User.name, schema: userSchema }]);
export const userModel = MongooseModule.forFeatureAsync([
	{
		name: User.name,
		inject: [HashingService, EncryptionService],
		useFactory: (hashingService: HashingService, encryptionService: EncryptionService) =>
			createUserSchema(hashingService, encryptionService),
	},
]);
