const title = document.querySelector('#payment-title');
const message = document.querySelector('#payment-message');
const params = new URLSearchParams(location.search);
const confirmation = {
  order_nsu: params.get('order_nsu'),
  transaction_nsu: params.get('transaction_nsu'),
  slug: params.get('slug'),
};

async function confirmPayment() {
  if (!confirmation.order_nsu || !confirmation.transaction_nsu || !confirmation.slug) {
    title.textContent = 'Não recebemos os dados de confirmação';
    message.textContent = 'Confira o status do pedido diretamente com a ALNTECH CELL antes de fazer outro pagamento.';
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/payment-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmation),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.paid !== 'boolean') throw new Error();
    if (result.paid) {
      title.textContent = 'Pagamento confirmado';
      const total = Number.isInteger(result.paidAmount) ? result.paidAmount : result.amount;
      message.textContent = `A InfinitePay confirmou o pedido ${confirmation.order_nsu}${Number.isInteger(total) ? ` no valor de ${(total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}. Guarde este código para falar com a ALNTECH CELL.`;
    } else {
      title.textContent = 'Pagamento ainda não confirmado';
      message.textContent = 'A InfinitePay não informou um pagamento aprovado para este pedido. Confira o aplicativo da InfinitePay antes de tentar novamente.';
    }
  } catch {
    title.textContent = 'Não foi possível confirmar agora';
    message.textContent = 'Não faça outro pagamento ainda. Confira o status na InfinitePay e tente consultar este retorno novamente mais tarde.';
  }
}

confirmPayment();
