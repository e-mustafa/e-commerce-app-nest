import { BaseRepository } from '@/providers/database/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon } from './coupon.model';
import type { CouponModel, ICoupon } from './coupon.types';
import { QueryFilter } from 'mongoose';

@Injectable()
export class CouponRepository extends BaseRepository<ICoupon> {
	constructor(@InjectModel(Coupon.name) private readonly couponModel: CouponModel) {
		super(couponModel);
	}

	/**
	 * Dynamic filter evaluating dates per query execution
	 */
	protected override getDefaultFilter(): QueryFilter<ICoupon> {
		const currentDate = new Date();
		return {
			isActive: true,
			startDate: { $lte: currentDate },
			$or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: currentDate } }],
			deletedAt: null,
		};
	}

	/**
	 * Find active coupon by code
	 */
	async findActiveByCode(code: string): Promise<ICoupon | null> {
		return this.couponModel
			.findOne({
				code: code.trim().toUpperCase(),
				...this.getDefaultFilter(),
			})
			.exec();
	}
}
