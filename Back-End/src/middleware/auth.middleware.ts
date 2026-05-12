import { Request, Response, NextFunction } from 'express';
import { auth } from '../auth';
import { fromNodeHeaders } from 'better-auth/node';

export interface AuthRequest extends Request {
  userId: string;
  sessionId: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  (req as AuthRequest).userId = session.user.id;
  (req as AuthRequest).sessionId = session.session.id;
  next();
}
