FROM node:18-alpine

WORKDIR /app

# Устанавливаем nodemon для разработки (опционально)
RUN npm install -g nodemon

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем все файлы
COPY . .

# Создаём непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Для разработки с авто-перезагрузкой:
# CMD ["nodemon", "service1-inventory.js"]

# Для production:
CMD ["node", "service1-inventory.js"]