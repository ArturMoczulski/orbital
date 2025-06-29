# Yarn Setup Guide

This project uses Yarn 4.9.2 managed by Corepack. Follow these steps to set up your development environment:

## Prerequisites

- Node.js 16.9+ or 14.19+ (with Corepack support)

## Setup Instructions

1. Enable Corepack (if not already enabled):

```bash
corepack enable
```

2. Prepare the correct Yarn version:

```bash
corepack prepare yarn@4.9.2 --activate
```

3. Install dependencies:

```bash
yarn install
```

After completing these steps, you can use the regular `yarn` commands without needing to prefix them with `corepack`:

```bash
yarn build
yarn dev
yarn test
```

## How It Works

Corepack is a tool included with Node.js that manages package manager versions. When you run the setup steps above:

1. `corepack enable` registers Corepack as the handler for package managers
2. `corepack prepare yarn@4.9.2 --activate` downloads and activates the specific Yarn version
3. The `packageManager` field in package.json tells Corepack which version to use

This ensures that everyone on the project uses the same Yarn version, avoiding compatibility issues.

## Troubleshooting

If you encounter errors about the wrong Yarn version, ensure Corepack is enabled and the correct Yarn version is activated:

```bash
corepack enable
corepack prepare yarn@4.9.2 --activate
```

## CI/CD Configuration

For CI/CD pipelines, ensure that Corepack is enabled in your workflow:

```yaml
steps:
  - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
      node-version: "18"
      corepack: true

  - name: Install dependencies
    run: yarn install
```
