# 🎣 Папина рыбалка

Telegram Mini App — личный рыбацкий дневник.

## Установка

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

| Переменная | Описание |
|---|---|
| `BOT_TOKEN` | Токен Telegram бота |
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key из Supabase |
| `ALLOWED_TELEGRAM_IDS` | Telegram ID отца (через запятую) |
| `WEBAPP_URL` | URL развёрнутого Mini App |

## Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL из `supabase_schema.sql` в SQL Editor
3. Создайте Storage bucket `fishing-photos` (public)
4. Скопируйте URL и ключи в `.env`

## Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Установите Mini App URL через BotFather:
   ```
   /newapp → выбрать бота → ввести URL
   ```

## Запуск локально

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Telegram Bot
cd backend
python -m app.bot
```

Frontend dev server проксирует `/api` на `localhost:8000`.

## Деплой на Railway

1. Подключите репозиторий к Railway
2. Добавьте переменные окружения
3. Railway автоматически соберёт frontend и запустит backend

## Структура

```
backend/          — FastAPI + aiogram
frontend/         — React + Vite + TypeScript
supabase_schema.sql — SQL миграции
```
