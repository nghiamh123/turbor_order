import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../../models/index.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/index.js';

/**
 * Auth service — handles authentication business logic.
 */
export const authService = {
  /**
   * Authenticate user by email and password.
   * Returns access token, refresh token, and user profile.
   */
  async login(email: string, password: string) {
    // Find user with password field included
    const user = await User.findOne({ email, isActive: true }).select('+password');

    if (!user) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'errors.auth.invalid_credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'errors.auth.invalid_credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        locale: user.locale,
      },
    };
  },

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new AppError(401, 'AUTH_INVALID_TOKEN', 'errors.auth.invalid_token');
      }

      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          locale: user.locale,
        },
      };
    } catch {
      throw new AppError(401, 'AUTH_INVALID_TOKEN', 'errors.auth.invalid_token');
    }
  },

  /** Generate short-lived access token (15min) */
  generateAccessToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id.toString() },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  },

  /** Generate long-lived refresh token (7 days) */
  generateRefreshToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id.toString() },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  },
};
