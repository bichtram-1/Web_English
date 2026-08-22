import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload } from '../types/auth.types';

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
