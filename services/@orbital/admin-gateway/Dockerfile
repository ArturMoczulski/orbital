# syntax=docker/dockerfile:1

# Base stage: install dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Copy root workspace configuration
COPY package.json yarn.lock turbo.json ./
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# Copy package.json files
COPY services/gateway/package.json ./services/gateway/package.json
COPY services/shared/scout-core/package.json ./services/shared/scout-core/package.json

# Copy source files
COPY services/shared/scout-core ./services/shared/scout-core
COPY services/gateway ./services/gateway

# Install dependencies with Yarn cache
RUN corepack enable && yarn install

# Development stage: mount code and run in watch mode
FROM base AS dev
WORKDIR /app/services/gateway
EXPOSE 3000
CMD ["sh", "-c", "cd /app/services/gateway && yarn run start:dev"]

# Build stage: compile TypeScript
FROM base AS build
WORKDIR /app/services/gateway
RUN yarn build

# Production stage: copy compiled artifacts and install dependencies with yarn
FROM node:18-alpine AS prod
WORKDIR /app

# Copy yarn configuration
COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/.yarn ./.yarn

# Copy all package.json files to maintain workspace structure
COPY --from=build /app/services/gateway/package.json ./services/gateway/package.json
COPY --from=build /app/services/shared/scout-core/package.json ./services/shared/scout-core/package.json

# Copy compiled code
COPY --from=build /app/services/gateway/dist ./services/gateway/dist
COPY --from=build /app/services/shared ./services/shared

# Install production dependencies
RUN corepack enable && yarn workspaces focus --all --production

# Removed references to @scout/core

EXPOSE 3000
# Run node directly on the main.js file
WORKDIR /app/services/gateway
CMD ["node", "dist/main.js"]