# Orbital Monorepo Commands

This document describes how to use the CLI and Yarn scripts provided by the  
Orbital Monorepo Template.

## Yarn Scripts

- **build**: `yarn build`  
  Runs `turbo run build` to compile all workspaces.

- **test**: `yarn test`  
  Runs `turbo run test` to execute all tests in all workspaces (libs, services, clients, orb).

- **lint**: `yarn lint`  
  Runs `turbo run lint` to lint all workspaces.

- **orb**: `yarn orb <command>`
- **plop**: `yarn plop`  
  Launches the custom CLI (Orb) for scaffolding and managing projects.

## Orb CLI Commands (via `yarn orb`)

The Orb CLI offers the following commands:

**`yarn orb help`**  
 Displays help information and available commands.

**Monorepo management**

- `yarn orb monorepo install`  
  Installs the `monorepo-template` remote in your Git repository.
- `yarn orb monorepo update`  
  Fetches and merges upstream changes from the `monorepo-template` remote.
- `yarn orb monorepo test`  
  Runs monorepo-template integration tests (equivalent to `yarn test:monorepo-template`).

**Project scaffolding**

- `yarn orb create <category> <template> <name>`  
  Creates a new project from a template.
  - `category`: `library`, `service`, `client`, or `tool`.
  - `template`: e.g., `ts-lib`, `nestjs`, `client`.
  - `name`: Package name (scoped names allowed, e.g., `@org/pkg`).
    Example:

  ```bash
  yarn orb create library ts-lib @myorg/utils
  yarn orb create tool plop-plugin-ts modify-json
  ```

  ```

  ```

**Project profiles**

- `yarn orb profile add-profile <projectName> <profiles...>`  
  Apply one or more plop-based profiles to an existing project non-interactively.

- `yarn orb profile create <profileName>`  
  Scaffold a new plop-based profile non-interactively.

**Interactive management**

- `yarn orb manage`  
  Launches an interactive prompt to create projects, manage environment variables, or run monorepo commands.

## Running Monorepo Tests

To test only the monorepo template itself:

```bash
yarn orb monorepo test
```

## PM2 Process Management

The monorepo includes PM2 integration for managing services and clients through the Orbital Orb CLI. These commands provide Docker Compose-like functionality for starting, stopping, and managing processes.

### Orb CLI PM2 Commands

- **dev**: `yarn orb dev [service1 service2 ...]`
  Starts services in development mode (watch mode by default).
  Examples:
  - `yarn orb dev world admin-gateway` - Start specific services
  - `yarn orb dev --debug world` - Start world service in debug mode
  - `yarn orb dev --prod admin` - Start admin in production mode
  - `yarn orb dev --list` - List all available services

- **watch**: `yarn orb watch [service1 service2 ...]`
  Starts services in watch mode (alias for `dev`).
  Examples:
  - `yarn orb watch world admin-gateway` - Start specific services
  - `yarn orb watch` - Start all services
  - `yarn orb watch --list` - List all available services

- **logs**: `yarn orb logs [service1 service2 ...]`
  Views logs for specified services.
  Examples:
  - `yarn orb logs world admin` - View logs for specific services
  - `yarn orb logs -w` or `yarn orb logs --watch` - Stream logs continuously
  - `yarn orb logs --list` - List all available services

- **restart**: `yarn orb restart [service1 service2 ...]`
  Restarts specified services. If no services are specified, all services are restarted.
  Examples:
  - `yarn orb restart world admin-gateway` - Restart specific services
  - `yarn orb restart --watch world` - Restart only watch mode for world service
  - `yarn orb restart --list` - List all available services

- **down**: `yarn orb down [service1 service2 ...]`
  Stops and deletes specified services. If no services are specified, all services are stopped and deleted.
  Examples:
  - `yarn orb down admin phaser-game` - Stop and delete specific services
  - `yarn orb down --debug world` - Stop and delete only debug mode for world service
  - `yarn orb down --list` - List all available services

- **status**: `yarn status`
  Shows the status of all PM2 processes.

- **stop**: `yarn stop`
  Stops all services but keeps them in PM2's process list.

- **delete**: `yarn delete`
  Deletes all services from PM2's process list.

### Service Names

The following service names can be used with the commands above:

- `world` or `@orbital/world`: World microservice
- `admin-gateway` or `@orbital/admin-gateway`: Admin Gateway service
- `admin` or `@orbital/admin`: Phaser Maps client
- `phaser-game` or `@orbital/phaser-game`: Phaser Game client

Or equivalently:

```bash
yarn test:monorepo-template
```

## Running All Tests

To run all tests across your workspace:

```bash
yarn test
```
