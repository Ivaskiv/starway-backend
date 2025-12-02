import { sql } from "../db/client.js";

export async function logPayment({ source, event_type, external_id, user_id, payload }) {
  await sql`
    INSERT INTO integration_logs (source, event_type, external_id, user_id, payload)
    VALUES (${source}, ${event_type}, ${external_id}, ${user_id}, ${payload})
  `;
}
