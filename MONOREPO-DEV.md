# Monorepo Development Setup

This document explains how the development workflow is set up in this monorepo to enable watching and rebuilding of dependencies.

## Overview

The monorepo uses Turborepo to orchestrate the development workflow. When you run `yarn dev`, it will:

1. Start all libraries in watch mode
2. Start all services in watch mode
3. Start all clients in development mode
4. Ensure that when a library changes, any service or client that depends on it will pick up the changes

## How It Works

### Libraries

Libraries (in `libs/`) use TypeScript's watch mode (`tsc -b --watch`) to rebuild when their source files change. The compiled output is placed in the `dist/` directory of each library.

### Services

Services (in `services/`) use NestJS's watch mode (`nest start --watch`) to restart when their source files change. They depend on the compiled output of libraries, so when a library is rebuilt, the service will pick up the changes.

### Clients

Clients (in `clients/`) use Next.js's development mode (`next dev`) with the `transpilePackages` option and webpack aliases to watch and transpile workspace dependencies. This allows them to pick up changes in libraries immediately without requiring a rebuild.

## Turborepo Configuration

The `turbo.json` file is configured to:

1. Run the `dev` script in all packages in parallel
2. Ensure that dependencies are started before the packages that depend on them (`dependsOn: ["^dev"]`)
3. Keep all processes running (`persistent: true`)
4. Not cache the output of watch tasks (`cache: false`)
5. Specify empty outputs for watch tasks (`outputs: []`)

## Available Scripts

- `yarn dev`: Run all packages in development/watch mode
- `yarn dev:services`: Run only the services in development/watch mode
- `yarn dev:clients`: Run only the clients in development/watch mode
- `yarn dev:libs`: Run only the libraries in watch mode
- `yarn dev:orbital`: Run only the @orbital packages in development/watch mode
- `yarn dev:scout`: Run only the @scout packages in development/watch mode

## Example Workflow

1. Make a change to a library (e.g., `libs/@orbital/core`)
2. The library's watch task will rebuild it
3. Any service or client that depends on that library will pick up the changes:
   - Services will restart automatically
   - Clients will hot-reload the changes

## Troubleshooting

If changes in libraries are not being picked up by services or clients:

1. Make sure the library is being built correctly (check the console output)
2. For services, you might need to restart the service manually if the dependency graph is complex
3. For clients, make sure the library is listed in the `transpilePackages` array in the Next.js configuration
