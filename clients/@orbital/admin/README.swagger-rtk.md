# Swagger + RTK Query Integration

This document describes the integration between NestJS Swagger in the backend and RTK Query in the frontend.

## Overview

The integration uses the following flow:

1. NestJS Swagger generates OpenAPI specifications from the backend APIs
2. RTK Query's codegen tool generates TypeScript code from the OpenAPI specifications
3. The generated code is imported into the Redux store

## Backend Setup

### World Service

The World service is set up to use NestJS Swagger with Zod schemas:

1. **Zod Integration**: We use `nestjs-zod` to integrate Zod schemas with NestJS Swagger.

   - The Zod schemas from `@orbital/core` are used to create DTOs using `createZodDto`
   - NestJS Swagger is patched using `patchNestJsSwagger()` to understand Zod schemas

2. **Swagger Configuration**: The Swagger configuration is set up in `main.ts`:

   - The OpenAPI specification is generated and saved to `openapi.json`
   - The Swagger UI is available at `/api-docs`

3. **DTOs**: The DTOs are created from Zod schemas:
   - `AreaDto`: Created from `AreaSchema`
   - `PositionDto`: Created from `PositionSchema`
   - `AreaMapDto`: Created from `AreaMapSchema`
   - `CreateAreaDto`: Created from a modified version of `AreaSchema`
   - `UpdateAreaDto`: Created from a partial version of `AreaSchema`

### Admin Gateway

The Admin Gateway service is also set up to use NestJS Swagger:

1. **Swagger Configuration**: The Swagger configuration is set up in `main.ts`:
   - The OpenAPI specification is generated and saved to `openapi.json`
   - The Swagger UI is available at `/api-docs`

## Frontend Setup (Phaser Maps Client)

The frontend is set up to use RTK Query's codegen to generate APIs for both services:

1. **World API Codegen**:

   - Configuration in `world-openapi-config.ts`
   - Base API in `emptyWorldApi.ts` with baseUrl: "/api/world"
   - Generated API saved to `worldApi.generated.ts`

2. **Admin API Codegen**:

   - Configuration in `openapi-config.ts`
   - Base API in `emptyApi.ts` with baseUrl: "/api/admin"
   - Generated API saved to `adminApi.generated.ts`

3. **Store Integration**:
   - Both APIs are integrated into the Redux store in `store.ts`
   - Dynamic imports handle the case where the APIs haven't been generated yet

## Usage

### Generating the APIs

To generate both APIs, run the following command:

```bash
yarn generate:api
```

This will:

1. Generate the Admin API from the Admin Gateway's OpenAPI spec
2. Generate the World API from the World service's OpenAPI spec

You can also generate each API separately:

```bash
# Generate only the Admin API
yarn generate:admin-api

# Generate only the World API
yarn generate:world-api
```

### Using the Generated APIs

The generated APIs can be used in components like this:

```tsx
// Using the World API
import { useGetAreasQuery } from "./services/worldApi.generated";

function AreasList() {
  const { data, error, isLoading } = useGetAreasQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.toString()}</div>;

  return (
    <ul>
      {data?.map((area) => (
        <li key={area.id}>{area.name}</li>
      ))}
    </ul>
  );
}

// Using the Admin API
import { useGetUsersQuery } from "./services/adminApi.generated";

function UsersList() {
  const { data, error, isLoading } = useGetUsersQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.toString()}</div>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Benefits

This integration provides several benefits:

1. **Type Safety**: Both APIs are fully typed, providing type safety and autocompletion
2. **Automatic Updates**: When the backend APIs change, the frontend can be updated by regenerating the APIs
3. **Documentation**: The Swagger UI provides documentation for both APIs
4. **Reduced Boilerplate**: RTK Query handles caching, loading states, and error handling
5. **Single Source of Truth**: The Zod schemas in `@orbital/core` are the single source of truth for the data models
6. **Consistency**: Both APIs use the same approach, making the codebase more consistent and easier to maintain
