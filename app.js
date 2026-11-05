const PRODUCTS = [
  {id:'fone-bluetooth',name:'Fone Bluetooth Flow',category:'Áudio',tag:'SOM SEM FIO',description:'Som imersivo para todos os momentos.',price:149.90,art:'art-headphones',tone:'audio'},
  {id:'capa-armor',name:'Capa Armor Clear',category:'Proteção',tag:'PROTEÇÃO',description:'Proteção leve com visual transparente.',price:59.90,art:'art-case',tone:'case'},
  {id:'carregador-fast',name:'Carregador Fast 20W',category:'Acessórios',tag:'ESSENCIAL',description:'Energia rápida para acompanhar sua rotina.',price:89.90,art:'art-charger',tone:'charger'},
  {id:'smartphone-one',name:'Smartphone One',category:'Smartphones',tag:'SMARTPHONE',description:'Desempenho e espaço para o seu dia.',price:1299.90,art:'art-phone',tone:'phone'},
  {id:'cabo-usbc',name:'Cabo USB-C Flex',category:'Acessórios',tag:'CONEXÃO',description:'Conexão reforçada para carregar e transferir.',price:39.90,art:'art-cable',tone:'cable'},
  {id:'smartwatch-fit',name:'Smartwatch Fit',category:'Áudio',tag:'DIA A DIA',description:'Seu ritmo, suas informações em um olhar.',price:299.90,art:'art-watch',tone:'watch'}
];
const STORAGE={cart:'alntech-cart-v1',orders:'alntech-orders-v1'};
const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
function normalizeCart(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const known=new Set(PRODUCTS.map(product=>product.id)),clean={};
  for(const [id,quantity] of Object.entries(value))if(known.has(id)&&Number.isInteger(quantity)&&quantity>0)clean[id]=Math.min(quantity,20);
  return clean;
}
let cart=normalizeCart(safeRead(STORAGE.cart,{})), activeCategory='Todos', toastTimer;
const productGrid=document.querySelector('#product-grid');

function showView(name,updateHistory=true){
  const target=document.querySelector(`#view-${name}`);if(!target)return;
  document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view===target));
  document.querySelectorAll('.nav-link').forEach(link=>link.classList.toggle('active',link.dataset.viewLink===name));
  document.querySelector('#main-nav').classList.remove('open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');
  if(updateHistory)history.pushState({view:name},'',`#${name}`);window.scrollTo({top:0,behavior:'smooth'});
  if(name==='acompanhar')renderOrders();
}
function renderProducts(){
  const query=document.querySelector('#product-search').value.trim().toLocaleLowerCase('pt-BR');
  const visible=PRODUCTS.filter(p=>(activeCategory==='Todos'||p.category===activeCategory)&&`${p.name} ${p.category} ${p.description}`.toLocaleLowerCase('pt-BR').includes(query));
  productGrid.innerHTML=visible.length?visible.map(p=>`<article class="product-card"><div class="product-visual tone-${p.tone}"><span class="product-badge">${p.tag}</span><div class="product-art ${p.art}" aria-hidden="true"></div></div><div class="product-info"><div class="product-meta"><span>${p.category}</span><span>ALNTECH PICK</span></div><h2 class="product-name">${p.name}</h2><p class="product-description">${p.description}</p><div class="product-bottom"><span class="product-price">${money.format(p.price)}</span><button class="add-button" data-add="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">+</button></div></div></article>`).join(''):'<div class="orders-empty">Nenhum produto encontrado. Tente outra busca ou categoria.</div>';
}
function cartQty(){return Object.values(cart).reduce((total,qty)=>total+qty,0)}
function renderCart(){
  const entries=Object.entries(cart).filter(([,qty])=>qty>0).map(([id,qty])=>({product:PRODUCTS.find(p=>p.id===id),qty})).filter(x=>x.product);
  const empty=entries.length===0;document.querySelector('#cart-count').textContent=cartQty();document.querySelector('#cart-empty').hidden=!empty;document.querySelector('#cart-footer').hidden=empty;
  document.querySelector('#cart-items').innerHTML=entries.map(({product,qty})=>`<div class="cart-item"><div><b>${product.name}</b><small>${money.format(product.price)} cada</small></div><div class="cart-item-actions"><button data-qty="${product.id}" data-step="-1" aria-label="Remover uma unidade de ${product.name}">−</button><span>${qty}</span><button data-qty="${product.id}" data-step="1" aria-label="Adicionar uma unidade de ${product.name}">+</button></div></div>`).join('');
  const total=entries.reduce((sum,{product,qty})=>sum+product.price*qty,0);document.querySelector('#cart-total').textContent=money.format(total);safeWrite(STORAGE.cart,cart);
}
function openCart(open){const drawer=document.querySelector('#cart-drawer');drawer.classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));document.querySelector('#cart-backdrop').classList.toggle('open',open);document.body.classList.toggle('cart-open',open);if(open)document.querySelector('#close-cart').focus()}
function showToast(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2500)}
function getOrders(){
  const value=safeRead(STORAGE.orders,[]);
  if(!Array.isArray(value))return [];
  const statuses=new Set(['Recebido','Em avaliação','Aguardando aprovação','Em reparo','Pronto para retirada']);
  return value.slice(-200).filter(order=>order&&typeof order==='object'&&/^AT-\d{4}$/.test(order.id||'')&&statuses.has(order.status)&&Number.isFinite(Date.parse(order.createdAt))&&Number.isFinite(Date.parse(order.updatedAt))).map(order=>({id:order.id,customer:String(order.customer||'').slice(0,70),phone:String(order.phone||'').slice(0,22),device:String(order.device||'').slice(0,70),issue:String(order.issue||'').slice(0,500),status:order.status,createdAt:order.createdAt,updatedAt:order.updatedAt}));
}
function setOrders(orders){return safeWrite(STORAGE.orders,orders)}
function renderOrders(){const list=document.querySelector('#orders-list'),orders=getOrders();list.innerHTML=orders.length?orders.slice().reverse().map(order=>`<article class="order-row"><div><strong>${escapeHtml(order.id)} · ${escapeHtml(order.device)}</strong><small>${escapeHtml(order.customer)} · ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</small></div><div><small>${escapeHtml(order.issue)}</small></div><div class="order-controls"><span class="status-pill">${escapeHtml(order.status)}</span><button class="advance-order" data-advance="${escapeHtml(order.id)}">Avançar etapa</button></div></article>`).join(''):'<div class="orders-empty">Nenhuma solicitação de demonstração neste navegador. Abra o formulário para simular o fluxo.</div>'}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function normalizePhone(value){return String(value).replace(/\D/g,'')}
function newOrderId(orders){let id;do{id=`AT-${1000+Math.floor(Math.random()*9000)}`}while(orders.some(order=>order.id===id));return id}
function updateOrderStatus(order){const flow=['Recebido','Em avaliação','Aguardando aprovação','Em reparo','Pronto para retirada'];const index=flow.indexOf(order.status);if(index>=0&&index<flow.length-1){order.status=flow[index+1];order.updatedAt=new Date().toISOString();setOrders(getOrders().map(item=>item.id===order.id?order:item));renderOrders();showToast(`Status de ${order.id} atualizado para “${order.status}”.`)}else showToast('Esta ordem já está pronta para retirada.')}

document.querySelectorAll('[data-view-link]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();showView(link.dataset.viewLink)}));
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.go)));
document.querySelector('#menu-toggle').addEventListener('click',event=>{const nav=document.querySelector('#main-nav'),open=nav.classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',String(open))});
document.querySelector('#category-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;activeCategory=button.dataset.category;document.querySelectorAll('.category-tab').forEach(tab=>tab.classList.toggle('active',tab===button));renderProducts()});
document.querySelector('#product-search').addEventListener('input',renderProducts);
productGrid.addEventListener('click',event=>{const button=event.target.closest('[data-add]');if(!button)return;const current=cart[button.dataset.add]||0;if(current>=20){showToast('Limite demonstrativo de 20 unidades por produto.');return}cart[button.dataset.add]=current+1;renderCart();showToast('Adicionado ao carrinho.')});
document.querySelector('#cart-items').addEventListener('click',event=>{const button=event.target.closest('[data-qty]');if(!button)return;const id=button.dataset.qty,step=Number(button.dataset.step),next=(cart[id]||0)+step;if(next<=0)delete cart[id];else cart[id]=Math.min(next,20);renderCart()});
document.querySelector('#open-cart').addEventListener('click',()=>openCart(true));document.querySelector('#close-cart').addEventListener('click',()=>openCart(false));document.querySelector('#cart-backdrop').addEventListener('click',()=>openCart(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape')openCart(false)});
document.querySelector('#checkout-button').addEventListener('click',async event=>{
  const button=event.currentTarget;
  const items=Object.entries(cart).filter(([,quantity])=>Number.isInteger(quantity)&&quantity>0).map(([id,quantity])=>({id,quantity}));
  if(!items.length){showToast('Seu carrinho está vazio.');return}
  button.disabled=true;button.setAttribute('aria-busy','true');
  const originalLabel=button.innerHTML;button.textContent='Preparando checkout…';
  try{
    const response=await fetch('/.netlify/functions/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.message||'O checkout ainda não está disponível.');
    if(typeof result.checkoutUrl!=='string'||!result.checkoutUrl.startsWith('https://'))throw new Error('A InfinitePay não retornou um link de pagamento válido.');
    window.location.assign(result.checkoutUrl);
  }catch(error){
    showToast(error instanceof TypeError?'Checkout indisponível: publique o site com as funções Netlify e configure os dados de produção.':error.message||'Não foi possível iniciar o pagamento.');
  }finally{
    button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=originalLabel;
  }
});
document.querySelector('#service-form').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget,data=new FormData(form),orders=getOrders();const order={id:newOrderId(orders),customer:String(data.get('customer')).trim(),phone:String(data.get('phone')).trim(),device:String(data.get('device')).trim(),issue:String(data.get('issue')).trim(),status:'Recebido',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};orders.push(order);if(!setOrders(orders)){showToast('Não foi possível guardar a demonstração neste navegador.');return}form.reset();document.querySelector('#service-message').innerHTML=`Demonstração criada. Código local: <strong>${order.id}</strong>. <button type="button" class="text-link" data-track-created="${order.id}">Acompanhar ↗</button>`;document.querySelector('#service-message').querySelector('[data-track-created]').addEventListener('click',()=>{showView('acompanhar');document.querySelector('#track-form [name="orderId"]').value=order.id;document.querySelector('#track-form [name="phone"]').value=order.phone;document.querySelector('#track-form').requestSubmit()});showToast(`Demonstração ${order.id} criada.`)});
document.querySelector('#track-form').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget),id=String(data.get('orderId')).trim().toUpperCase(),phone=normalizePhone(data.get('phone')),order=getOrders().find(item=>item.id.toUpperCase()===id&&normalizePhone(item.phone)===phone),result=document.querySelector('#track-result');if(!order){result.innerHTML='<div class="track-card"><b>Não encontramos essa ordem.</b><span>Confira o código e o telefone informados.</span></div>';return}result.innerHTML=`<div class="track-card"><b>${order.id} · ${escapeHtml(order.device)}</b><span>Status atual: <strong>${escapeHtml(order.status)}</strong></span><span>${escapeHtml(order.issue)}</span><small>Atualizado em ${new Date(order.updatedAt).toLocaleString('pt-BR')}</small></div>`});
document.querySelector('#orders-list').addEventListener('click',event=>{const button=event.target.closest('[data-advance]');if(!button)return;const order=getOrders().find(item=>item.id===button.dataset.advance);if(order)updateOrderStatus(order)});
document.querySelector('#year').textContent=new Date().getFullYear();
renderProducts();renderCart();renderOrders();
const initialView=location.hash.slice(1);if(['inicio','loja','servicos','assistencia','acompanhar'].includes(initialView)&&initialView!=='inicio')showView(initialView,false);
window.addEventListener('popstate',()=>{const view=location.hash.slice(1);showView(['inicio','loja','servicos','assistencia','acompanhar'].includes(view)?view:'inicio',false)});

