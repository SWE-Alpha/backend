import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtUser { id: string }

export const authenticate = (req: Request & { user?: JwtUser }, res: Response, next: NextFunction) => {
	try {
		const header = req.headers.authorization || '';
		const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
		if (!token) return res.status(401).json({ success: false, error: 'missing token' });

		const secret = process.env.JWT_SECRET || 'dev_secret';
		const payload = jwt.verify(token, secret) as JwtUser;
		req.user = { id: (payload as any).id };
		return next();
	} catch (err: any) {
		return res.status(401).json({ success: false, error: 'invalid token' });
	}
};

export default authenticate;
