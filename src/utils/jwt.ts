import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../types';

export const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret as Secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshSecret as Secret,
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
  );
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
};

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(
    payload,
    config.jwt.secret as Secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );
}

