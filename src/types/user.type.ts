export interface JwtPayload {
  sub: number;
  email: string;
  jti: string;
  role?: string;
  iat?: number;
  exp?: number;
}
