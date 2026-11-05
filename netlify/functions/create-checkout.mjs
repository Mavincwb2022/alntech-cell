import { randomUUID } from "node:crypto";
const respond = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff"}});
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function getProductionCatalog() {
  let catalog;
  try { catalog = JSON.parse(process.env.PRODUCT_CATALOG_JSON || ""); } catch { return null; }
  if (!Array.isArray(catalog) || catalog.length === 0) return null;
  const byId = new Map();
  for (const product of catalog) {
    if (!isRecord(product) || typeof product.id !== "string" || !/^[a-z0-9-]{1,64}$/.test(product.id) || typeof product.description !== "string" || product.description.trim().length < 2 || product.description.length > 120 || !Number.isSafeInteger(product.price) || product.price < 100 || product.price > 100_000_000 || byId.has(product.id)) return null;
    byId.set(product.id, {id: product.id, description: product.description.trim(), price: product.price});
  }
  return byId;
}
export default async (request) => {
  if (request.method !== "POST") return respond({message: "Método não permitido."}, 405);
  const origin = request.headers.get("origin"), siteUrl = process.env.SITE_URL;
  if (!siteUrl || !origin || origin !== new URL(siteUrl).origin) return respond({message: "Origem inválida para iniciar o checkout."}, 403);
  if (process.env.CHECKOUT_ENABLED !== "true") return respond({message: "Checkout pausado até a validação do catálogo e das condições comerciais."}, 503);
  const handle = process.env.INFINITEPAY_HANDLE?.trim();
  if (!handle || !/^[a-z0-9._-]{1,64}$/i.test(handle)) return respond({message: "Handle da InfinitePay ainda não configurada no servidor."}, 503);
  const apiKey = process.env.INFINITEPAY_API_KEY?.trim();
  if (!apiKey?.startsWith("inchk_")) return respond({message: "Checkout InfinitePay ainda não configurado no servidor."}, 503);
  const catalog = getProductionCatalog();
  if (!catalog) return respond({message: "Catálogo real ainda não configurado no servidor."}, 503);
  let rawBody, body;
  try { rawBody = await request.text(); if (new TextEncoder().encode(rawBody).byteLength > 4096) return respond({message: "Pedido muito grande."}, 413); body = JSON.parse(rawBody); } catch { return respond({message: "Pedido inválido."}, 400); }
  if (!isRecord(body) || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) return respond({message: "O carrinho está vazio ou contém itens demais."}, 400);
  const quantities = new Map();
  for (const item of body.items) {
    if (!isRecord(item) || typeof item.id !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20 || !catalog.has(item.id)) return respond({message: "O carrinho contém um produto ou quantidade inválida."}, 400);
    quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
    if (quantities.get(item.id) > 20) return respond({message: "Limite de 20 unidades por produto."}, 400);
  }
  const items = [...quantities].map(([id, quantity]) => { const product = catalog.get(id); return {description: product.description, price: product.price, quantity}; });
  const orderNsu = "ALN-" + randomUUID(), expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const payload = {handle, items, order_nsu: orderNsu, redirect_url: new URL(siteUrl).origin + "/pagamento.html", options: {payment_methods_enabled: ["credit_card", "pix"], single_payment: true, valid_until: expiresAt}};
  try {
    const upstream = await fetch("https://api.checkout.infinitepay.io/links", {method: "POST", headers: {"content-type": "application/json", "x-api-key": apiKey}, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000)});
    const result = await upstream.json().catch(() => ({})), checkoutUrl = result.url || result.checkout_url || result.link;
    if (!upstream.ok || typeof checkoutUrl !== "string" || !checkoutUrl.startsWith("https://")) { console.error("InfinitePay checkout link creation failed", {status: upstream.status}); return respond({message: "A InfinitePay não conseguiu criar o link. Tente novamente mais tarde."}, 502); }
    return respond({checkoutUrl, orderNsu});
  } catch (error) { console.error("InfinitePay checkout request failed", error instanceof Error ? error.name : "unknown"); return respond({message: "Não foi possível conectar ao checkout. Tente novamente."}, 502); }
};
