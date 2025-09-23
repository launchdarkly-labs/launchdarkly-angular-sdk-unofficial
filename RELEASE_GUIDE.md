# Release Guide

This guide explains how to create and publish new versions of the LaunchDarkly Angular library.

## Prerequisites

1. **NPM Token**: You need an NPM token with publish permissions. Add it as a GitHub secret named `NPM_TOKEN`.
2. **Git Access**: Ensure you have push access to the repository.
3. **Clean Working Directory**: Make sure your working directory is clean before starting a release.

## Release Process

### 1. Prepare for Release

Before creating a release, ensure all changes are committed and tested:

```bash
# Run tests and linting
npm run release:prepare

# Generate release notes (optional, for review)
npm run release:notes
```

### 2. Create a Release

Choose the appropriate release type based on the changes:

#### Patch Release (1.0.0 → 1.0.1)
For bug fixes and small improvements:
```bash
npm run release:patch
```

#### Minor Release (1.0.0 → 1.1.0)
For new features that are backward compatible:
```bash
npm run release:minor
```

#### Major Release (1.0.0 → 2.0.0)
For breaking changes:
```bash
npm run release:major
```

### 3. What Happens During Release

The release scripts will:

1. **Update Version & Create Tag**: `npm version` automatically increments the version in `package.json` and creates a git tag (e.g., `v1.2.4`)
2. **Push Changes**: Push the changes and tag to the remote repository
3. **Trigger CI/CD**: The GitHub Actions workflow will automatically:
   - Run tests and linting
   - Build the library
   - Publish to NPM
   - Create a GitHub release

### 4. Manual Release Process (Alternative)

If you prefer to do the release manually:

```bash
# 1. Update version and create tag
npm run version:patch  # or version:minor, version:major

# 2. Push changes and tag
npm run release:push

# 3. Generate release notes
npm run release:notes
```

## Version Management Scripts

| Script | Description |
|--------|-------------|
| `npm run version:patch` | Increment patch version (1.0.0 → 1.0.1) |
| `npm run version:minor` | Increment minor version (1.0.0 → 1.1.0) |
| `npm run version:major` | Increment major version (1.0.0 → 2.0.0) |
| `npm run release:prepare` | Run tests, linting, and build |
| `npm run release:push` | Push changes and tags to remote |
| `npm run release:patch` | Complete patch release process |
| `npm run release:minor` | Complete minor release process |
| `npm run release:major` | Complete major release process |
| `npm run release:notes` | Generate release notes from git commits |

## GitHub Actions Workflow

The `.github/workflows/publish.yml` workflow automatically:

1. **Triggers** on version tags (e.g., `v1.2.4`)
2. **Tests** the code with `npm test`
3. **Lints** the code with `npm run lint`
4. **Builds** the library with `npm run build:prod`
5. **Publishes** to NPM using the `NPM_TOKEN` secret
6. **Creates** a GitHub release with generated notes

## NPM Package Configuration

The package is configured with:

- **Main Entry**: `dist/launchdarkly-angular/fesm2022/launchdarkly-angular.mjs`
- **Types**: `dist/launchdarkly-angular/index.d.ts`
- **Files**: Only includes `dist/launchdarkly-angular`, `README.md`, and `LICENSE`
- **Engines**: Node.js >= 18.0.0, npm >= 8.0.0

## Troubleshooting

### Common Issues

1. **NPM Token Missing**: Ensure `NPM_TOKEN` is set as a GitHub secret
2. **Version Already Exists**: Check if the version is already published on NPM
3. **Build Failures**: Run `npm run release:prepare` locally to catch issues early
4. **Git Tag Conflicts**: Ensure no tag with the same name already exists

### Rollback Process

If a release needs to be rolled back:

1. **Unpublish** the version from NPM (if within 24 hours):
   ```bash
   npm unpublish launchdarkly-angular@<version>
   ```

2. **Delete** the git tag:
   ```bash
   git tag -d v<version>
   git push origin :refs/tags/v<version>
   ```

3. **Revert** the version in package.json and commit

## Best Practices

1. **Semantic Versioning**: Follow [SemVer](https://semver.org/) guidelines
2. **Test Before Release**: Always run `npm run release:prepare` before releasing
3. **Meaningful Commits**: Use conventional commit messages for better release notes
4. **Release Notes**: Review generated release notes before publishing
5. **Documentation**: Update documentation for significant changes

## Commit Message Convention

Use conventional commit messages for better release notes:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

Example:
```
feat: add support for custom flag evaluation
fix: resolve memory leak in flag subscription
docs: update installation instructions
```
