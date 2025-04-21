# Stage 1: Build the application
FROM node:23.11.0-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate Prisma client (if needed)
# RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# Stage 2: Create the final production image
FROM node:23.11.0-alpine

WORKDIR /usr/src/app

# Copy necessary artifacts from the builder stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
# If using Prisma, copy the schema
# COPY --from=builder /usr/src/app/prisma ./prisma

# Install production dependencies only (if node_modules aren't copied above)
# RUN npm ci --omit=dev --ignore-scripts # --ignore-scripts can be safer

# App Runner uses the PORT environment variable, default is 8000
EXPOSE 8000

# Command to run the application
CMD ["node", "dist/main"] 