export default async function handler(req, res) {
  const { email } = req.body;

  console.log("RESET requested:", email);

  res.json({ ok: true });
}
