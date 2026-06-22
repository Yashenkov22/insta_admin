FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM alpine:3.20
COPY --from=builder /app/dist /dist
CMD ["sh", "-c", "cp -r /dist/* /output/ && echo '[frontend] Build copied to /output' && tail -f /dev/null"]
