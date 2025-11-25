FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i --no-fund --no-audit
COPY src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]