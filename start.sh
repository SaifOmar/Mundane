#!/bin/bash

cd /app/Back-End
DATABASE_URL="file:./data/mundane.db" npx prisma db push &
npm run dev &
BACKEND_PID=$!

cd /app/Front-End
npm run dev &
FRONTEND_PID=$!

cleanup() {
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGTERM SIGINT

wait