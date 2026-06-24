#!/bin/bash

cd "$(dirname "$0")"

if ! command -v node &>/dev/null; then
  echo "Node.js가 설치되어 있지 않습니다."
  echo "https://nodejs.org 에서 설치해주세요."
  read -p "아무 키나 누르면 종료합니다..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "패키지를 설치하는 중..."
  npm install
fi

echo "퀴즈 게임을 시작합니다..."
echo "종료하려면 이 창을 닫거나 Ctrl+C를 누르세요."
echo ""

npm run dev 2>&1 | while IFS= read -r line; do
  echo "$line"
  if echo "$line" | grep -q "http://localhost:"; then
    url=$(echo "$line" | grep -oE "http://localhost:[0-9]+")
    echo ""
    echo "브라우저에서 $url 을 엽니다..."
    open "$url"
  fi
done
