// index.js
const express = require('express');
const app = express();

// Vercel надає порт через змінну оточення PORT
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).send('Привіт! Сервер Node.js успішно працює на Vercel!');
});

app.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});