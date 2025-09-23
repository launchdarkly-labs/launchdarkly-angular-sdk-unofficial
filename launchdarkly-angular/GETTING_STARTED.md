# Getting Started with LaunchDarkly Angular

This guide will help you get up and running with LaunchDarkly Angular in your Angular application.

## Prerequisites

- Angular 16+ application
- LaunchDarkly account and client-side ID
- Node.js and npm installed

## Installation

### 1. Install the Package

```bash
npm install launchdarkly-angular
```

### 2. Install Peer Dependencies

The package requires these peer dependencies:

```bash
npm install launchdarkly-js-client-sdk fast-deep-equal
```

## Basic Setup

### 1. Import the Module

In your `app.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LaunchDarklyAngularModule } from 'launchdarkly-angular';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    LaunchDarklyAngularModule.forRoot({
      clientId: 'your-client-side-id',
      context: { key: 'user123', name: 'John Doe' },
      options: { streaming: true }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### 2. Create Your First Feature Flag

In your LaunchDarkly dashboard:

1. Go to **Feature Flags** → **Create Flag**
2. Set **Flag Key**: `new-feature`
3. Set **Flag Name**: "New Feature"
4. Set **Type**: Boolean
5. Set **Default Value**: `false`
6. **Save** the flag

### 3. Use the Flag in Your Template

In your component template:

```html
<!-- Simple conditional rendering -->
<div *ldIf="'new-feature'; fallback: false">
  <h2>🎉 New Feature is Enabled!</h2>
  <p>This content is only shown when the flag is true.</p>
</div>

<!-- Conditional CSS classes -->
<div [ldClassIf]="'new-feature'" [ldClassIfClass]="'feature-enabled'">
  <p>This div gets the 'feature-enabled' class when the flag is true.</p>
</div>

<!-- Event tracking -->
<button [ldTrack]="'new-feature-clicked'">Try New Feature</button>
```

### 4. Use the Service in Your Component

In your component TypeScript file:

```typescript
import { Component, OnInit } from '@angular/core';
import { LaunchDarklyService } from 'launchdarkly-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(private ldService: LaunchDarklyService) {}

  ngOnInit() {
    // Subscribe to flag changes
    this.ldService.variation$('new-feature', false).subscribe(enabled => {
      if (enabled) {
        console.log('New feature is enabled!');
        this.loadNewFeature();
      } else {
        console.log('New feature is disabled');
      }
    });
  }

  private loadNewFeature() {
    // Load new feature code here
    console.log('Loading new feature...');
  }
}
```

## Testing Your Setup

### 1. Start Your Application

```bash
ng serve
```

### 2. Test Flag Changes

1. Open your application in the browser
2. Open LaunchDarkly dashboard in another tab
3. Toggle the `new-feature` flag ON/OFF
4. Watch your application update in real-time!

### 3. Test User Targeting

1. In LaunchDarkly, set up targeting rules:
   - **Individual Users**: `user123` → `true`
   - **All Users**: `false`
2. In your component, change the user context:

```typescript
identifyUser() {
  this.ldService.identify$({ key: 'user123', name: 'John Doe' }).subscribe({
    next: () => console.log('User identified'),
    error: (err) => console.error('Failed to identify user', err)
  });
}
```

## Common Patterns

### 1. Multiple Flag Types

```html
<!-- Boolean flag -->
<div *ldIf="'show-banner'; fallback: false">Banner content</div>

<!-- String flag -->
<ng-template [ldFlag]="'welcome-message'" [ldFlagFallback]="'Welcome!'" let-message>
  <h1>{{ message }}</h1>
</ng-template>

<!-- Number flag -->
<ng-template [ldFlag]="'max-items'" [ldFlagFallback]="5" let-maxItems>
  <div>Showing {{ maxItems }} items</div>
</ng-template>
```

### 2. Complex Conditional Logic

```html
<!-- Switch-like behavior -->
<ng-container [ldSwitch]="'user-tier'" [ldSwitchFallback]="'basic'">
  <ng-template [ldSwitchCase]="'basic'">
    <div>Basic user features</div>
  </ng-template>
  <ng-template [ldSwitchCase]="'premium'">
    <div>Premium user features</div>
  </ng-template>
  <ng-template [ldSwitchCase]="'enterprise'">
    <div>Enterprise user features</div>
  </ng-template>
  <ng-template ldSwitchDefault>
    <div>Unknown user tier</div>
  </ng-template>
</ng-container>
```

### 3. Event Tracking

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

### 4. Dynamic Styling

```html
<!-- Conditional CSS classes -->
<div [ldClassIf]="'premium-features'" [ldClassIfClass]="'premium-user'">
  User content
</div>

<!-- Conditional inline styles -->
<div [ldStyle]="'theme'" [ldStyleStyle]="'background: #007bff; color: white'">
  Themed content
</div>

<!-- Different styles based on condition -->
<div [ldStyle]="'user-tier'" 
     [ldStyleValue]="'premium'" 
     [ldStyleStyle]="'background: gold; color: black'" 
     [ldStyleElseStyle]="'background: silver; color: white'">
  User content
</div>
```

## Advanced Configuration

### 1. APP_INITIALIZER Setup

For applications that need to wait for LaunchDarkly to be ready:

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

### 2. Environment-based Configuration

Create environment-specific configurations:

```typescript
// environment.ts
export const environment = {
  production: false,
  launchDarklyClientId: 'your-dev-client-id'
};

// environment.prod.ts
export const environment = {
  production: true,
  launchDarklyClientId: 'your-prod-client-id'
};

// app.module.ts
import { environment } from '../environments/environment';

LaunchDarklyAngularModule.forRoot({
  clientId: environment.launchDarklyClientId,
  context: { key: 'user123', name: 'John Doe' },
  options: { streaming: true }
})
```

### 3. Dynamic User Context

Update user context based on authentication:

```typescript
import { AuthService } from './auth.service';

constructor(
  private ldService: LaunchDarklyService,
  private authService: AuthService
) {}

ngOnInit() {
  this.authService.user$.subscribe(user => {
    if (user) {
      this.ldService.identify$({
        key: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }).subscribe({
        next: () => console.log('User context updated'),
        error: (err) => console.error('Failed to update context', err)
      });
    }
  });
}
```

## Testing

### 1. Unit Testing

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

### 2. Integration Testing

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

## Troubleshooting

### Common Issues

#### 1. "YOUR_CLIENT_SIDE_ID" Still Showing

- **Problem**: App shows default values, not LaunchDarkly values
- **Solution**: Ensure you've replaced the client ID in your configuration

#### 2. No Real-time Updates

- **Problem**: Flag changes in LaunchDarkly don't update the app
- **Solution**: 
  - Check browser console for errors
  - Verify client ID is correct
  - Ensure flags are enabled in LaunchDarkly
  - Check that `streaming: true` is set

#### 3. User Targeting Not Working

- **Problem**: User identification doesn't change flag values
- **Solution**:
  - Verify targeting rules are set up correctly
  - Check user keys match exactly
  - Ensure targeting rules are enabled

#### 4. Directives Not Working

- **Problem**: Directives don't render or update
- **Solution**:
  - Ensure module is imported correctly
  - Check that fallback values are provided
  - Verify flag keys match LaunchDarkly dashboard

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

## Next Steps

1. **Explore More Directives**: Try out `LdFlagDirective`, `LdSwitchDirective`, etc.
2. **Add Event Tracking**: Use `LdTrackDirective` for analytics
3. **Set Up User Targeting**: Create targeting rules in LaunchDarkly
4. **Add A/B Testing**: Use LaunchDarkly's experimentation features
5. **Read the Full Documentation**: Check out the complete API reference

## Resources

- [Complete API Reference](./API_REFERENCE.md)
- [Examples and Patterns](./EXAMPLES.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [LaunchDarkly Documentation](https://docs.launchdarkly.com/)
- [Angular Documentation](https://angular.io/docs)

---

**Happy Feature Flagging! 🚀**
