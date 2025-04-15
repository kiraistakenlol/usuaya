FROM node:23.11.0

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build -w frontend

ENV NODE_ENV=production

WORKDIR /app/frontend

EXPOSE 3000
ENV PORT=3000

CMD ["node", ".next/standalone/server.js"] 