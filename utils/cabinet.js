// utils/cabinet.js 
export function normalizeUser(u) {
  return {
    id: u.id,
    telegram_id: u.telegram_id,
    username: u.telegram_username,
    name: u.name,
    email: u.email,
    created_at: u.created_at
  };
}

export function buildProductItem(product, progress, enrollment) {
  const lessons = progress.filter(p => p.product_id === product.id);
  const completed = lessons.filter(p => p.completed).length;
  const total = lessons.length || 1;
  const percent = Math.round((completed / total) * 100);

  const active =
    product.type === "free" ||
    enrollment?.status === "active";

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    type: product.type,
    payment_url: product.payment_url,
    is_active: active,
    progress: active ? percent : 0
  };
}

export function buildMiniappItem(m, purchased) {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description,
    icon_url: m.icon_url,
    is_free: m.is_free,
    status: m.is_free || purchased.includes(m.id) ? "active" : "locked",
    url: m.url
  };
}
