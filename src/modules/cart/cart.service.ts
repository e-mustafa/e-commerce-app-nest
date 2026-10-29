import { NotFoundException } from '@/common/exceptions';
import { Id } from '@/common/types';
import { IQueryOptions } from '@/providers/database/query-builder';
import { Injectable } from '@nestjs/common';
import { IProduct, productGeneralSelect } from '../product';
import { ProductRepository } from '../product/product.repository';
import type * as I from './cart-service.interface';
import { CartRepository } from './cart.repository';
import type { HCart, HCartWProduct, ICart, ICartItem, ICartResponse } from './cart.types';

const selectCartProduct = productGeneralSelect || 'title excerpt images slug price';

//TODO - recalculate cart subtotal, total and item subtotal when get

@Injectable()
export class CartService {
	constructor(
		private readonly productRepo: ProductRepository,
		private readonly cartRepo: CartRepository,
	) {}

	// Private helper to recalculate overall cart total price
	private recalculateCartTotal(cart: HCart) {
		cart.totalPrice = cart.items.reduce((total, item) => total + item.subTotal, 0);
		return cart;
	}

	private async getRawCart(userId: Id): Promise<HCart> {
		let cart = await this.cartRepo.findOne({ user: userId }).exec();
		if (!cart) {
			return await this.cartRepo.create({ user: userId, items: [] });
		}
		return cart;
	}

	/**
	 * Retrieves cart and dynamically updates item prices against database state.
	 */
	async getCartAndSyncPrices(userId: Id): Promise<ICartResponse> {
		const cart = await this.cartRepo
			.findOne({ user: userId })
			.populate<HCartWProduct>({
				path: 'items.product',
				select: selectCartProduct,
				options: { slice: { images: 1 } }, // get only first image
			})
			.exec();

		if (!cart) {
			throw new NotFoundException('Cart not found');
		}

		let hasPriceChanged = false;
		const priceChangeMessages: string[] = [];
		let calculatedSubTotal = 0;

		const validItems = [];

		for (const item of cart.items) {
			const product = item.product;

			// Drop items that are deleted or marked inactive by admin
			if (!product || !product.publishedAt) {
				hasPriceChanged = true;
				priceChangeMessages.push(`An item in your cart is no longer available.`);
				continue;
			}

			// Evaluate active unit price (Discount price takes precedence)
			// const currentUnitPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
			const currentUnitPrice = product.finalPrice;

			// Check if admin modified price since last cart update
			if (item.finalPrice !== currentUnitPrice) {
				hasPriceChanged = true;
				priceChangeMessages.push(`Price for "${product.title}" changed from $${item.price} to $${currentUnitPrice}.`);
				item.price = currentUnitPrice;
			}

			// Calculate line item subtotal
			item.subTotal = item.price * item.quantity;
			calculatedSubTotal += item.subTotal;

			validItems.push(item);
		}

		// Update cart state in database if adjustments occurred
		cart.items = validItems;
		cart.subTotal = calculatedSubTotal;
		cart.totalPrice = calculatedSubTotal; // Add tax or shipping calculation here if required

		if (hasPriceChanged) {
			await cart.save();
		}

		return {
			cart,
			hasPriceChanged,
			priceChangeMessages,
		};
	}

	async addToCart({ userId, productId, quantity }: I.IAddToCartPayload) {
		const product = await this.productRepo.findById(productId).lean<IProduct>().exec();
		if (!product) throw new NotFoundException('Product not found.');

		if (quantity > product.stock) {
			throw new NotFoundException(`Product not enough in stock. Available: ${product.stock}`);
		}

		const cart = await this.getRawCart(userId);

		const itemIndex = cart.items.findIndex((item) => item.product.toString() === product._id.toString());
		// const productPrice = product.discountPrice || product.price;
		const productPrice = product.finalPrice || product.price;

		if (itemIndex >= 0) {
			const item = cart.items[itemIndex];
			const newQuantity = item.quantity + quantity;
			if (newQuantity > product.stock) {
				throw new NotFoundException(`Product not enough in stock. Available: ${product.stock}`);
			}
			item.quantity = newQuantity;
			item.subTotal = newQuantity * productPrice;
		} else {
			cart.items.push({
				product: productId,
				quantity,
				price: product.price,
				discount: product.discount,
				finalPrice: productPrice,
				subTotal: productPrice * quantity,
			});
		}

		this.recalculateCartTotal(cart);
		return (
			await (
				await cart.save()
			).populate({ path: 'items.product', select: selectCartProduct, options: { slice: { images: 1 } } })
		).toObject();
	}

	async getCart(userId: Id): Promise<ICart> {
		let cart = await this.cartRepo
			.findOne({ user: userId })
			.lean()
			.populate({ path: 'items.product', select: selectCartProduct, options: { slice: { images: 1 } } })
			.exec();

		if (!cart) {
			cart = await this.cartRepo.create({ user: userId, items: [] });
		}
		return cart;
	}

	async removeProduct(userId: Id, productId: Id) {
		const cart = await this.getRawCart(userId);

		cart.items = cart.items.filter((item) => item.product.toString() !== productId.toString());

		this.recalculateCartTotal(cart);
		return (
			await (
				await cart.save()
			).populate({ path: 'items.product', select: selectCartProduct, options: { slice: { images: 1 } } })
		).toObject();
	}

	async incrementProduct(userId: Id, productId: Id) {
		const cart = await this.getRawCart(userId);
		const item = cart.items.find((item) => item.product.toString() === productId.toString());
		if (!item) throw new NotFoundException('Product not found in cart.');

		const product = await this.productRepo.findById(productId).lean<IProduct>().select('stock').exec();
		if (!product) throw new NotFoundException('Product not found.');

		item.quantity += 1;
		if (item.quantity > product.stock) {
			throw new NotFoundException(`Product not enough in stock. Available: ${product.stock}`);
		}
		item.subTotal = item.quantity * item.price;
		this.recalculateCartTotal(cart);

		return (
			await (
				await cart.save()
			).populate({ path: 'items.product', select: selectCartProduct, options: { slice: { images: 1 } } })
		).toObject();
	}

	async decrementProduct(userId: Id, productId: Id) {
		const cart = await this.getRawCart(userId);
		const item = cart.items.find((item) => item.product.toString() === productId.toString());
		if (!item) throw new NotFoundException('Product is not in cart.');

		if (item.quantity <= 1) {
			return this.removeProduct(userId, productId);
		}

		item.quantity -= 1;
		item.subTotal = item.quantity * item.price;
		this.recalculateCartTotal(cart);

		return (
			await (
				await cart.save()
			).populate({ path: 'items.product', select: selectCartProduct, options: { slice: { images: 1 } } })
		).toObject();
	}

	async syncCart({ userId, items }: I.ISyncCartPayload) {
		const productIds: string[] = items.map((item) => item.productId);

		const products = await this.productRepo
			.find({ _id: { $in: productIds } })
			.lean<IProduct[]>()
			.exec();

		if (products.length === 0) throw new NotFoundException('Products not found.');

		const itemsToAdd: ICartItem[] = products.map((p) => {
			const item = items.find((i) => i.productId === p._id.toString());
			let quantity = item?.quantity || 1;
			if (quantity > p.stock) quantity = p.stock;

			const price = p.finalPrice || p.price;
			const subTotal = price * quantity;

			return {
				product: p._id.toString(),
				quantity,
				price: p.price,
				discount: p.discount,
				finalPrice: p.finalPrice || p.price,
				subTotal,
			};
		});

		const cart = await this.getRawCart(userId);
		cart.items = itemsToAdd;

		this.recalculateCartTotal(cart);
		return (await cart.save()).populate({
			path: 'items.product',
			select: selectCartProduct,
			options: { slice: { images: 1 } },
		});
	}

	async clearCart(userId: Id, options?: IQueryOptions) {
		const cart = await this.cartRepo.findOne({ user: userId }, options).exec();
		if (!cart) return true;
		cart.items = [];

		this.recalculateCartTotal(cart);
		return (await cart.save()).toObject();
	}
}
