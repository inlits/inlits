import { supabase } from './supabase';

/**
 * Security utility functions for Inlits
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate that a string contains only allowed characters
 */
export function validateInputPattern(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

/**
 * Log security events for auditing
 */
export async function logSecurityEvent(
  event: string, 
  details: Record<string, any> = {},
  userId?: string
): Promise<void> {
  try {
    // Get client IP if available
    const ipAddress = 'client-side';
    
    await supabase
      .from('security_logs')
      .insert({
        event,
        details,
        ip_address: ipAddress,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Check if a password meets security requirements
 */
export function isStrongPassword(password: string): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate file uploads for security
 */
export function validateFileUpload(
  file: File, 
  allowedTypes: string[], 
  maxSizeInBytes: number
): { 
  isValid: boolean; 
  error?: string 
} {
  // Check file size
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeInBytes / (1024 * 1024)}MB`
    };
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Create a Content Security Policy header value
 */
export function generateCSP(): string {
  return `
    default-src 'self';
    script-src 'self' https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' https://source.unsplash.com https://images.pexels.com https://*.supabase.co data:;
    font-src 'self';
    connect-src 'self' https://*.supabase.co https://www.google-analytics.com;
    media-src 'self' https://*.supabase.co;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim();
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Set security headers
  headers.set('Content-Security-Policy', generateCSP());
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private static instances: Map<string, RateLimiter> = new Map();
  private requests: Map<string, { count: number, resetTime: number }> = new Map();
  private windowMs: number;
  private maxRequests: number;
  
  private constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  
  public static getInstance(key: string, windowMs = 60000, maxRequests = 100): RateLimiter {
    if (!this.instances.has(key)) {
      this.instances.set(key, new RateLimiter(windowMs, maxRequests));
    }
    return this.instances.get(key)!;
  }
  
  public isRateLimited(key: string): boolean {
    const now = Date.now();
    const requestData = this.requests.get(key) || { count: 0, resetTime: now + this.windowMs };
    
    // Reset count if window has passed
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + this.windowMs;
    }
    
    requestData.count++;
    this.requests.set(key, requestData);
    
    return requestData.count > this.maxRequests;
  }
  
  public getRemainingRequests(key: string): number {
    const requestData = this.requests.get(key);
    if (!requestData) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - requestData.count);
  }
  
  public getResetTime(key: string): number {
    const requestData = this.requests.get(key);
    if (!requestData) return Date.now() + this.windowMs;
    
    return requestData.resetTime;
  }
}