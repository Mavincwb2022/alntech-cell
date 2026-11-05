# ALNTECH CELL

Site institucional e catálogo da ALNTECH CELL, com fluxo inicial de assistência e integração preparada para checkout hospedado da InfinitePay.

## Funcionalidades

- Site institucional com serviços, diferenciais e chamadas para contato.
- Catálogo com busca, categorias e carrinho. Os itens e preços atuais são exemplos e não representam oferta comercial confirmada.
- Funções Netlify para gerar link de checkout InfinitePay usando preços do servidor, sem confiar nos valores enviados pelo navegador.
- Página de retorno que consulta a InfinitePay antes de exibir um pagamento como confirmado.
- Painel de assistência para abrir ordens de serviço, consultar status e avançar etapas.
- Layout responsivo para celular e desktop.

## Publicação

Este projeto foi criado como site estático e o histórico do repositório mostra publicação por GitHub Pages. GitHub Pages não executa as funções em `netlify/functions`. Para usar checkout real, publique no Netlify. O arquivo `netlify.toml` já define o comando `node build-site.mjs`, a pasta publicada `dist` e as funções em `netlify/functions`. Configure as variáveis descritas em `.env.example` no painel do Netlify.

O servidor só cria cobranças quando `CHECKOUT_ENABLED=true`, há uma `INFINITEPAY_API_KEY` e a `INFINITEPAY_HANDLE` da mesma conta ALNTECH CELL e `PRODUCT_CATALOG_JSON` contém produtos e preços reais validados. Mantenha `INFINITEPAY_API_KEY` apenas como segredo de ambiente no Netlify; nunca a coloque em `app.js`, `index.html`, GitHub ou mensagens. Uma chave Pix de recebimento não substitui a chave API. O comprador escolhe Pix no checkout hospedado da InfinitePay; não é necessário expor uma chave Pix no site.

As funções enviam à InfinitePay descrição dos itens, quantidades, valores e identificador do pedido. Os links são configurados para Pix e cartão, pagamento único e expiração em 24 horas. O comprador é encaminhado ao checkout hospedado pela InfinitePay.

### Configuração necessária antes de ativar vendas

1. Confirme catálogo, preços em centavos, disponibilidade, entrega/retirada, contato e políticas comerciais.
2. Habilite o Checkout Integrado e crie uma chave na conta InfinitePay da ALNTECH CELL.
3. Cadastre `SITE_URL`, `INFINITEPAY_HANDLE`, `INFINITEPAY_API_KEY` e `PRODUCT_CATALOG_JSON` nas variáveis do Netlify.
4. Revise a publicação e faça um pagamento real de teste somente com autorização do responsável pela conta. A InfinitePay informa que não oferece sandbox e que o teste gera uma cobrança real.
5. Ative `CHECKOUT_ENABLED=true` somente após confirmar esses passos.

As ordens de assistência ainda ficam no `localStorage` do navegador e não são compartilhadas entre visitantes ou dispositivos. O painel local não é um sistema comercial de atendimento.

## Limites atuais

A página Serviços descreve categorias gerais de avaliação e reparo, sem garantir disponibilidade, prazo ou preço. O formulário de assistência e o acompanhamento são apenas demonstrações locais; não enviam dados à equipe, não criam ordens reais e não devem ser usados para clientes até existir backend seguro, responsável pelo tratamento e regras de retenção.

O checkout fica bloqueado por padrão. Ainda é necessário configurar o domínio de produção, a chave InfinitePay, o catálogo real, regras de entrega, dados empresariais e políticas de privacidade/devolução. Não há estoque integrado, cálculo de frete, painel de pedidos, notificações de pagamento ou administração segura das ordens de serviço.

## Estrutura

- `index.html`: conteúdo e áreas da aplicação.
- `styles.css`: identidade visual e responsividade.
- `app.js`: navegação, catálogo, carrinho e fluxo de ordens de serviço.
- `netlify/functions/`: criação de checkout e confirmação de pagamento no servidor.
- `pagamento.html` / `pagamento.js`: retorno e confirmação do pagamento.
- `netlify.toml`: publicação do site e das funções no Netlify.

