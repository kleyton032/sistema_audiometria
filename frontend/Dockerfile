# ── Estágio 1: Build da aplicação React + TypeScript (Vite) ──────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências aproveitando o cache de camadas do Docker
COPY package.json package-lock.json ./
RUN npm ci

# Copia o código-fonte e executa a compilação otimizada de produção
COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ── Estágio 2: Runtime seguro e leve com Nginx Unprivileged (Non-Root) ───────
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

# Endereço padrão do container do backend na rede interna do Docker
# (pode ser sobrescrito via variável de ambiente no docker-compose)
ENV BACKEND_UPSTREAM=http://backend:8000

# Copia o template de configuração (processado automaticamente com envsubst pelo entrypoint oficial)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copia apenas os artefatos estáticos compilados com permissão do usuário não-root (nginx)
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
