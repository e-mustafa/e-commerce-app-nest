import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaginationMetadataResponse {
	@Field(() => Int)
	page: number;

	@Field(() => Int)
	limit: number;

	@Field(() => Int)
	total: number;

	@Field(() => Int)
	totalPages: number;

	@Field(() => Boolean)
	hasNext: boolean;

	@Field(() => Boolean)
	hasPrev: boolean;
}

// Generic factory function to create paginated response types for any model
export function PaginatedResponse<T>(classRef: Type<T>) {
	@ObjectType({ isAbstract: true })
	abstract class PaginatedType {
		@Field(() => [classRef])
		data: T[];

		@Field(() => PaginationMetadataResponse)
		metadata: PaginationMetadataResponse;
	}

	return PaginatedType;
}
