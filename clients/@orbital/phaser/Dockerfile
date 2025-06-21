# Build stage for dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root workspace configuration
COPY package.json yarn.lock turbo.json ./
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# Copy only the necessary package.json files
COPY clients/phaser/package.json ./clients/phaser/package.json
COPY clients/shared/phaser-ui/package.json ./clients/shared/phaser-ui/package.json

# Create empty phaser-extended-mocks directories to satisfy file dependencies
RUN mkdir -p ./clients/shared/phaser-extended-mocks \
    && echo "{\"name\":\"@kiloaxe/phaser-extended-mocks\",\"version\":\"0.1.0\",\"main\":\"dist/index.js\"}" > ./clients/shared/phaser-extended-mocks/package.json \
    && mkdir -p ./clients/shared/phaser-extended-mocks/dist \
    && echo "export default {};" > ./clients/shared/phaser-extended-mocks/dist/index.js \
    && mkdir -p ./clients/phaser-extended-mocks \
    && echo "{\"name\":\"@kiloaxe/phaser-extended-mocks\",\"version\":\"0.1.0\",\"main\":\"dist/index.js\"}" > ./clients/phaser-extended-mocks/package.json \
    && mkdir -p ./clients/phaser-extended-mocks/dist \
    && echo "export default {};" > ./clients/phaser-extended-mocks/dist/index.js

# Copy source files
COPY clients/shared/phaser-ui/src ./clients/shared/phaser-ui/src
COPY clients/shared/phaser-ui/tsconfig.json ./clients/shared/phaser-ui/tsconfig.json
COPY clients/phaser ./clients/phaser

# Setup Yarn and build
RUN corepack enable \
    && corepack prepare yarn@stable --activate \
    && yarn install \
    && yarn workspace @kiloaxe/phaser-ui build \
    && cd clients/phaser \
    && yarn build

# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app .

# Development stage for hot-reloading
FROM node:20-alpine AS dev
# Use root context to place node_modules at /app/node_modules
WORKDIR /app
# Copy root manifests for packageManager
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
# Copy project manifests to ensure packageManager field is available
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock

# Copy yarnrc to use node-modules linker
COPY --from=deps /app/.yarnrc.yml ./
# Activate stable Yarn
RUN corepack enable && corepack prepare yarn@stable --activate
# Copy workspace node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy built phaser output
COPY --from=build /app/clients/phaser ./clients/phaser
# Set working directory for dev commands
WORKDIR /app/clients/phaser
ENV NODE_ENV=development
EXPOSE 3000
CMD ["sh","-c","NEXT_TELEMETRY_DISABLED=1 npm exec next dev -p ${KILOAXE_CLIENTS_PHASER_PORT}"]

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy package.json and yarn configuration
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=build /app/.yarn ./.yarn
# Copy client files
COPY --from=build /app/clients/phaser/.next ./clients/phaser/.next
COPY --from=build /app/clients/phaser/package.json ./clients/phaser/package.json
# Copy shared dependencies
COPY --from=build /app/clients/shared ./clients/shared
# Create empty public directory if it doesn't exist
RUN mkdir -p ./clients/phaser/public
# Install dependencies
RUN corepack enable && corepack prepare yarn@stable --activate && yarn install
# Set working directory to the client
WORKDIR /app/clients/phaser
EXPOSE 3000
CMD ["yarn", "start"]