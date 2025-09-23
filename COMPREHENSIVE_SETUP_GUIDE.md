# LaunchDarkly Angular Demo - Comprehensive Setup Guide

This guide provides complete instructions for setting up and testing the LaunchDarkly Angular demo application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Installation](#local-installation)
3. [LaunchDarkly Setup](#launchdarkly-setup)
4. [Feature Flags Configuration](#feature-flags-configuration)
5. [Testing the Application](#testing-the-application)
6. [Understanding the Code](#understanding-the-code)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Angular CLI**: Version 16.x or higher
- **Git**: For cloning the repository

### Required Accounts
- **LaunchDarkly Account**: Free trial available at [launchdarkly.com](https://launchdarkly.com)

## Local Installation

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd ld-demo-angular
```

### 2. Install Angular CLI (if not already installed)
```bash
npm install -g @angular/cli@16
```

### 3. Install Project Dependencies
```bash
npm install
```

### 4. Verify Installation
```bash
ng version
```
You should see Angular CLI version 16.x.x

## LaunchDarkly Setup

### 1. Create LaunchDarkly Account
1. Go to [launchdarkly.com](https://launchdarkly.com)
2. Sign up for a free account
3. Complete the onboarding process

### 2. Get Your Client-Side ID
1. In LaunchDarkly dashboard, go to **Account Settings** → **Projects**
2. Select your project (or create one)
3. Go to **Environments** tab
4. Copy the **Client-side ID** for your environment (usually "Test" or "Development")

### 3. Update Environment Configuration
Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  launchDarklyClientId: 'YOUR_ACTUAL_CLIENT_SIDE_ID_HERE', // Replace this
  bootstrapFlags: { 
    'new-nav': false, 
    'welcome-text': 'Welcome!' 
  }
};
```

**Important**: Replace `YOUR_ACTUAL_CLIENT_SIDE_ID_HERE` with your actual LaunchDarkly client-side ID.

## Feature Flags Configuration

### Flag 1: `new-nav` (Boolean Flag)

#### In LaunchDarkly Dashboard:
1. **Navigate to**: Feature Flags → Create Flag
2. **Flag Key**: `new-nav`
3. **Flag Name**: "New Navigation"
4. **Type**: Boolean
5. **Description**: "Controls whether to show the new navigation bar or legacy navigation"
6. **Default Value**: `false`

#### Variations:
- **Variation 1**:
  - **Name**: `Legacy`
  - **Value**: `false`
- **Variation 2**:
  - **Name**: `New`
  - **Value**: `true`

#### Targeting Rules Examples:
- **All Users**: `false` (legacy navigation)
- **50% Rollout**: 50% get `true`, 50% get `false`
- **Country-based**: US users get `true`, others get `false`

### Flag 2: `welcome-text` (String Flag)

#### In LaunchDarkly Dashboard:
1. **Navigate to**: Feature Flags → Create Flag
2. **Flag Key**: `welcome-text`
3. **Flag Name**: "Welcome Text"
4. **Type**: String
5. **Description**: "Controls the welcome message text displayed to users"
6. **Default Value**: `Welcome!`

#### Variations:
- **Variation 1**:
  - **Name**: `Default`
  - **Value**: `Welcome!`
- **Variation 2**:
  - **Name**: `Friendly`
  - **Value**: `Hello there!`
- **Variation 3**:
  - **Name**: `Enthusiastic`
  - **Value**: `Welcome to our amazing app!`
- **Variation 4**:
  - **Name**: `Casual`
  - **Value**: `Hey there!`
- **Variation 5**:
  - **Name**: `Formal`
  - **Value**: `Good day and welcome!`

#### Targeting Rules Examples:
- **Individual Users**:
  - `demo-user-1` → `Hello there!`
  - `demo-user-2` → `Welcome back!`
- **Country-based**:
  - US users → `Welcome!`
  - CA users → `Welcome, eh!`
- **A/B Testing**:
  - 50% get `Welcome!`
  - 50% get `Hello there!`

## Testing the Application

### 1. Start the Development Server
```bash
npm start
```

### 2. Open the Application
Navigate to `http://localhost:4200` in your browser.

### 3. Test Basic Flag Functionality

#### Test `new-nav` Flag:
1. In LaunchDarkly dashboard, toggle the `new-nav` flag ON/OFF
2. Watch the navigation bar change in real-time:
   - **OFF**: Shows "[ Legacy Navigation ]"
   - **ON**: Shows "[ New Navigation ]"

#### Test `welcome-text` Flag:
1. In LaunchDarkly dashboard, change the `welcome-text` flag value
2. Watch the welcome message update in real-time

### 4. Test User Targeting

#### Individual User Targeting:
1. In LaunchDarkly, set up targeting rules for specific users:
   - `demo-user-1` → Different variation
   - `demo-user-2` → Different variation
2. In the app, click the user identification buttons:
   - "Identify as demo-user-1 (US)"
   - "Identify as demo-user-2 (CA)"
3. Observe how the flag values change based on user context

#### Country-based Targeting:
1. Set up targeting rules based on country:
   - `country = "US"` → One variation
   - `country = "CA"` → Another variation
2. Click the user buttons to see different behaviors

### 5. Test Real-time Updates
1. Keep the app open in one browser tab
2. Open LaunchDarkly dashboard in another tab
3. Make flag changes in LaunchDarkly
4. Watch the app update automatically (within 2-3 seconds)

## Understanding the Code

### Key Files:

#### `src/app/feature-flags.service.ts`
- **Purpose**: Manages LaunchDarkly client and flag state
- **Key Features**:
  - Initializes LaunchDarkly client
  - Handles real-time flag updates
  - Provides reactive observables for flag values
  - Manages user context switching

#### `src/app/app.component.ts`
- **Purpose**: Main component that uses feature flags
- **Key Features**:
  - Subscribes to flag observables
  - Provides user identification methods
  - Demonstrates flag usage patterns

#### `src/app/app.component.html`
- **Purpose**: UI template that responds to flag values
- **Key Features**:
  - Conditional rendering based on flags
  - Real-time updates via Angular async pipe
  - User identification buttons

#### `src/environments/environment.ts`
- **Purpose**: Configuration file for LaunchDarkly
- **Key Features**:
  - Client-side ID configuration
  - Bootstrap flags for offline fallback

### How Real-time Updates Work:

1. **Connection**: App establishes WebSocket connection to LaunchDarkly
2. **Event Listening**: Service listens for flag change events
3. **State Management**: Changes update internal BehaviorSubject
4. **Reactive Updates**: Angular observables automatically emit new values
5. **UI Updates**: Angular's change detection updates the DOM

## Troubleshooting

### Common Issues:

#### 1. "YOUR_CLIENT_SIDE_ID" Still Showing
- **Problem**: App shows default values, not LaunchDarkly values
- **Solution**: Ensure you've replaced the client ID in `environment.ts`

#### 2. No Real-time Updates
- **Problem**: Flag changes in LaunchDarkly don't update the app
- **Solution**: 
  - Check browser console for errors
  - Verify client ID is correct
  - Ensure flags are enabled in LaunchDarkly

#### 3. User Targeting Not Working
- **Problem**: User identification doesn't change flag values
- **Solution**:
  - Verify targeting rules are set up correctly
  - Check user keys match exactly (`demo-user-1`, `demo-user-2`)
  - Ensure targeting rules are enabled

#### 4. App Won't Start
- **Problem**: `npm start` fails
- **Solution**:
  - Run `npm install` to ensure all dependencies are installed
  - Check Node.js version: `node --version` (should be 16+)
  - Clear npm cache: `npm cache clean --force`

#### 5. TypeScript Errors
- **Problem**: Compilation errors
- **Solution**:
  - Ensure all dependencies are installed: `npm install`
  - Check TypeScript version compatibility
  - Restart the development server

### Debug Mode:
Add this to your `environment.ts` for debugging:
```typescript
export const environment = {
  production: false,
  launchDarklyClientId: 'YOUR_CLIENT_SIDE_ID',
  bootstrapFlags: { 
    'new-nav': false, 
    'welcome-text': 'Welcome!' 
  },
  // Add this for debugging
  launchDarklyOptions: {
    streaming: true,
    debug: true
  }
};
```

## Advanced Features to Explore

### 1. Custom Attributes
Add custom attributes to user context:
```typescript
await this.flags.setContext({ 
  kind: 'user', 
  key: 'demo-user-1', 
  country: 'US',
  plan: 'premium',
  betaUser: true
});
```

### 2. Segment Targeting
Create user segments in LaunchDarkly and target them:
- Premium users
- Beta testers
- Geographic regions

### 3. Gradual Rollouts
Set up percentage-based rollouts:
- 10% of users get new feature
- Gradually increase to 50%, then 100%

### 4. A/B Testing
Use LaunchDarkly's experimentation features:
- Test different welcome messages
- Measure user engagement
- Statistical significance testing

## Next Steps

1. **Experiment with more flag types**: Number, JSON, etc.
2. **Add more complex targeting rules**: Multiple conditions, segments
3. **Implement flag analytics**: Track flag performance
4. **Add more UI components**: Buttons, forms, etc.
5. **Explore LaunchDarkly's advanced features**: Experiments, custom events

## Resources

- [LaunchDarkly Documentation](https://docs.launchdarkly.com/)
- [Angular Documentation](https://angular.io/docs)
- [LaunchDarkly JavaScript SDK](https://github.com/launchdarkly/js-client-sdk)
- [Feature Flag Best Practices](https://launchdarkly.com/blog/feature-flag-best-practices/)

---

**Happy Feature Flagging! 🚀**
