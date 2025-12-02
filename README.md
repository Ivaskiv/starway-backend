# Starway Backend

<!-- ### Stack -->
- Node.js (Vercel serverless)
- PostgreSQL (Neon)
- MiniApp + Tilda + Telegram Bot

<!-- ### ENV -->
Add to Vercel environment variables:

- `NEON_DATABASE_URL` - Neon database URL
- `TELEGRAM_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID
- `TILDA_TOKEN` - Tilda token
- `TILDA_PROJECT_ID` - Tilda project ID
- `TILDA_PAGE_ID` - Tilda page ID
- `TILDA_PAGE_URL` - Tilda page URL
- `TILDA_PAGE_NAME` - Tilda page name
- `TILDA_PAGE_DESCRIPTION` - Tilda page description
- `TILDA_PAGE_KEYWORDS` - Tilda page keywords
- `TILDA_PAGE_IMAGE` - Tilda page image
- `TILDA_PAGE_IMAGE_ALT` - Tilda page image alt
- `TILDA_PAGE_IMAGE_TITLE` - Tilda page image title
- `TILDA_PAGE_IMAGE_CAPTION` - Tilda page image caption

<!-- ### API -->
- `/api/webhook` - Telegram webhook
- `/api/miniapp` - MiniApp webhook
- `/api/tilda` - Tilda webhook

<!-- ### Telegram Bot -->
- `/start` - Start command
- `/help` - Help command
- `/subscribe` - Subscribe command
- `/unsubscribe` - Unsubscribe command
- `/status` - Status command

<!-- ### MiniApp -->
- `/api/miniapp` - MiniApp webhook

<!-- ### Tilda -->
- `/api/tilda` - Tilda webhook
- `/api/tilda/preview` - Tilda preview webhook

<!-- ### Database -->
- `users` - Users table
- `subscriptions` - Subscriptions table

<!-- ### Cron -->
- `/api/cron` - Cron job

<!-- ### Deploy -->
- `vercel` - Vercel deployment

<!-- ### License -->
- MIT
<!-- ### API endpoints -->

| Endpoint      | Method | Description             |
|--------------|--------|-------------------------|
| /api/users   | POST   | create user             |
| /api/lessons | GET    | list of lessons         |
| /api/progress| POST   | update lesson progress  |
| /api/purchases | POST | register purchase       |
| /api/webhook | POST   | parse start parameter   |
| /api/miniapp | POST   | parse miniapp parameter |
| /api/tilda   | POST   | parse tilda parameter   |

Backend 2.0
✔ Telegram Login (перевірка хешу Telegram)
✔ Email Login (bcrypt + JWT)
✔ Refresh токени (власна таблиця refresh_tokens)
✔ WayForPay payments → enrollments
✔ Miniapps + Products + Lessons Engine
✔ Progress Engine (locked/open/completed)
✔ Cabinet API (всі продукти юзера + статуси + прогрес)
✔ Answers Engine (відправка Д/З у курсах)
✔ Webhook для SendPulse/Tilda
✔ Health-check /api/ping
✔ Unification + Clean Architecture
