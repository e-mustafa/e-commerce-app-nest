import { NextFunction, Request, Response } from 'express';

export const logStartTimeMiddleware = (req: Request, _res: Response, next: NextFunction) => {
	req.startAt = Date.now();
	next();
};
