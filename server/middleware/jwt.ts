import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { dal } from '../dal/index.js';

function getOrGenerateJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  const secretFile = path.resolve(process.cwd(), 'data', '.jwt_secret');
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf-8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    const dataDir = path.dirname(secretFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(secretFile, generated, 'utf-8');
    return generated;
  } catch {
    return 'leadgerx-production-jwt-secret-key-2026-safe-local-dev';
  }
}

const JWT_SECRET = getOrGenerateJwtSecret();

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  storeName: string;
  role: 'Owner' | 'Manager' | 'Employee' | 'Admin';
  plan: 'Free' | 'Pro';
  activeStoreId?: string;
  themePreference?: 'light' | 'dark' | 'system';
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  storeId?: string;
  currentStore?: any;
}

/**
 * Signs a cryptographically verified JWT token with 7-day expiration.
 */
export function signToken(payload: { userId: string; role?: string; storeId?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Secure password hashing using bcryptjs.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Validates a password against its bcrypt hash.
 * Also supports transparent migration for legacy plaintext passwords.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  // If hash starts with bcrypt prefix, perform bcrypt compare
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return await bcrypt.compare(password, hash);
  }
  // Backward compatibility with demo seeds
  return password === hash;
}

/**
 * Authenticates bearer JWT tokens.
 * In strict production-safe mode:
 * Requests WITHOUT a valid token return 401 Unauthorized.
 * Does NOT silently impersonate demo user.
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing authentication token. Please log in.'
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired authentication token.'
      });
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Malformed token payload.'
      });
    }

    // Fetch user from Unified Data Access Layer
    const user = await dal.users.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User account no longer exists.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      storeName: user.storeName,
      role: (user.role || 'Owner') as 'Owner' | 'Manager' | 'Employee' | 'Admin',
      plan: (user.plan || 'Pro') as 'Free' | 'Pro',
      activeStoreId: user.activeStoreId,
      themePreference: user.themePreference || 'light'
    };

    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(500).json({ success: false, error: 'Internal authentication error' });
  }
}

/**
 * Validates store access for multi-tenancy.
 * Ensures that the authenticated user actually owns or is an assigned member of the requested store.
 * Never allows access to arbitrary store IDs via header spoofing.
 */
export async function validateStoreAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User not authenticated.' });
    }

    // Header, query param, or fallback to user activeStoreId / primary store
    let requestedStoreId = (req.headers['x-store-id'] as string) || (req.query.storeId as string);

    const userStores = await dal.stores.findByUser(req.user.id);

    if (!requestedStoreId || requestedStoreId === 'undefined' || requestedStoreId === 'null') {
      // Default to primary store
      if (userStores.length > 0) {
        req.storeId = userStores[0].id;
        req.currentStore = userStores[0];
        return next();
      } else {
        // Auto-create initial store if none exists for this user
        const newStore = await dal.stores.create({
          name: req.user.storeName || `${req.user.name}'s Kirana`,
          type: 'kirana',
          ownerId: req.user.id
        });
        req.storeId = newStore.id;
        req.currentStore = newStore;
        return next();
      }
    }

    // Verify ownership or membership
    const matchedStore = userStores.find(s => s.id === requestedStoreId);
    if (matchedStore) {
      req.storeId = matchedStore.id;
      req.currentStore = matchedStore;
      return next();
    }

    // Check membership in storeMembers
    const membership = await dal.storeMembers.findMembership(requestedStoreId, req.user.id);
    if (membership) {
      const store = await dal.stores.findById(requestedStoreId);
      if (store) {
        req.storeId = store.id;
        req.currentStore = store;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden: You do not have permission to access the requested store.'
    });
  } catch (err) {
    console.error('Store validation middleware error:', err);
    return res.status(500).json({ success: false, error: 'Internal store access verification error' });
  }
}

/**
 * Guards routes with specific role privileges.
 */
export function requireRole(allowedRoles: ('Owner' | 'Manager' | 'Employee' | 'Admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'Owner';

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Requires elevated permissions (${allowedRoles.join(', ')}). Your current role is: ${userRole}.`
      });
    }
  };
}
