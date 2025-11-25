# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . .
ARG VITE_API_BASE_URL="http://localhost:3000"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Serve static assets via nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
