# LaunchDarkly Angular Demo

This is a demo application showcasing the LaunchDarkly Angular library with all its features and best practices.

## Setup

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```

2. Edit `src/environments/environment.ts` and put your **LaunchDarkly client-side ID**.

3. Start the demo:
   ```bash
   npm run demo:start
   ```

4. Open http://localhost:4200

## Features Demonstrated

- **Conditional Rendering**: Using `*ldIf` directive for showing/hiding content
- **CSS Classes**: Using `[ldClassIf]` directive for conditional styling
- **Inline Styles**: Using `[ldStyleIf]` directive for dynamic styling
- **Event Tracking**: Using `[ldTrack]` directive for analytics
- **Service Usage**: Using `LaunchDarklyService` in components
- **User Context Switching**: Dynamic user identification
- **Real-time Updates**: Live flag updates without page refresh

## Flags to Create in LaunchDarkly

- `new-nav` (Boolean) - Controls navigation display
- `welcome-text` (String) - Dynamic welcome message
- `premium-features` (Boolean) - Shows premium content
- `user-tier` (String) - User tier classification
- `button-color` (String) - Dynamic button styling

## Demo Features

- Toggle flags in LaunchDarkly dashboard → see live updates
- Click user buttons to demo targeting rules
- View console for event tracking data
- Test different user contexts and targeting

## Development

This demo uses the local `launchdarkly-angular` library from the parent directory, making it perfect for development and testing.
