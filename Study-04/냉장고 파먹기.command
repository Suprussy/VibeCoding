#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "  ============================="
echo "    냉장고 파먹기 앱 시작 중..."
echo "  ============================="
echo ""

if [ ! -d "node_modules" ]; then
  echo "  의존성 설치 중..."
  npm install
  echo ""
fi

PID=$(lsof -ti :3000 2>/dev/null)
if [ -n "$PID" ]; then
  echo "  포트 3000 사용 중 — 기존 프로세스 종료 중..."
  kill $PID 2>/dev/null
  sleep 1
fi

npm run dev &
until curl -s -o /dev/null http://localhost:3000; do sleep 0.5; done
open http://localhost:3000
wait
