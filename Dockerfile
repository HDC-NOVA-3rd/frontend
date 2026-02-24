# Stage 1: React 애플리케이션 빌드
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run dist

# Stage 2: Nginx를 통한 서빙
FROM nginx:alpine
# 기본 Nginx 설정 삭제 후 커스텀 설정 복사
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/

# Builder 스테이지에서 생성된 빌드 결과물을 Nginx 서빙 폴더로 복사
COPY --from=builder /app/dist /usr/share/nginx/html 
# (Vite 사용 시 /app/dist 로 변경)

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
