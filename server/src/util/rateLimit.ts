interface RateLimiter {
  allow(key: string): boolean;
  reset(key: string): void;
}

class InMemoryRateLimiter implements RateLimiter {
  private counters = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  allow(key: string): boolean {
    const now = Date.now();
    const counter = this.counters.get(key);

    if (!counter || now >= counter.resetTime) {
      // First request or window expired
      this.counters.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (counter.count >= this.maxRequests) {
      return false;
    }

    counter.count++;
    return true;
  }

  reset(key: string): void {
    this.counters.delete(key);
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, counter] of this.counters.entries()) {
      if (now >= counter.resetTime) {
        this.counters.delete(key);
      }
    }
  }
}

const rateLimiters = new Map<string, RateLimiter>();

export function getRateLimiter(name: string, maxRequests: number, windowMs: number): RateLimiter {
  let limiter = rateLimiters.get(name);
  
  if (!limiter) {
    limiter = new InMemoryRateLimiter(maxRequests, windowMs);
    rateLimiters.set(name, limiter);
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      (limiter as InMemoryRateLimiter).cleanup();
    }, 5 * 60 * 1000);
  }
  
  return limiter;
}