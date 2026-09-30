import { NotFoundException } from '@/common/exceptions';
import { Id } from '@/common/types';
import { Injectable } from '@nestjs/common';
import { IProduct } from '../product';
import { ProductRepository } from '../product/product.repository';
import type * as I from './cart-service.interface';
import { CartRepository } from './cart.repository';
import { CartItem, HCart } from './cart.types';

const selectCartProduct = 'title excerpt images slug price';

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
			cart = await this.cartRepo.create({ user: userId, items: [] });
		}
		return cart;
	}

	async addToCart({ userId, productId, quantity }: I.IAddToCartPayload) {
		const product = await this.productRepo.findById(productId).lean<IProduct>().exec();
		if (!product) throw new NotFoundException('Product not found.');

		if (quantity > product.stock) {
			throw new NotFoundException(`Product not enough in stock. Available: ${product.stock}`);
		}

		const cart = await this.getRawCart(userId);

		const itemIndex = cart.items.findIndex((item) => item.product.toString() === product._id.toString());
		const productPrice = product.discountPrice || product.price;

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
				pricePerUnit: productPrice,
				subTotal: productPrice * quantity,
			});
		}

		this.recalculateCartTotal(cart);
		return (await cart.save()).populate('items.product', selectCartProduct);
	}

	async getCart(userId: Id): Promise<HCart> {
		let cart = await this.cartRepo
			.findOne({ user: userId })
			.populate({ path: 'items.product', select: selectCartProduct })
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
		return (await cart.save()).populate('items.product', selectCartProduct);
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
		item.subTotal = item.quantity * item.pricePerUnit;
		this.recalculateCartTotal(cart);

		return (await cart.save()).populate('items.product', selectCartProduct);
	}

	async decrementProduct(userId: Id, productId: Id) {
		const cart = await this.getRawCart(userId);
		const item = cart.items.find((item) => item.product.toString() === productId.toString());
		if (!item) throw new NotFoundException('Product is not in cart.');

		if (item.quantity <= 1) {
			return this.removeProduct(userId, productId);
		}

		item.quantity -= 1;
		item.subTotal = item.quantity * item.pricePerUnit;
		this.recalculateCartTotal(cart);

		return (await cart.save()).populate('items.product', selectCartProduct);
	}

	async syncCart({ userId, items }: I.ISyncCartPayload) {
		const productIds: string[] = items.map((item) => item.productId);

		const products = await this.productRepo
			.find({ _id: { $in: productIds } })
			.lean<IProduct[]>()
			.exec();

		if (products.length === 0) throw new NotFoundException('Products not found.');

		const itemsToAdd: CartItem[] = products.map((p) => {
			const item = items.find((i) => i.productId === p._id.toString());
			let quantity = item?.quantity || 1;
			if (quantity > p.stock) quantity = p.stock;

			const pricePerUnit = p.discountPrice || p.price;
			const subTotal = pricePerUnit * quantity;

			return {
				product: p._id.toString(),
				quantity,
				pricePerUnit,
				subTotal,
			};
		});

		const cart = await this.getRawCart(userId);
		cart.items = itemsToAdd;

		this.recalculateCartTotal(cart);
		return (await cart.save()).populate('items.product', selectCartProduct);
	}
}
