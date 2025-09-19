# LaunchDarkly Best Practices

This document outlines the best practices for implementing LaunchDarkly feature flags in Angular applications, based on the patterns used in this project.

## Table of Contents
1. [Core Best Practices](#core-best-practices)
2. [Security Best Practices](#security-best-practices)
3. [Performance Best Practices](#performance-best-practices)
4. [Code Organization](#code-organization)
5. [Testing Best Practices](#testing-best-practices)
6. [Monitoring and Analytics](#monitoring-and-analytics)
7. [Common Anti-Patterns](#common-anti-patterns)

## Core Best Practices

### 1. Bootstrap Flags for Offline Resilience
```typescript
// ✅ BEST PRACTICE: Always provide bootstrap flags
export const environment = {
  production: false,
  launchDarklyClientId: 'your-client-id',
  bootstrapFlags: {
    'new-nav': false,
    'welcome-text': 'Welcome!'
  }
};
```

**Why**: Ensures your app works even when LaunchDarkly service is unavailable.

### 2. Graceful Error Handling
```typescript
// ✅ BEST PRACTICE: Handle initialization failures gracefully
try { 
  await this.client.waitForInitialization(); 
} 
catch (e) { 
  console.warn('[LD] init error; using bootstrap defaults', e); 
}
```

**Why**: Prevents app crashes when LaunchDarkly service is down.

### 3. Safe Flag Evaluation with Fallbacks
```typescript
// ✅ BEST PRACTICE: Always provide fallback values
variation<T extends LDFlagValue = LDFlagValue>(key: string, fallback: T): T {
  try { 
    return (this.client?.variation(key, fallback) ?? fallback) as T; 
  }
  catch { 
    return fallback; 
  }
}
```

**Why**: Ensures your app never breaks due to missing or invalid flag values.

### 4. Real-time Flag Updates
```typescript
// ✅ BEST PRACTICE: Listen for flag changes
this.client.on('change', (changes) => {
  const merged = { ...this.flags$.value };
  Object.keys(changes).forEach((k) => (merged[k] = changes[k].current));
  this.zone.run(() => this.flags$.next(merged));
});
```

**Why**: Enables live flag updates without page refresh.

### 5. Proper User Context Management
```typescript
// ✅ BEST PRACTICE: Use structured user context
const context: LDContext = {
  kind: 'user',
  key: 'user-123',
  name: 'John Doe',
  country: 'US',
  plan: 'premium',
  betaUser: true
};
```

**Why**: Enables targeted flag delivery based on user attributes.

## Security Best Practices

### 1. Client-Side Security
```typescript
// ✅ BEST PRACTICE: Use client-side ID only
launchDarklyClientId: 'YOUR_ACTUAL_CLIENT_SIDE_ID_HERE'

// ❌ NEVER: Use server-side SDK key in client code
// launchDarklySdkKey: 'sdk-key-here' // This would be a security risk
```

**Why**: Client-side IDs are safe for public use; SDK keys are not.

### 2. Environment-Specific Configuration
```typescript
// environment.ts (development)
export const environment = {
  production: false,
  launchDarklyClientId: 'dev-client-id',
  bootstrapFlags: { 'new-nav': false }
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  launchDarklyClientId: 'prod-client-id',
  bootstrapFlags: { 'new-nav': true }
};
```

**Why**: Different configurations for different environments.

### 3. Sensitive Data Protection
```typescript
// ✅ GOOD: Use client-side flags for UI features
'new-nav': boolean
'welcome-text': string

// ❌ AVOID: Don't use client-side flags for sensitive data
'api-key': string
'user-permissions': object
```

**Why**: Client-side flags are visible to users; use server-side flags for sensitive data.

## Performance Best Practices

### 1. Flag Caching
```typescript
// ✅ BEST PRACTICE: Cache flag values to reduce API calls
private flagCache = new Map<string, { value: any; timestamp: number }>();
private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

getFlagWithCache<T>(key: string, fallback: T): T {
  const cached = this.flagCache.get(key);
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    return cached.value;
  }
  
  const value = this.client?.variation(key, fallback) ?? fallback;
  this.flagCache.set(key, { value, timestamp: Date.now() });
  return value;
}
```

### 2. Lazy Loading
```typescript
// ✅ BEST PRACTICE: Initialize LaunchDarkly only when needed
async initialize(initialContext?: LDContext): Promise<void> {
  if (this.client) return; // Already initialized
  
  // Initialize only when first flag is requested
  this.client = initialize(environment.launchDarklyClientId, context, {
    bootstrap: environment.bootstrapFlags
  });
}
```

### 3. Performance Monitoring
```typescript
// ✅ BEST PRACTICE: Monitor flag evaluation performance
private measureFlagEvaluation<T>(fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (duration > 10) { // Log slow evaluations
    console.warn(`Slow flag evaluation: ${duration}ms`);
  }
  
  return result;
}
```

## Code Organization

### 1. Service Pattern
```typescript
// ✅ BEST PRACTICE: Use a dedicated service for feature flags
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private client?: LDClient;
  private flags$ = new BehaviorSubject<Record<string, LDFlagValue>>({});

  // Centralized flag management
}
```

### 2. Type Safety
```typescript
// ✅ BEST PRACTICE: Use LaunchDarkly TypeScript types
import {
  type LDClient,
  type LDContext,
  type LDFlagValue
} from 'launchdarkly-js-client-sdk';

// Define flag types
interface FlagTypes {
  'new-nav': boolean;
  'welcome-text': string;
  'max-items': number;
}
```

### 3. Flag Configuration
```typescript
// ✅ BEST PRACTICE: Centralize flag configuration
interface FlagConfig {
  key: string;
  fallback: any;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  category: 'ui' | 'feature' | 'experiment';
}

const FLAG_CONFIGS: FlagConfig[] = [
  {
    key: 'new-nav',
    fallback: false,
    description: 'Controls new navigation display',
    type: 'boolean',
    category: 'ui'
  }
];
```

### 4. Flag Naming Convention
```typescript
// ✅ BEST PRACTICE: Use consistent naming
'new-nav'           // UI components
'welcome-text'      // Content
'checkout-flow'     // Features
'beta-feature'      // Experiments

// ❌ AVOID: Inconsistent naming
'newNav'            // camelCase
'flag1'             // Unclear
'feature'           // Too generic
```

## Testing Best Practices

### 1. Mock LaunchDarkly for Tests
```typescript
// ✅ BEST PRACTICE: Mock LaunchDarkly in tests
export class MockFeatureFlagsService {
  private flags = new BehaviorSubject<Record<string, any>>({});
  
  getFlag$(key: string, fallback: any): Observable<any> {
    return this.flags.pipe(
      map(flags => flags[key] ?? fallback)
    );
  }
  
  setFlag(key: string, value: any): void {
    const current = this.flags.value;
    this.flags.next({ ...current, [key]: value });
  }
}
```

### 2. Test Flag Scenarios
```typescript
// ✅ BEST PRACTICE: Test different flag scenarios
describe('FeatureFlagsService', () => {
  it('should return fallback when flag is not set', () => {
    const service = new MockFeatureFlagsService();
    const result = service.getFlag$('new-nav', false);
    expect(result).toBe(false);
  });
  
  it('should return flag value when set', () => {
    const service = new MockFeatureFlagsService();
    service.setFlag('new-nav', true);
    const result = service.getFlag$('new-nav', false);
    expect(result).toBe(true);
  });
});
```

### 3. Integration Tests
```typescript
// ✅ BEST PRACTICE: Test with real LaunchDarkly in integration tests
describe('LaunchDarkly Integration', () => {
  it('should initialize and fetch flags', async () => {
    const service = TestBed.inject(FeatureFlagsService);
    await service.initialize();
    
    const flag = service.getFlag$('new-nav', false);
    expect(flag).toBeDefined();
  });
});
```

## Monitoring and Analytics

### 1. Flag Usage Tracking
```typescript
// ✅ BEST PRACTICE: Track flag usage for analytics
private trackFlagUsage(flagKey: string, value: any, context: LDContext) {
  this.client?.track('flag-used', {
    flagKey,
    flagValue: value,
    userId: context.key,
    timestamp: new Date().toISOString()
  });
}
```

### 2. Error Monitoring
```typescript
// ✅ BEST PRACTICE: Monitor LaunchDarkly errors
this.client?.on('failed', (error) => {
  console.error('LaunchDarkly client failed:', error);
  // Send to error tracking service
  this.errorTrackingService.captureException(error);
});
```

### 3. Performance Metrics
```typescript
// ✅ BEST PRACTICE: Track performance metrics
private metrics = {
  flagEvaluationTime: 0,
  networkLatency: 0,
  errorRate: 0
};

private updateMetrics(metric: string, value: number) {
  this.metrics[metric] = value;
  // Send to analytics service
  this.analyticsService.track('ld-metric', { metric, value });
}
```

## Common Anti-Patterns

### 1. ❌ Don't Use Server-Side SDK Key in Client
```typescript
// ❌ WRONG: Never use server-side SDK key
launchDarklySdkKey: 'sdk-key-here'

// ✅ CORRECT: Use client-side ID
launchDarklyClientId: 'client-id-here'
```

### 2. ❌ Don't Forget Fallback Values
```typescript
// ❌ WRONG: No fallback value
const flag = this.client?.variation('new-nav');

// ✅ CORRECT: Always provide fallback
const flag = this.client?.variation('new-nav', false);
```

### 3. ❌ Don't Ignore Errors
```typescript
// ❌ WRONG: Ignoring errors
this.client?.variation('new-nav', false);

// ✅ CORRECT: Handle errors gracefully
try {
  return this.client?.variation('new-nav', false) ?? false;
} catch (error) {
  console.warn('Flag evaluation failed:', error);
  return false;
}
```

### 4. ❌ Don't Use Flags for Sensitive Data
```typescript
// ❌ WRONG: Sensitive data in client-side flags
'api-key': 'secret-key'
'user-permissions': { admin: true }

// ✅ CORRECT: Use flags for UI features only
'new-nav': true
'welcome-text': 'Welcome!'
```

### 5. ❌ Don't Hardcode Flag Values
```typescript
// ❌ WRONG: Hardcoded values
if (this.client?.variation('new-nav', false)) {
  // Show new nav
}

// ✅ CORRECT: Use reactive approach
showNewNav$ = this.flags.getFlag$('new-nav', false);
```

## Best Practices Checklist

- [ ] ✅ Bootstrap flags configured
- [ ] ✅ Error handling implemented
- [ ] ✅ Fallback values provided
- [ ] ✅ Real-time updates enabled
- [ ] ✅ User context properly set
- [ ] ✅ Client-side ID used (not SDK key)
- [ ] ✅ Type safety implemented
- [ ] ✅ Consistent naming convention
- [ ] ✅ Service pattern used
- [ ] ✅ Tests written
- [ ] ✅ Performance monitored
- [ ] ✅ Analytics tracked

## Resources

- [LaunchDarkly Documentation](https://docs.launchdarkly.com/)
- [LaunchDarkly JavaScript SDK](https://github.com/launchdarkly/js-client-sdk)
- [Feature Flag Best Practices](https://launchdarkly.com/blog/feature-flag-best-practices/)
- [Angular Best Practices](https://angular.io/guide/styleguide)

---

**Remember**: Feature flags are a powerful tool, but they require careful implementation to be effective. Follow these best practices to ensure your feature flag implementation is robust, secure, and maintainable.
