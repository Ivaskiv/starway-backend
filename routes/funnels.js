// routes/funnels.js
import { Router } from "express";
import { sql } from "../db/client.js";
import OpenAI from "openai";
import { decrypt } from "../helpers/crypto.js";

const router = Router();

// Helper: отримати OpenAI клієнт
async function getOpenAIClient(userId) {
  const [user] = await sql`SELECT plan FROM users WHERE id = ${userId}`;
  
  // Enterprise можуть використовувати свій ключ
  if (user.plan === 'enterprise') {
    const [integration] = await sql`
      SELECT credentials FROM user_integrations 
      WHERE user_id = ${userId} AND integration_type = 'openai' AND connected = true
    `;
    
    if (integration?.credentials?.apiKey) {
      return new OpenAI({ apiKey: decrypt(integration.credentials.apiKey) });
    }
  }
  
  // Інакше наш ключ
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Helper: перевірка та оновлення лімітів GPT
async function checkAndIncrementGPTLimit(userId) {
  const [user] = await sql`SELECT plan, limits FROM users WHERE id = ${userId}`;
  
  if (user.plan === 'pro' || user.plan === 'enterprise') {
    return true; // необмежено
  }
  
  const limits = user.limits;
  if (limits.gptRequests >= limits.gptRequestsMax) {
    throw new Error('GPT_LIMIT_REACHED');
  }
  
  // Інкремент
  limits.gptRequests = (limits.gptRequests || 0) + 1;
  await sql`UPDATE users SET limits = ${JSON.stringify(limits)}::jsonb WHERE id = ${userId}`;
  
  return true;
}

// Helper: запис використання API
async function logAPIUsage(userId, service, tokensUsed, cost) {
  await sql`
    INSERT INTO api_usage (user_id, service, operation, tokens_used, cost, metadata)
    VALUES (
      ${userId}, 
      ${service}, 
      'chat_completion', 
      ${tokensUsed}, 
      ${cost},
      ${JSON.stringify({ timestamp: new Date() })}::jsonb
    )
  `;
}

// GET /api/funnels - отримати всі воронки користувача
router.get("/", async (req, res) => {
  try {
    const funnels = await sql`
      SELECT * FROM funnels 
      WHERE user_id = ${req.user.id} 
      ORDER BY created_at DESC
    `;
    
    res.json(funnels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// GET /api/funnels/:id - отримати воронку
router.get("/:id", async (req, res) => {
  try {
    const [funnel] = await sql`
      SELECT * FROM funnels 
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    
    if (!funnel) {
      return res.status(404).json({ error: "not_found" });
    }
    
    res.json(funnel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// POST /api/funnels - створити воронку
router.post("/", async (req, res) => {
  const { name, type, niche, useGPT } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: "missing_fields" });
  }
  
  try {
    // Перевірка ліміту воронок
    const [user] = await sql`SELECT plan, limits FROM users WHERE id = ${req.user.id}`;
    const funnelCount = await sql`
      SELECT COUNT(*) as count FROM funnels WHERE user_id = ${req.user.id}
    `;
    
    if (user.plan === 'free' && Number(funnelCount[0].count) >= user.limits.funnelsMax) {
      return res.status(403).json({ error: "FUNNEL_LIMIT_REACHED" });
    }
    
    let steps = [];
    
    // Генерація з GPT
    if (useGPT && niche) {
      await checkAndIncrementGPTLimit(req.user.id);
      
      const openai = await getOpenAIClient(req.user.id);
      
      const systemPrompt = `Ти - експерт з маркетингу. Створи воронку для ${type} каналу в ніші: ${niche}.
Поверни JSON масив кроків. Кожен крок:
{
  "order": 1,
  "delay": 0,
  "content": {
    "text": "текст українською",
    "buttons": [{"text": "Кнопка", "action": "next"}],
    "aiModule": "reflection|wheel|chat"
  }
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Створи воронку на 5-7 днів для: ${niche}` }
        ],
        temperature: 0.7
      });
      
      const response = completion.choices[0].message.content;
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        steps = JSON.parse(jsonMatch[0]).map((step, idx) => ({
          ...step,
          id: `step_${Date.now()}_${idx}`
        }));
      }
      
      // Логування використання
      const tokensUsed = completion.usage?.total_tokens || 0;
      const cost = (tokensUsed / 1000) * 0.045;
      await logAPIUsage(req.user.id, 'openai', tokensUsed, cost);
    }
    
    // Створення воронки
    const [funnel] = await sql`
      INSERT INTO funnels (user_id, name, type, steps, settings)
      VALUES (
        ${req.user.id},
        ${name},
        ${type},
        ${JSON.stringify(steps)}::jsonb,
        ${JSON.stringify({ niche: niche || null, generatedWithGPT: useGPT || false })}::jsonb
      )
      RETURNING *
    `;
    
    // Оновлюємо лічильник
    const limits = user.limits;
    limits.funnels = Number(funnelCount[0].count) + 1;
    await sql`UPDATE users SET limits = ${JSON.stringify(limits)}::jsonb WHERE id = ${req.user.id}`;
    
    res.json(funnel);
  } catch (err) {
    console.error(err);
    
    if (err.message === 'GPT_LIMIT_REACHED') {
      return res.status(403).json({ error: "GPT_LIMIT_REACHED" });
    }
    
    res.status(500).json({ error: "server_error" });
  }
});

// PUT /api/funnels/:id - оновити воронку
router.put("/:id", async (req, res) => {
  try {
    const [existing] = await sql`
      SELECT id FROM funnels WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    
    if (!existing) {
      return res.status(404).json({ error: "not_found" });
    }
    
    const updates = [];
    const values = [];
    
    if (req.body.name) {
      updates.push('name = $' + (values.length + 1));
      values.push(req.body.name);
    }
    if (req.body.status) {
      updates.push('status = $' + (values.length + 1));
      values.push(req.body.status);
    }
    if (req.body.steps) {
      updates.push('steps = $' + (values.length + 1) + '::jsonb');
      values.push(JSON.stringify(req.body.steps));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: "no_updates" });
    }
    
    values.push(req.params.id);
    
    const [funnel] = await sql`
      UPDATE funnels 
      SET name = ${req.body.name || sql`name`},
          status = ${req.body.status || sql`status`},
          steps = ${req.body.steps ? JSON.stringify(req.body.steps) : sql`steps`}::jsonb
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    
    res.json(funnel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// DELETE /api/funnels/:id - видалити воронку
router.delete("/:id", async (req, res) => {
  try {
    const [funnel] = await sql`
      DELETE FROM funnels 
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING id
    `;
    
    if (!funnel) {
      return res.status(404).json({ error: "not_found" });
    }
    
    // Зменшуємо лічильник
    const [user] = await sql`SELECT limits FROM users WHERE id = ${req.user.id}`;
    const limits = user.limits;
    limits.funnels = Math.max(0, (limits.funnels || 0) - 1);
    await sql`UPDATE users SET limits = ${JSON.stringify(limits)}::jsonb WHERE id = ${req.user.id}`;
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// POST /api/funnels/improve-text - покращити текст з GPT
router.post("/improve-text", async (req, res) => {
  const { text, context } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "missing_text" });
  }
  
  try {
    await checkAndIncrementGPTLimit(req.user.id);
    
    const openai = await getOpenAIClient(req.user.id);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `Покращ текст для ${context || 'маркетингу'}. Зроби емоційним та переконливим. Українською. Тільки текст без пояснень.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.7
    });
    
    const improved = completion.choices[0].message.content;
    
    // Логування
    const tokensUsed = completion.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.045;
    await logAPIUsage(req.user.id, 'openai', tokensUsed, cost);
    
    res.json({ text: improved });
  } catch (err) {
    console.error(err);
    
    if (err.message === 'GPT_LIMIT_REACHED') {
      return res.status(403).json({ error: "GPT_LIMIT_REACHED" });
    }
    
    res.status(500).json({ error: "server_error" });
  }
});

// GET /api/funnels/stats/gpt-usage - статистика GPT
router.get("/stats/gpt-usage", async (req, res) => {
  try {
    const [user] = await sql`SELECT plan, limits FROM users WHERE id = ${req.user.id}`;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const usage = await sql`
      SELECT 
        COUNT(*) as requests,
        SUM(tokens_used) as total_tokens,
        SUM(cost) as total_cost
      FROM api_usage
      WHERE user_id = ${req.user.id} 
        AND service = 'openai' 
        AND created_at >= ${startDate.toISOString()}
    `;
    
    res.json({
      requests: Number(usage[0].requests) || 0,
      tokens: Number(usage[0].total_tokens) || 0,
      cost: parseFloat(usage[0].total_cost || 0).toFixed(4),
      limit: user.limits.gptRequestsMax,
      remaining: user.plan === 'free' 
        ? Math.max(0, user.limits.gptRequestsMax - user.limits.gptRequests)
        : -1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;