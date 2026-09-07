FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies first (layer cache optimization)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
