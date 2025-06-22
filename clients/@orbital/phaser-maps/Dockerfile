# Build stage for dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root workspace configuration
COPY package.json yarn.lock turbo.json ./
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# Copy only necessary package.json files
COPY clients/@orbital/phaser/package.json ./clients/@orbital/phaser/package.json
COPY libs/@orbital/phaser-ui/package.json ./libs/@orbital/phaser-ui/package.json

# Create empty phaser-extended-mocks to satisfy dependencies
RUN mkdir -p ./libs/@orbital/phaser-extended-mocks \
    && echo "{\"name\":\"@orbital/phaser-extended-mocks\",\"version\":\"1.0.0\",\"main\":\"dist/index.js\"}" > ./libs/@orbital/phaser-extended-mocks/package.json \
    && mkdir -p ./libs/@orbital/phaser-extended-mocks/dist \
    && echo "export default {};" > ./libs/@orbital/phaser-extended-mocks/dist/index.js

# Copy source files
COPY libs/@orbital/phaser-ui/src ./libs/@orbital/phaser-ui/src
COPY libs/@orbital/phaser-ui/tsconfig.json ./libs/@orbital/phaser-ui/tsconfig.json
COPY clients/@orbital/phaser ./clients/@orbital/phaser

# Setup Yarn and build
RUN corepack enable \
    && corepack prepare yarn@stable --activate \
    && yarn install \
    && yarn workspace @orbital/phaser-ui build \
    && cd clients/@orbital/phaser \
    && yarn build

# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app .

# Development stage for hot-reloading
FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/yarn.lock ./yarn.lock
COPY --from=deps /app/.yarnrc.yml ./
RUN corepack enable && corepack prepare yarn@stable --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/clients/@orbital/phaser ./clients/@orbital/phaser
WORKDIR /app/clients/@orbital/phaser
ENV NODE_ENV=development
EXPOSE 3000
CMD ["sh","-c","NEXT_TELEMETRY_DISABLED=1 npm exec next dev -p ${KILOAXE_CLIENTS_PHASER_PORT}"]

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=build /app/.yarn ./.yarn
COPY --from=build /app/clients/@orbital/phaser/.next ./clients/@orbital/phaser/.next
COPY --from=build /app/clients/@orbital/phaser/package.json ./clients/@orbital/phaser/package.json
COPY --from=build /app/libs/@orbital/phaser-ui ./libs/@orbital/phaser-ui
RUN mkdir -p ./clients/@orbital/phaser/public
RUN corepack enable && corepack prepare yarn@stable --activate && yarn install
WORKDIR /app/clients/@orbital/phaser
EXPOSE 3000
CMD ["yarn", "start"]