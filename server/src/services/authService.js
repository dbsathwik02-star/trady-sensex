import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = 'sensex-trader-secret-key-2024';
const TOKEN_EXPIRY = '24h';

// ── In-memory user store ───────────────────────────────────────────────────
// userId -> { id, username, email, passwordHash, createdAt }
const users = new Map();
// email -> userId  (index for quick lookup)
const emailIndex = new Map();

// ── Pre-create demo user ───────────────────────────────────────────────────
(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('demo123', salt);
  const id = uuidv4();
  const user = {
    id,
    username: 'Demo Trader',
    email: 'demo@sensex.com',
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };
  users.set(id, user);
  emailIndex.set('demo@sensex.com', id);
  console.log('[Auth] Demo user created — demo@sensex.com / demo123');
})();

// ── Public API ─────────────────────────────────────────────────────────────

export async function register(username, email, password) {
  if (!username || !email || !password) {
    throw new Error('Username, email and password are required');
  }

  if (emailIndex.has(email.toLowerCase())) {
    throw new Error('Email already registered');
  }

  if (password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const id = uuidv4();

  const user = {
    id,
    username,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.set(id, user);
  emailIndex.set(email.toLowerCase(), id);

  const token = generateToken(user);
  return { token, user: sanitise(user) };
}

export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const userId = emailIndex.get(email.toLowerCase());
  if (!userId) {
    throw new Error('Invalid email or password');
  }

  const user = users.get(userId);
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user);
  return { token, user: sanitise(user) };
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.id);
    if (!user) return null;
    return sanitise(user);
  } catch {
    return null;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
}

function sanitise(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}
