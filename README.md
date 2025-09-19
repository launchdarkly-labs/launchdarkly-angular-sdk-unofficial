# LaunchDarkly Angular Demo

This is a simple Angular app showing best practices for using LaunchDarkly feature flags.

## Setup

1. Install Angular CLI:
   ```bash
   npm install -g @angular/cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Edit `src/environments/environment.ts` and put your **LaunchDarkly client-side ID**.

4. Start the app:
   ```bash
   npm start
   ```

5. Open http://localhost:4200

## Flags to create in LaunchDarkly

- `new-nav` (Boolean)
- `welcome-text` (String)

## Demo

- Toggle `new-nav` or edit `welcome-text` in LaunchDarkly dashboard → see live updates here.
- Click the user buttons to demo targeting rules.
