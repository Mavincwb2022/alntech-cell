const respond = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {"content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff"}});
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
export default async (request) => {
  if (request.method !== "POST") return respond({message: "Método não permitido."}, 405);
  const origin = request.headers.get("origin"), siteUrl = process.env.SITE_URL;
  if (!siteUrl || !origin || origin !== new URL(siteUrl).origin) return respond({message: "Origem inválida para consultar o pagamento."}, 403);
  const handle = process.env.INFINITEPAY_HANDLE?.trim();
  if (!handle || !/^[a-z0-9._-]{1,64}$/i.test(handle)) return respond({message: "Handle da InfinitePay ainda não configurada."}, 503);
  const apiKey = process.env.INFINITEPAY_API_KEY?.trim();
  if (!apiKey?.startsWith("inchk_")) return respond({message: "Confirmação de pagamento ainda não configurada."}, 503);
  let body;
  try { body = await request.json(); } catch { return respond({message: "Dados de confirmação inválidos."}, 400); }
  if (!isRecord(body) || typeof body.order_nsu !== "string" || !/^ALN-[0-9a-f-]{36}$/i.test(body.order_nsu) || typeof body.transaction_nsu !== "string" || !/^[0-9a-f-]{16,80}$/i.test(body.transaction_nsu) || typeof body.slug !== "string" || !/^[a-z0-9-]{1,100}$/i.test(body.slug)) return respond({message: "Parâmetros de pagamento incompletos."}, 400);
  try {
    const upstream = await fetch("https://api.checkout.infinitepay.io/payment_check", {
      method: "POST",
      headers: {"content-type": "application/json", "x-api-key": apiKey},
      body: JSON.stringify({handle, order_nsu: body.order_nsu, transaction_nsu: body.transaction_nsu, slug: body.slug}),
      signal: AbortSignal.timeout(10000),
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok || result.success !== true) return respond({paid: false, message: "Não foi possível confirmar este pagamento."}, 502);
    return respond({paid: result.paid === true, amount: Number.isSafeInteger(result.amount) ? result.amount : null, paidAmount: Number.isSafeInteger(result.paid_amount) ? result.paid_amount : null, installments: Number.isInteger(result.installments) ? result.installments : null, method: typeof result.capture_method === "string" ? result.capture_method : null});
  } catch (error) {
    console.error("InfinitePay payment check failed", error instanceof Error ? error.name : "unknown");
    return respond({paid: false, message: "Não foi possível consultar o pagamento agora."}, 502);
  }
};
