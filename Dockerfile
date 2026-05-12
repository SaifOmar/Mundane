FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates bash && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY types ./types
COPY Back-End/package.json Back-End/
COPY Back-End/prisma Back-End/prisma
COPY Front-End/package.json Front-End/

RUN npm install

COPY . .

RUN chmod +x start.sh

RUN mkdir -p Back-End/prisma/data

ENV DATABASE_URL="file:./data/mundane.db"

RUN cd Back-End && npx prisma generate && npx prisma db push

EXPOSE 32768

CMD ["./start.sh"]