import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { getDatabase } from '../database/db.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export interface DatabaseUser {
  id: number;
  email: string;
  role: 'user' | 'admin';
  api_key?: string;
  created_at?: string;
  last_login?: string;
}

export interface TokenClaims extends JwtPayload {
  sub: string; // User ID
  email: string;
  role: 'user' | 'admin';
  jti: string; // Unique Token Identifier
}

export interface GeneratedTokenResult {
  token: string;
  tokenId: string;
  expiresAt: string;
  expiresInSeconds: number;
  user: {
    id: number;
    email: string;
    role: 'user' | 'admin';
  };
}

export interface JwtTokenRecord {
  id: number;
  user_id: number;
  token_id: string;
  name: string;
  expires_at: string;
  revoked: boolean;
  revoked_at: string | null;
  last_used_at: string;
  created_at: string;
}

class JwtService {
  private getSecretKey(userSecret?: string | null): string {
    if (userSecret && userSecret.trim()) {
      return `${config.jwtSecret}-${userSecret}`;
    }
    return config.jwtSecret;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a JWT signed token and stores its registration inside the PostgreSQL database itself.
   */
  async issueDatabaseToken(
    user: DatabaseUser,
    options: {
      name?: string;
      expiresInDays?: number;
      userSecret?: string | null;
    } = {}
  ): Promise<GeneratedTokenResult> {
    const db = await getDatabase();
    const tokenId = `jwt_${crypto.randomBytes(16).toString('hex')}`;
    const expiresInDays = options.expiresInDays && options.expiresInDays > 0 ? options.expiresInDays : 7;
    const expiresInSeconds = expiresInDays * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const secretKey = this.getSecretKey(options.userSecret);

    const payload: TokenClaims = {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      jti: tokenId,
    };

    const token = jwt.sign(payload, secretKey, {
      expiresIn: `${expiresInDays}d`,
      issuer: 'uaforge-auth',
      audience: 'uaforge-api',
    });

    const tokenHash = this.hashToken(token);
    const tokenName = options.name || 'API Session Token';

    // Store the token directly in the database
    await db.query(
      `INSERT INTO jwt_tokens (user_id, token_id, name, token_hash, expires_at, revoked, last_used_at)
       VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)`,
      [user.id, tokenId, tokenName, tokenHash, expiresAt.toISOString()]
    );

    // Update user's last login
    await db.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    logger.info('Database JWT issued', {
      metadata: {
        userId: user.id,
        tokenId,
        expiresAt: expiresAt.toISOString(),
        role: user.role,
      },
    });

    return {
      token,
      tokenId,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Validates a JWT against both its mathematical cryptographic signature
   * AND the PostgreSQL database record itself (checking revocation status, expiry, and existence).
   */
  async verifyDatabaseToken(token: string): Promise<{
    user: DatabaseUser;
    claims: TokenClaims;
    tokenId: string;
  }> {
    const db = await getDatabase();

    // 1. Decode token claims without verifying signature first to identify user
    const decoded = jwt.decode(token) as TokenClaims | null;
    if (!decoded || !decoded.sub || !decoded.jti) {
      throw new Error('Invalid token structure');
    }

    const userId = parseInt(decoded.sub, 10);
    if (isNaN(userId)) {
      throw new Error('Malformed token subject');
    }

    // 2. Query user from the PostgreSQL database
    const userRes = await db.query<DatabaseUser & { jwt_secret: string }>(
      `SELECT id, email, role, api_key, jwt_secret, created_at, last_login
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userRes.rowCount === 0) {
      throw new Error('User record not found in database');
    }

    const dbUser = userRes.rows[0];

    // 3. Cryptographically verify signature with database user secret
    const secretKey = this.getSecretKey(dbUser.jwt_secret);
    let verifiedClaims: TokenClaims;
    try {
      verifiedClaims = jwt.verify(token, secretKey, {
        issuer: 'uaforge-auth',
        audience: 'uaforge-api',
      }) as TokenClaims;
    } catch (jwtErr: any) {
      throw new Error(`Token cryptographic verification failed: ${jwtErr.message}`);
    }

    // 4. Query the database jwt_tokens table to verify the token is active and not revoked
    const tokenRes = await db.query<JwtTokenRecord>(
      `SELECT id, user_id, token_id, name, expires_at, revoked, revoked_at
       FROM jwt_tokens
       WHERE token_id = $1 AND user_id = $2`,
      [verifiedClaims.jti, userId]
    );

    if (tokenRes.rowCount === 0) {
      throw new Error('Token is not registered in the database');
    }

    const tokenRecord = tokenRes.rows[0];

    if (tokenRecord.revoked) {
      throw new Error('Token has been revoked in the database');
    }

    const expiresAt = new Date(tokenRecord.expires_at).getTime();
    if (Date.now() > expiresAt) {
      throw new Error('Token has expired in the database');
    }

    // 5. Update last_used_at in the database (fire and forget for efficiency)
    db.query(
      `UPDATE jwt_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_id = $1`,
      [verifiedClaims.jti]
    ).catch((err) => {
      logger.debug('Failed to update token last_used_at', err);
    });

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        api_key: dbUser.api_key,
        created_at: dbUser.created_at,
        last_login: dbUser.last_login,
      },
      claims: verifiedClaims,
      tokenId: verifiedClaims.jti,
    };
  }

  /**
   * Revoke a specific token in the database
   */
  async revokeToken(tokenId: string, userId?: number): Promise<boolean> {
    const db = await getDatabase();
    let query = `UPDATE jwt_tokens SET revoked = true, revoked_at = CURRENT_TIMESTAMP WHERE token_id = $1`;
    const params: any[] = [tokenId];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    const res = await db.query(query, params);
    return res.rowCount > 0;
  }

  /**
   * List all database JWT tokens for a specific user
   */
  async getUserTokens(userId: number): Promise<JwtTokenRecord[]> {
    const db = await getDatabase();
    const res = await db.query<JwtTokenRecord>(
      `SELECT id, user_id, token_id, name, expires_at, revoked, revoked_at, last_used_at, created_at
       FROM jwt_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  /**
   * Invalidate all tokens for a user by rotating their secret in the database
   */
  async invalidateAllUserTokens(userId: number): Promise<void> {
    const db = await getDatabase();
    const newSecret = crypto.randomBytes(32).toString('hex');
    await db.query(
      `UPDATE users SET jwt_secret = $1 WHERE id = $2`,
      [newSecret, userId]
    );
    await db.query(
      `UPDATE jwt_tokens SET revoked = true, revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId]
    );
  }
}

export const jwtService = new JwtService();
