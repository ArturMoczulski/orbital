# syntax=docker/dockerfile:1

# Base stage: install dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Copy root workspace configuration
COPY package.json yarn.lock turbo.json ./
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# Copy package.json files
COPY services/world/package.json ./services/world/package.json
COPY services/shared/scout-core/package.json ./services/shared/scout-core/package.json
COPY libs/kiloaxe/core/package.json ./libs/kiloaxe/core/package.json
COPY libs/kiloaxe/characters/package.json ./libs/kiloaxe/characters/package.json
COPY libs/kiloaxe/typegoose/package.json ./libs/kiloaxe/typegoose/package.json

# Copy source files
COPY services/shared/scout-core ./services/shared/scout-core
COPY services/world ./services/world
COPY libs/kiloaxe/core ./libs/kiloaxe/core
COPY libs/kiloaxe/characters ./libs/kiloaxe/characters
COPY libs/kiloaxe/typegoose ./libs/kiloaxe/typegoose

# Install dependencies
RUN corepack enable && yarn install

# Development stage: mount code and run in watch mode
FROM base AS dev
WORKDIR /app/services/world
EXPOSE 3000
CMD ["yarn", "run", "start:dev"]

# Build stage: compile TypeScript
FROM base AS build
WORKDIR /app/services/world
RUN yarn run build

# Production stage: copy compiled artifacts
FROM node:18-alpine AS prod
WORKDIR /app
# Copy only the built files and dependencies needed for production
COPY --from=build /app/services/world/dist ./dist
COPY --from=build /app/services/world/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
# Copy shared dependencies
COPY --from=build /app/services/shared ./services/shared
COPY --from=build /app/libs/kiloaxe/core ./libs/kiloaxe/core
COPY --from=build /app/libs/kiloaxe/characters ./libs/kiloaxe/characters
COPY --from=build /app/libs/kiloaxe/typegoose ./libs/kiloaxe/typegoose
EXPOSE 3000
# Run node directly on the main.js file
CMD ["node", "dist/main.js"]