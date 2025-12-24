import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Hash string menggunakan bcrypt
 * @param password string yang akan di-hash
 * @returns string yang sudah di-hash
 */
export async function hashString(password: string) {
  return await bcrypt.hash(password, 10);
}

/** Verifikasi string dengan hash bcrypt
 * @param password string yang akan diverifikasi
 * @param hashed hash yang akan dibandingkan
 * @returns boolean
 */
export async function verifyString(password: string, hashed: string) {
  return await bcrypt.compare(password, hashed);
}

/** Generate random string dengan karakter alfanumerik
 * @param length panjang string yang diinginkan
 * @returns string acak
 */
export function strRandom(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = '';
  const charLen = chars.length;

  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % charLen];
  }

  return result;
}

/**
 * Generate API key publik dan privat
 * @returns object dengan properti publicKey dan privateKey
 */
export function generateApiKey() {
  return {
    publicKey: strRandom(64),
    privateKey: strRandom(32),
  };
}

/**
 * Generate client key dan secret
 * @returns object dengan properti key dan secret
 */
export function generateClientSecret() {
  return {
    key: crypto.randomBytes(16).toString('hex'),
    secret: crypto.randomBytes(16).toString('hex'),
  };
}
