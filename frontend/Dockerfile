FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Public URL of the site (used for canonical links and social previews)
ARG VITE_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# The nginx image renders /etc/nginx/templates/*.template into conf.d at startup
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:5000
# Only substitute BACKEND_URL (leave nginx's own $variables alone)
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL
EXPOSE 80
