// app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import lessonsRouter from './api/lessons.js';
import progressRouter from './api/progress.js';
import usersRouter from './api/users.js';
import purchasesRouter from './api/purchases.js';
import webhookRouter from './api/webhook.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// базова перевірка env
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL не заданий в env');
  process.exit(1);
}

app.use(cors());
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

// healthcheck
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, env: NODE_ENV });
});

// роутери
app.use('/api/lessons', lessonsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/users', usersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/webhook', webhookRouter);

// 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error('API error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// локально слухає порт, на Vercel це ігнорується
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;
