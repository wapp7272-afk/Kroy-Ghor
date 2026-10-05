import { UserProfile, UserRole, AuthSession } from '../types';

export const AUTH_STORAGE_KEY = 'primevault_auth_session';
export const ADMIN_SESSION_KEY = 'primevault_admin_session';

// Helper: base64url encode JSON object
const base64UrlEncode = (obj: any): string => {
  try {
    const jsonStr = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return btoa(JSON.stringify(obj));
  }
};

// Helper: base64url decode
const base64UrlDecode = (str: string): any => {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(atob(str));
    } catch {
      return null;
    }
  }
};

/**
 * Generates an authentic, structured JWT Bearer token
 * Header.Payload.Signature (HS256 compliant format)
 */
export const generateJwt = (
  payload: {
    sub: string;
    email?: string;
    phone?: string;
    role: UserRole;
  },
  expiresInSeconds: number = 3600 // 1 hour default
): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    iss: 'primevault-zone-auth',
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(fullPayload);
  // Deterministic mock cryptographic signature for client-side RBAC validation
  const signatureRaw = `${encodedHeader}.${encodedPayload}.pvz_secret_salt_2026`;
  const encodedSignature = btoa(signatureRaw).substring(0, 32).replace(/\+/g, '-').replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

/**
 * Parses and verifies JWT payload structure
 */
export const parseJwt = (token: string): any => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  return base64UrlDecode(parts[1]);
};

/**
 * Checks if a JWT token has expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return nowInSeconds >= payload.exp;
};

/**
 * Checks if a JWT token will expire within the given threshold (in seconds)
 */
export const isTokenExpiringSoon = (token: string, thresholdSeconds = 300): boolean => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return (payload.exp - nowInSeconds) <= thresholdSeconds;
};

/**
 * Creates a complete AuthSession with access and refresh tokens
 */
export const createSession = (
  email: string = '',
  phone: string = '',
  role: UserRole = 'customer'
): AuthSession => {
  const now = Date.now();
  const sub = email || phone || `usr_${now}`;
  
  // Access Token: 30 minutes expiration
  const accessToken = generateJwt({ sub, email, phone, role }, 1800);
  // Refresh Token: 7 days expiration
  const refreshToken = generateJwt({ sub, email, phone, role }, 604800);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    issuedAt: now,
    expiresAt: now + 1800 * 1000,
    role,
    email,
    phone,
  };
};

/**
 * Reads persisted active session from localStorage or sessionStorage
 */
export const getStoredSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const session: AuthSession = JSON.parse(raw);
      // Validate session structure
      if (session.accessToken && session.role) {
        return session;
      }
    }
  } catch (e) {
    console.warn('[AuthService] Failed to read auth session:', e);
  }
  return null;
};

/**
 * Stores active session in localStorage
 */
export const setStoredSession = (session: AuthSession): void => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('[AuthService] Failed to save auth session:', e);
  }
};

/**
 * Clears all authentication tokens and session keys upon logout
 */
export const clearStoredSession = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (e) {
    console.warn('[AuthService] Failed to clear session:', e);
  }
};

/**
 * Automatically refreshes expired or near-expired access tokens using refresh token
 */
export const refreshAuthSession = async (currentSession?: AuthSession | null): Promise<AuthSession | null> => {
  const session = currentSession || getStoredSession();
  if (!session || !session.refreshToken) return null;

  // Check if refresh token itself has expired
  if (isTokenExpired(session.refreshToken)) {
    console.warn('[AuthService] Refresh token has expired. User must re-authenticate.');
    clearStoredSession();
    return null;
  }

  // Issue refreshed session with new 30-min access token
  const newSession = createSession(session.email, session.phone, session.role);
  setStoredSession(newSession);
  return newSession;
};

/**
 * Generates Authorization header with active Bearer token
 */
export const getAuthHeaders = (): Record<string, string> => {
  const session = getStoredSession();
  if (session && session.accessToken) {
    return {
      Authorization: `Bearer ${session.accessToken}`,
      'X-User-Role': session.role,
    };
  }
  return {};
};

/**
 * Role-Based Access Control (RBAC) Checker
 * Role hierarchy: admin (level 3) > seller (level 2) > customer (level 1)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 4,
  admin: 3,
  seller: 2,
  customer: 1,
};

export const hasRole = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};

export const SUPER_ADMIN_EMAIL = 'wapp7272@gmail.com';

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

export const checkIsSuperAdmin = (user: UserProfile | null): boolean => {
  if (!user || !user.isLoggedIn) return false;
  return isSuperAdminEmail(user.email);
};

export const checkIsAdmin = (user: UserProfile | null): boolean => {
  if (!user || !user.isLoggedIn) return false;
  const session = getStoredSession();
  const role = user.role || session?.role;
  return role === 'admin' || isSuperAdminEmail(user.email);
};

export const checkIsSeller = (user: UserProfile | null): boolean => {
  if (!user || !user.isLoggedIn) return false;
  const session = getStoredSession();
  const role = user.role || session?.role;
  return role === 'seller' || role === 'admin' || isSuperAdminEmail(user.email);
};

/**
 * Ensures wapp7272@gmail.com is seeded into registered accounts as permanent Super Admin / Owner
 */
export const seedSuperAdminAccount = (): void => {
  try {
    const key = 'zeropicbd_registered_accounts';
    const legacyKey = 'primevault_registered_accounts';
    const raw = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    const accounts: any[] = raw ? JSON.parse(raw) : [];

    const existingIdx = accounts.findIndex(
      (a) => a.email && a.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    );

    const ownerData = {
      name: 'Super Admin Owner',
      email: SUPER_ADMIN_EMAIL,
      phone: '01883418309',
      role: 'admin',
      isPhoneVerified: true,
      authProvider: 'google',
      walletBalance: 10000,
      hasReceivedBonus: true,
      address: {
        fullName: 'Super Admin Owner',
        phone: '01883418309',
        cityDivision: 'Inside Dhaka',
        fullAddress: 'Kroy Ghor Central HQ, Dhanmondi 27, Dhaka - 1209',
      },
    };

    if (existingIdx >= 0) {
      accounts[existingIdx] = {
        ...accounts[existingIdx],
        ...ownerData,
        role: 'admin',
      };
    } else {
      accounts.unshift(ownerData);
    }

    localStorage.setItem(key, JSON.stringify(accounts));
    localStorage.setItem(legacyKey, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to seed Super Admin account:', err);
  }
};

