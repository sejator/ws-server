declare namespace Express {
  interface Request {
    user?: {
      sub: number;
      email: string;
      jti: string;
      role?: string;
      iat?: number;
      exp?: number;
    };
    client?: {
      name: string;
      id: number;
      userId: number;
      key: string;
      secret: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}
