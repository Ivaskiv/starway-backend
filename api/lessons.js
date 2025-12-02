// api/lessons.js
import { Router } from 'express';

const router = Router();

const lessons = [
  {
    id: 1,
    title: "Крок 1. Твій базовий стан",
    video: "https://youtu.be/Tkx-7Dhg0pQ?si=dmMx9HlJkfDxlSIz",
    task: [
      "1. Як я насправді живу зараз?",
      "2. З якого стану я приймаю рішення?",
      "3. Де я найбільше застрягла?"
    ]
  },
  {
    id: 2,
    title: "Урок 2. Бачення без чужих шаблонів",
    video: "https://youtu.be/dyeFBWIrHKw?si=V52NljYjzqC-X3Ow",
    task: ["..."]
  },
  {
    id: 3,
    title: "Урок 3. Бачення без чужих шаблонів",
    video: "https://youtu.be/dyeFBWIrHKw?si=V52NljYjzqC-X3Ow",
    task: ["..."]
  },
  {
    id: 4,
    title: "Урок 4. Бачення без чужих шаблонів",
    video: "https://youtu.be/dyeFBWIrHKw?si=V52NljYjzqC-X3Ow",
    task: ["..."]
  },
  {
    id: 5,
    title: "Урок 5. Бачення без чужих шаблонів",
    video: "https://youtu.be/dyeFBWIrHKw?si=V52NljYjzqC-X3Ow",
    task: ["..."]
  },
  {
    id: 6,
    title: "Урок 6. Бачення без чужих шаблонів",
    video: "https://youtu.be/dyeFBWIrHKw?si=V52NljYjzqC-X3Ow",
    task: ["..."]
  }
];

router.get('/', (req, res) => {
  res.json(lessons);
});

export default router;
