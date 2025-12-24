import * as crypto from 'crypto';

/**
 * Verifikasi signature WebSocket untuk otorisasi channel
 * @param socketId ID socket client
 * @param channel nama channel
 * @param providedSignature signature yang diberikan client
 * @param secret secret app
 * @returns boolean
 */
export function verifyWebSocketSignature(
  socketId: string,
  channel: string,
  providedSignature: string,
  secret: string,
): boolean {
  const signature = providedSignature.split(':');

  if (signature.length !== 2) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${socketId}:${channel}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature[1], 'hex'),
    );
  } catch {
    return false;
  }
}

/**
 * Generate HMAC signature untuk request API
 * @param appKey app key
 * @param timestamp timestamp request
 * @param appSecret app secret
 * @returns signature dalam format hex
 */
export function generateHmacSignature(
  appKey: string,
  timestamp: string,
  appSecret: string,
): string {
  const message = `${appKey}.${timestamp}`;
  return crypto.createHmac('sha256', appSecret).update(message).digest('hex');
}

/**
 * Verifikasi HMAC signature
 */
export function verifyHmacSignature(
  appKey: string,
  timestamp: string,
  providedSignature: string,
  appSecret: string,
): boolean {
  const expectedSignature = generateHmacSignature(appKey, timestamp, appSecret);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex'),
    );
  } catch {
    return false;
  }
}
