import { IUserBody } from '../../providers/database/database.type';
import { IJwtPayload } from '../../providers/security';

// Standard global Express augmentation for mixed/public routes
declare global {
	namespace Express {
		interface Request {
			// user?: HUser;
			user?: IUserBody;
			decoded?: IJwtPayload;
			body: Record<string, unknown>;
		}
	}
}

// declare module 'express-serve-static-core' {
// 	interface Request {
// 		user?: IUserBody;
// 		decoded?: IJwtPayload;
// 		body: Record<string, unknown>;
// 	}
// }

declare module 'Socket.io' {
	interface Socket {
		// user: HUser;
		user?: IUserBody;
		userId?: string;
		decoded?: IJwtPayload;
	}
}
declare global {
	namespace Express {
		interface Request {
			// user?: HUser;
			user?: IUserBody;
			userId?: string;
			decoded?: IJwtPayload;
			body: Record<string, unknown>;
		}
	}
}
