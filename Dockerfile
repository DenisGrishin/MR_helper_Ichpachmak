# Этап сборки
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY src ./src

# Компилируем TypeScript
RUN npm run build

# Этап production
FROM node:22-alpine AS production

WORKDIR /app

# Копируем package.json для установки только production зависимостей
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --omit=dev && npm cache clean --force

# Копируем скомпилированный код из builder
COPY --from=builder /app/dist ./dist

# Создаем директорию для базы данных
RUN mkdir -p /app/data

# Устанавливаем рабочую директорию для данных
WORKDIR /app

# Запускаем приложение
CMD ["npm", "run", "start:prod"]
