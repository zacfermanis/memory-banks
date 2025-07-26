# Publishing to npm

This project uses GitHub Actions to automatically publish to npm when a new release is created.

## Setup

### 1. NPM Token Setup

1. Create an npm account if you don't have one: https://www.npmjs.com/signup
2. Generate an npm access token:
   - Go to https://www.npmjs.com/settings/tokens
   - Click "Generate New Token"
   - Select "Automation" token type
   - Copy the token

### 2. GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm access token

### 3. Update package.json

Make sure to update the following fields in `package.json`:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/memory-banks.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/memory-banks/issues"
  },
  "homepage": "https://github.com/yourusername/memory-banks#readme"
}
```

Replace `yourusername` with your actual GitHub username.

## Publishing Process

### 1. Development Workflow

1. Make your changes
2. Run tests locally: `npm test`
3. Build the project: `npm run build`
4. Commit and push your changes
5. Create a pull request (optional but recommended)

The CI workflow will automatically run on:
- Pull requests to main branch
- Pushes to main and develop branches

### 2. Creating a Release

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. Create a GitHub release:
   - Go to your repository on GitHub
   - Click "Releases" in the right sidebar
   - Click "Create a new release"
   - Choose a tag (should match the version you just created)
   - Add release notes
   - Click "Publish release"

3. The publish workflow will automatically:
   - Build the project
   - Run tests
   - Publish to npm

### 3. Verification

After publishing, you can verify the package is available:

```bash
npm view memory-bank
npx init-memory-bank --help
```

## Workflow Files

- `.github/workflows/ci.yml` - Runs on PRs and pushes to ensure code quality
- `.github/workflows/publish.yml` - Publishes to npm when a release is created

## Troubleshooting

### Common Issues

1. **Build fails**: Check that TypeScript compiles without errors
2. **Tests fail**: Ensure all tests pass locally before pushing
3. **Publish fails**: Verify NPM_TOKEN is set correctly in GitHub secrets
4. **Version conflicts**: Make sure the version in package.json is higher than the current npm version

### Manual Publishing

If you need to publish manually:

```bash
npm login
npm run build
npm publish
```

## Security Notes

- Never commit the NPM_TOKEN to your repository
- Use automation tokens, not personal access tokens
- Regularly rotate your npm tokens
- The token only needs publish permissions 