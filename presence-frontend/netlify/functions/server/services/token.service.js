import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// Works whether given a Mongoose document (uses its toJSON transform, which
// already strips passwordHash/_id/__v) or a plain object.
export function publicUser(user) {
  return typeof user.toJSON === 'function' ? user.toJSON() : user;
}
