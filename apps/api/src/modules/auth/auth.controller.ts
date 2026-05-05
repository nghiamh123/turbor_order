import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { config } from '../../config/index.js';

/**
 * Auth controller — handles HTTP request/response for authentication.
 */
export const authController = {
  /** POST /auth/login */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /** POST /auth/refresh */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;

      if (!token) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTH_NO_REFRESH_TOKEN', message: 'errors.auth.no_refresh_token' },
        });
        return;
      }

      const result = await authService.refreshToken(token);

      // Rotate refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /** POST /auth/logout */
  async logout(_req: Request, res: Response) {
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json({ success: true });
  },
};
