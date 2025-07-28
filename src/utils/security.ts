// Security utility functions for the application

// Rate limiting for forms (simple client-side implementation)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (key: string, maxRequests = 5, windowMs = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, lastReset: now };
  
  // Reset if window has passed
  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }
  
  record.count++;
  rateLimitMap.set(key, record);
  
  return record.count <= maxRequests;
};

// Clear rate limit for a key (useful after successful operations)
export const clearRateLimit = (key: string): void => {
  rateLimitMap.delete(key);
};

// Generate rate limit key based on user ID or IP simulation
export const getRateLimitKey = (prefix: string, userId?: string): string => {
  // In a real app, you'd use IP address or session ID
  // For now, use user ID or a random identifier
  const identifier = userId || 'anonymous';
  return `${prefix}_${identifier}`;
};

// Security-related constants
export const SECURITY_CONFIG = {
  MAX_COMMENT_LENGTH: 1000,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_COOLDOWN_MS: 300000, // 5 minutes
  FORM_SUBMISSION_LIMIT: 5,
  FORM_SUBMISSION_WINDOW_MS: 60000 // 1 minute
} as const;