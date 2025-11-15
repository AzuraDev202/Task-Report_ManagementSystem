import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from './auth';
import { unauthorizedResponse, forbiddenResponse } from './apiResponse';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function withAuth(handler: Function, allowedRoles?: string[]) {
  return async (request: NextRequest, context?: any) => {
    const token = getTokenFromRequest(request);

    if (!token) {
      return unauthorizedResponse('No token provided');
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return unauthorizedResponse('Invalid or expired token');
    }

    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
      return forbiddenResponse('Insufficient permissions');
    }

    // Attach user info to request
    (request as AuthenticatedRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Also pass simplified context with user object
    const userContext = {
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      params: context?.params || {},
    };

    return handler(request, userContext);
  };
}
