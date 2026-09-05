export interface AuthorizationContext {
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export const createDefaultAuthContext = (
  overrides?: Partial<AuthorizationContext>,
): AuthorizationContext => ({
  timestamp: new Date(),
  ...overrides,
});
