# GitHub Actions Setup Guide

This guide explains how to set up the GitHub Actions workflows for automated testing, linting, and publishing with approval requirements.

## Workflows Created

### 1. CI Workflow (`.github/workflows/ci.yml`)
- **Triggers**: On every push to `main`/`develop` branches and pull requests
- **Jobs**:
  - `test-and-lint`: Runs tests and linting across Node.js versions 18, 20, and 22
  - `demo-test`: Ensures the demo app builds successfully
  - `security-check`: Runs security audit and checks for outdated dependencies

### 2. Updated Publish Workflow (`.github/workflows/publish.yml`)
- **Triggers**: On version tags (e.g., `v1.2.3`)
- **Jobs**:
  - `validate`: Runs tests, linting, and builds the library
  - `publish`: Requires approval and publishes to npm

## Required Setup

### 1. GitHub Environment Configuration

To enable approval requirements for npm publishing, you need to create a GitHub environment:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Name it: `npm-publish`
5. Configure the environment:
   - **Required reviewers**: Add team members who should approve releases
   - **Wait timer**: Optional delay before deployment (recommended: 0 minutes)
   - **Deployment branches**: Restrict to specific branches if needed

### 2. NPM Token Setup

1. Create an NPM token:
   - Go to [npmjs.com](https://www.npmjs.com) and log in
   - Navigate to **Access Tokens** in your account settings
   - Create a new token with **Automation** type
   - Copy the token

2. Add the token to GitHub Secrets:
   - Go to your repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token

### 3. Repository Secrets Required

Make sure these secrets are configured in your repository:

- `NPM_TOKEN`: NPM automation token for publishing
- `GITHUB_TOKEN`: Automatically provided by GitHub

## How It Works

### CI Process
1. **On every commit/PR**: The CI workflow runs automatically
2. **Tests**: Runs unit tests with Karma/Jasmine
3. **Linting**: Runs ESLint with Angular-specific rules
4. **Build**: Ensures the library builds successfully
5. **Demo**: Verifies the demo application builds
6. **Security**: Checks for vulnerabilities and outdated dependencies

### Publishing Process
1. **Tag Creation**: When you push a version tag (e.g., `v1.2.3`)
2. **Validation**: The `validate` job runs tests, linting, and builds
3. **Approval Required**: The `publish` job waits for manual approval
4. **Publishing**: Once approved, publishes to npm and creates a GitHub release

## Usage

### Running Tests Locally
```bash
# Run tests
npm test

# Run linting
npm run lint

# Run both tests and linting
npm run release:prepare
```

### Publishing a Release
```bash
# Update version and create tag
npm run version:patch  # or version:minor, version:major

# Push the tag (this triggers the publish workflow)
git push origin main --tags
```

### Manual Release Process
1. Update `package.json` version
2. Commit changes
3. Create and push a version tag: `git tag v1.2.3 && git push origin v1.2.3`
4. Go to GitHub Actions and approve the `npm-publish` environment
5. The package will be published to npm and a GitHub release will be created

## Environment Protection Rules

The `npm-publish` environment includes:
- **Required reviewers**: Must be configured in GitHub repository settings
- **Deployment branches**: Can be restricted to specific branches
- **Wait timer**: Optional delay before deployment
- **Environment secrets**: Can store environment-specific secrets

## Troubleshooting

### Common Issues

1. **Tests failing**: Check the CI workflow logs for specific test failures
2. **Linting errors**: Run `npm run lint` locally to see linting issues
3. **Build failures**: Ensure all dependencies are properly installed
4. **Publishing blocked**: Check that the `npm-publish` environment is properly configured with required reviewers

### Checking Workflow Status
- Go to the **Actions** tab in your GitHub repository
- View the status of recent workflow runs
- Click on individual jobs to see detailed logs

## Security Considerations

- The NPM token has minimal required permissions (Automation type)
- Environment protection ensures only authorized users can approve releases
- All workflows run in isolated environments
- Secrets are encrypted and only accessible during workflow execution

## Next Steps

1. Configure the `npm-publish` environment in GitHub repository settings
2. Add the `NPM_TOKEN` secret
3. Test the CI workflow by creating a pull request
4. Test the publish workflow by creating a version tag
5. Approve the first release through the GitHub environment
