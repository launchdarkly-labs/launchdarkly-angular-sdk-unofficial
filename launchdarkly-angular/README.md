# LaunchDarkly Angular

A comprehensive Angular library for integrating LaunchDarkly feature flags with reactive directives and services.

## Features

- 🚀 **Reactive Directives**: Built-in directives for conditional rendering, styling, and event tracking
- 📊 **Real-time Updates**: Automatic flag updates without page refresh
- 🎯 **User Context Management**: Easy user identification and context switching
- 📈 **Event Tracking**: Built-in analytics and conversion tracking
- 🔧 **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- 🧪 **Testing Ready**: Comprehensive test suite and testing utilities

## Installation

```bash
npm install launchdarkly-angular
```

## Quick Start

### 1. Import the Module

```typescript
import { LaunchDarklyAngularModule } from 'launchdarkly-angular';

@NgModule({
  imports: [
    LaunchDarklyAngularModule.forRoot({
      clientId: 'your-client-id',
      context: { key: 'user123', name: 'John Doe' },
      options: { streaming: true }
    })
  ]
})
export class AppModule {}
```

### 2. Use Directives in Templates

```html
<!-- Conditional rendering -->
<div *ldIf="'new-feature'; fallback: false">New feature content</div>

<!-- Conditional CSS classes -->
<div [ldClassIf]="'premium-features'" [ldClassIfClass]="'premium-user'">
  User content
</div>

<!-- Event tracking -->
<button [ldTrack]="'button-clicked'">Click me</button>
```

### 3. Use Service in Components

```typescript
import { LaunchDarklyService } from 'launchdarkly-angular';

@Component({...})
export class MyComponent {
  constructor(private ld: LaunchDarklyService) {}

  ngOnInit() {
    this.ld.variation$('new-feature', false).subscribe(enabled => {
      if (enabled) {
        this.showNewFeature();
      }
    });
  }
}
```

## Directives

### LdIfDirective

Conditionally renders content based on feature flags.

```html
<!-- Simple boolean flag -->
<div *ldIf="'new-feature'; fallback: false">New feature content</div>

<!-- String flag with specific value -->
<div *ldIf="'user-tier'; fallback: 'basic'; value: 'premium'">Premium content</div>

<!-- Number flag -->
<div *ldIf="'max-items'; fallback: 5; value: 10">Show 10 items</div>
```

### LdFlagDirective

Universal directive for any flag type with template injection.

```html
<!-- Boolean flag with conditional rendering -->
<ng-template [ldFlag]="'new-feature'" [ldFlagFallback]="false" let-enabled>
  <div *ngIf="enabled">New feature content</div>
</ng-template>

<!-- String flag with text injection -->
<ng-template [ldFlag]="'welcome-message'" [ldFlagFallback]="'Welcome!'" let-message>
  <h1>{{ message }}</h1>
</ng-template>
```

### LdSwitchDirective

Switch-like conditional rendering for multiple cases.

```html
<ng-container [ldSwitch]="'user-tier'" [ldSwitchFallback]="'basic'">
  <ng-template [ldSwitchCase]="'basic'">
    <div>Basic user features</div>
  </ng-template>
  <ng-template [ldSwitchCase]="'premium'">
    <div>Premium user features</div>
  </ng-template>
  <ng-template ldSwitchDefault>
    <div>Unknown user tier</div>
  </ng-template>
</ng-container>
```

### LdClassIfDirective

Conditionally applies CSS classes.

```html
<!-- Apply class when flag is truthy -->
<div [ldClassIf]="'premium-features'" [ldClass]="'premium-user'">
  User content
</div>

<!-- Apply different classes based on condition -->
<div [ldClassIf]="'user-tier'" 
     [ldClassIfValue]="'premium'" 
     [ldClass]="'premium-user'" 
     [ldElseClass]="'basic-user'">
  User content
</div>
```

### LdStyleIfDirective

Conditionally applies inline CSS styles.

```html
<!-- Apply styles when flag is truthy -->
<div [ldStyleIf]="'premium-features'" [ldStyle]="{backgroundColor: '#007bff', color: 'white'}">
  Premium content
</div>

<!-- Apply different styles based on condition -->
<div [ldStyleIf]="'user-tier'" 
     [ldStyleIfValue]="'premium'" 
     [ldStyle]="{background: 'linear-gradient(45deg, #ffd700, #ffed4e)', color: '#8b4513'}"
     [ldElseStyle]="{backgroundColor: '#e9ecef', color: '#495057'}">
  User content
</div>
```

### LdTrackDirective

Automatically tracks events for analytics.

```html
<!-- Simple click tracking -->
<button [ldTrack]="'button-clicked'">Click me</button>

<!-- Track with custom data -->
<button [ldTrack]="'purchase'" [ldTrackData]="{product: 'premium', price: 29.99}">
  Buy Premium
</button>

<!-- Track conversion with metric value -->
<button [ldTrack]="'conversion'" [ldTrackValue]="29.99" [ldTrackData]="{product: 'premium'}">
  Buy Premium
</button>

<!-- Track on different events -->
<div [ldTrack]="'hover-detected'" [ldTrackEvent]="'mouseenter'" [ldTrackData]="{section: 'hero'}">
  Hover me
</div>
```

## Service API

### LaunchDarklyService

The main service for feature flag management.

#### Methods

##### `variation$(key: string, fallback: T): Observable<T>`

Gets the value of a feature flag as an observable stream.

```typescript
this.ldService.variation$('new-feature', false).subscribe(enabled => {
  if (enabled) {
    this.showNewFeature();
  }
});
```

##### `variationDetail$(key: string, fallback: T): Observable<LDEvaluationDetail>`

Gets detailed evaluation information for a feature flag.

```typescript
this.ldService.variationDetail$('pricing-tier', 'basic').subscribe(detail => {
  console.log(`Flag value: ${detail.value}`);
  console.log(`Reason: ${detail.reason.kind}`);
});
```

##### `identify$(context: LDContext, timeoutMs?: number): Observable<void>`

Changes the user context for the LaunchDarkly client.

```typescript
const newContext = { key: 'user123', email: 'user@example.com' };
this.ldService.identify$(newContext, 5000).subscribe({
  next: () => console.log('Context updated'),
  error: (err) => console.error('Failed to update context', err)
});
```

##### `track(key: string, data?: any, metricValue?: number): void`

Tracks a custom event for analytics and experimentation.

```typescript
// Track a simple event
this.ldService.track('button-clicked');

// Track an event with data
this.ldService.track('purchase-completed', { productId: 'abc123', amount: 99.99 });

// Track an event with metric value
this.ldService.track('page-view', { page: '/dashboard' }, 1);
```

##### `flush(): Promise<void>`

Forces the LaunchDarkly client to flush any pending analytics events.

```typescript
await this.ldService.flush();
```

##### `waitUntilReady$(timeoutMs: number): Observable<boolean>`

Waits for LaunchDarkly to be ready with a timeout.

```typescript
this.ldService.waitUntilReady$(2000).subscribe(isReady => {
  if (isReady) {
    console.log('LaunchDarkly is ready');
  } else {
    console.log('Still waiting for LaunchDarkly...');
  }
});
```

## Configuration

### Module Configuration

```typescript
LaunchDarklyAngularModule.forRoot({
  clientId: 'your-client-id',
  context: { key: 'user123', name: 'John Doe' },
  options: {
    streaming: true,
    debug: false
  },
  timeout: 500
})
```

### Configuration Options

- `clientId`: Your LaunchDarkly client-side ID
- `context`: User context for flag evaluation
- `options`: LaunchDarkly client options
- `timeout`: Timeout for initialization in milliseconds

## APP_INITIALIZER Setup

For applications that need to wait for LaunchDarkly to be ready before starting:

```typescript
import { APP_INITIALIZER } from '@angular/core';
import { LaunchDarklyService } from 'launchdarkly-angular';

@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: LaunchDarklyService.createAppInitializer(1000),
      deps: [LaunchDarklyService],
      multi: true
    }
  ]
})
export class AppModule {}
```

## Testing

### Unit Testing

```typescript
import { LaunchDarklyService } from 'launchdarkly-angular';

describe('MyComponent', () => {
  let mockLdService: jasmine.SpyObj<LaunchDarklyService>;

  beforeEach(() => {
    mockLdService = jasmine.createSpyObj('LaunchDarklyService', ['variation$']);
    mockLdService.variation$.and.returnValue(of(true));
  });

  it('should show feature when flag is enabled', () => {
    // Test implementation
  });
});
```

### Integration Testing

```typescript
import { LaunchDarklyAngularModule } from 'launchdarkly-angular';

TestBed.configureTestingModule({
  imports: [
    LaunchDarklyAngularModule.forRoot({
      clientId: 'test-client-id',
      context: { key: 'test-user' }
    })
  ]
});
```

## Best Practices

### 1. Use Directives for UI Changes

Prefer directives for conditional rendering and styling:

```html
<!-- Good: Use directive -->
<div *ldIf="'new-feature'; fallback: false">New feature</div>

<!-- Avoid: Manual subscription in component -->
<div *ngIf="showFeature">New feature</div>
```

### 2. Use Service for Complex Logic

Use the service for complex business logic:

```typescript
// Good: Complex logic in component
this.ldService.variation$('pricing-tier', 'basic').subscribe(tier => {
  this.calculatePricing(tier);
  this.updateUI(tier);
});
```

### 3. Provide Fallback Values

Always provide meaningful fallback values:

```typescript
// Good: Meaningful fallback
this.ldService.variation$('welcome-message', 'Welcome!')

// Avoid: Generic fallback
this.ldService.variation$('welcome-message', null)
```

### 4. Handle Loading States

Use the `waitUntilReady$` method for critical features:

```typescript
this.ldService.waitUntilReady$(1000).subscribe(isReady => {
  if (isReady) {
    this.loadCriticalFeatures();
  } else {
    this.showLoadingState();
  }
});
```

## Migration Guide

### From Demo App

If you're migrating from the demo application:

1. **Remove old imports**:
   ```typescript
   // Remove
   import { LaunchDarklyService } from './launchdarkly.service';
   
   // Add
   import { LaunchDarklyService } from 'launchdarkly-angular';
   ```

2. **Update module imports**:
   ```typescript
   // Remove old declarations
   declarations: [LdIfDirective, LdFlagDirective, ...]
   
   // Add module import
   imports: [LaunchDarklyAngularModule.forRoot(config)]
   ```

3. **Update directive usage**:
   ```html
   <!-- Old -->
   <div *ldIf="'flag'; fallback: false">Content</div>
   
   <!-- New (same syntax) -->
   <div *ldIf="'flag'; fallback: false">Content</div>
   ```

## Troubleshooting

### Common Issues

#### 1. Flags Not Updating

- Check that `streaming: true` is set in options
- Verify client ID is correct
- Check browser console for errors

#### 2. Directives Not Working

- Ensure module is imported correctly
- Check that fallback values are provided
- Verify flag keys match LaunchDarkly dashboard

#### 3. User Context Not Updating

- Use `identify$` method with timeout
- Check that context object is valid
- Verify targeting rules in LaunchDarkly

### Debug Mode

Enable debug mode for troubleshooting:

```typescript
LaunchDarklyAngularModule.forRoot({
  clientId: 'your-client-id',
  context: { key: 'user123' },
  options: {
    streaming: true,
    debug: true
  }
})
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- [Documentation](https://github.com/launchdarkly/launchdarkly-angular)
- [Issues](https://github.com/launchdarkly/launchdarkly-angular/issues)
- [LaunchDarkly Support](https://support.launchdarkly.com/)