/* Interface do projeto. O modo demonstrativo guarda dados apenas no navegador. */
'use strict';
const $ = selector => document.querySelector(selector);
const storageKey = 'bella-agenda-v1';
const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateText = date => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let bookings = [], category = 'Todos', chosenService = 'corte', chosenProfessional = 'ana', chosenTime = '', paymentId = '', cancelId = '', receiptId = '', timer;
const statusNames = { pending: 'Aguardando pagamento', paid: 'Pago · simulação', cancelled: 'Cancelada' };
function notify(message, error = false) {
  clearTimeout(timer); $('#toast').textContent = message; $('#toast').className = `toast${error ? ' error' : ''}`;
  timer = setTimeout(() => $('#toast').classList.add('hidden'), 6000);
}
function readBookings() {
  const raw = localStorage.getItem(storageKey);
  const data = raw ? JSON.parse(raw) : [];
  // Não substitui silenciosamente uma base inválida por outra vazia.
  if (!Array.isArray(data) || data.some(b => !b || typeof b.id !== 'string' || typeof b.name !== 'string' || typeof b.date !== 'string' || typeof b.time !== 'string' || !Bella.services.some(s => s.id === b.serviceId && s.duration === b.duration && s.price === b.price) || !Bella.professionals.some(p => p.id === b.professionalId && p.services.includes(b.serviceId)) || !statusNames[b.status])) throw new Error('Dados locais inválidos. Use outro perfil de navegador para iniciar uma demonstração limpa.');
  return data;
}
function commit(next) {
  localStorage.setItem(storageKey, JSON.stringify(next));
  bookings = next;
}
function refresh() { bookings = readBookings(); }
function detail(label, value) { return `<div class="detail"><span>${label}</span><strong>${escapeHTML(value)}</strong></div>`; }
function renderServices() {
  $('#services').innerHTML = Bella.services.filter(s => category === 'Todos' || s.category === category).map(s => `<button type="button" class="service-card${s.id === chosenService ? ' selected' : ''}" data-service="${s.id}" aria-pressed="${s.id === chosenService}"><span class="service-icon" aria-hidden="true">${s.icon}</span>${s.id === chosenService ? '<span class="selected-check" aria-hidden="true">✓</span>' : ''}<strong>${s.name}</strong><p>${s.description}</p><span class="service-bottom"><span class="duration">◷ ${s.duration} min</span><span class="price">${money(s.price)}</span></span></button>`).join('');
}
function renderProfessionals() {
  $('#professionals').innerHTML = Bella.professionals.filter(p => p.services.includes(chosenService)).map(p => `<button type="button" class="professional-card${p.id === chosenProfessional ? ' selected' : ''}" data-professional="${p.id}" aria-pressed="${p.id === chosenProfessional}"><span class="avatar" aria-hidden="true">${p.initials}</span><span><strong>${p.name}</strong><small>${p.role}</small></span></button>`).join('');
}
function renderSlots() {
  $('#date').min = Bella.localDate();
  const slots = Bella.available(bookings, chosenService, chosenProfessional, $('#date').value);
  if (!slots.includes(chosenTime)) chosenTime = '';
  $('#slots').innerHTML = slots.map(t => `<button type="button" class="slot${t === chosenTime ? ' selected' : ''}" data-time="${t}" aria-pressed="${t === chosenTime}">${t}</button>`).join('');
  $('#slot-message').textContent = slots.length ? '' : 'Nenhum horário disponível nesta data. Aos domingos não há atendimento. Experimente outro dia ou profissional.';
  renderSummary();
}
function renderSummary() {
  const s = Bella.services.find(s => s.id === chosenService), p = Bella.professionals.find(p => p.id === chosenProfessional);
  $('#summary-details').innerHTML = detail('Serviço', s.name) + detail('Profissional', p.name) + detail('Data', $('#date').value ? dateText($('#date').value) : 'Selecione uma data') + detail('Horário', chosenTime ? `${chosenTime} · ${s.duration} min` : 'Selecione um horário');
  $('#total').textContent = money(s.price);
  $('#reserve-btn').disabled = !chosenTime;
}
function renderBookings() {
  const filter = $('#booking-filter').value;
  const list = bookings.filter(b => filter === 'all' || b.status === filter).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  $('#nav-count').textContent = bookings.filter(b => b.status !== 'cancelled' && new Date(b.date + 'T' + b.time) > new Date()).length;
  $('#reservation-count').textContent = `${list.length} reserva${list.length === 1 ? '' : 's'}`;
  if (!list.length) { $('#bookings').innerHTML = `<div class="empty-state"><div class="mini-flower" aria-hidden="true">b.</div><h2>${filter === 'all' ? 'Seu momento ainda está por vir' : 'Nenhuma reserva neste filtro'}</h2><p>${filter === 'all' ? 'Encontre um cuidado e reserve seu primeiro horário.' : 'Altere o filtro para consultar suas outras reservas.'}</p>${filter === 'all' ? '<a href="#agenda" class="primary">Escolher um serviço</a>' : ''}</div>`; return; }
  $('#bookings').innerHTML = list.map(b => {
    const s = Bella.services.find(s => s.id === b.serviceId), p = Bella.professionals.find(p => p.id === b.professionalId);
    const future = new Date(b.date + 'T' + b.time) > new Date();
    return `<article class="reservation"><div class="reservation-header"><h2>${s.name}</h2><span class="badge ${b.status}">${statusNames[b.status]}</span></div><p>${escapeHTML(b.name)} · ${p.name}<br>${dateText(b.date)} às ${b.time} · ${b.duration} minutos${!future ? '<br>Horário passado' : ''}</p><div class="reservation-bottom"><strong>${money(b.price)}</strong>${b.status === 'pending' && future ? `<button class="primary" data-pay="${b.id}">Pagar (simulação)</button>` : ''}${b.payment ? `<button class="secondary" data-receipt="${b.id}">Comprovante</button>` : ''}${b.status !== 'cancelled' && future ? `<button class="secondary" data-cancel="${b.id}">Cancelar</button>` : ''}</div></article>`;
  }).join('');
}
function route() {
  const reservations = location.hash === '#reservas';
  $('#agenda-view').classList.toggle('hidden', reservations); $('#reservas-view').classList.toggle('hidden', !reservations);
  $('#nav-agenda').classList.toggle('active', !reservations); $('#nav-reservas').classList.toggle('active', reservations);
  $('#nav-agenda').toggleAttribute('aria-current', !reservations); $('#nav-reservas').toggleAttribute('aria-current', reservations);
  try { refresh(); renderSlots(); renderBookings(); } catch (error) { notify(error.message, true); }
}
function errorMessage(error) { notify(error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? 'Não foi possível salvar. Habilite o armazenamento do navegador e tente novamente.' : error.message, true); }
$('#services').addEventListener('click', event => {
  const button = event.target.closest('[data-service]'); if (!button) return;
  chosenService = button.dataset.service;
  if (!Bella.professionals.find(p => p.id === chosenProfessional).services.includes(chosenService)) chosenProfessional = Bella.professionals.find(p => p.services.includes(chosenService)).id;
  chosenTime = ''; renderServices(); renderProfessionals(); renderSlots();
});
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', b === button); });
  if (category !== 'Todos' && Bella.services.find(s => s.id === chosenService).category !== category) {
    chosenService = Bella.services.find(s => s.category === category).id;
    chosenProfessional = Bella.professionals.find(p => p.services.includes(chosenService)).id;
    chosenTime = ''; renderProfessionals(); renderSlots();
  }
  renderServices();
}));
$('#professionals').addEventListener('click', event => { const button = event.target.closest('[data-professional]'); if (!button) return; chosenProfessional = button.dataset.professional; chosenTime = ''; renderProfessionals(); renderSlots(); });
$('#date').addEventListener('change', () => { chosenTime = ''; renderSlots(); });
$('#slots').addEventListener('click', event => { const button = event.target.closest('[data-time]'); if (!button) return; chosenTime = button.dataset.time; renderSlots(); });
$('#booking-form').addEventListener('submit', async event => {
  event.preventDefault();
  // Web Locks serializa gravações entre abas quando disponível (HTTP/HTTPS).
  const reserve = () => {
    refresh();
    const booking = Bella.createBooking(bookings, { name: $('#customer-name').value, serviceId: chosenService, professionalId: chosenProfessional, date: $('#date').value, time: chosenTime });
    commit([...bookings, booking]); chosenTime = ''; $('#booking-filter').value = 'all'; location.hash = 'reservas'; route();
    notify('Reserva confirmada! Seu horário está reservado.');
  };
  try { if (navigator.locks) await navigator.locks.request(storageKey, reserve); else reserve(); }
  catch (error) { errorMessage(error); try { refresh(); renderSlots(); } catch {} }
});
$('#booking-filter').addEventListener('change', renderBookings);
$('#bookings').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  try {
    refresh();
    if (button.dataset.pay) {
      paymentId = button.dataset.pay; const b = bookings.find(b => b.id === paymentId);
      if (!b || b.status !== 'pending') { renderBookings(); return; }
      $('#payment-details').innerHTML = `<p>${Bella.services.find(s => s.id === b.serviceId).name} · ${dateText(b.date)} às ${b.time}</p><strong>${money(b.price)}</strong>`;
      $('#payment-dialog').showModal();
    } else if (button.dataset.cancel) { cancelId = button.dataset.cancel; $('#cancel-dialog').showModal(); }
    else if (button.dataset.receipt) { receiptId = button.dataset.receipt; showReceipt(); }
  } catch (error) { errorMessage(error); }
});
async function mutateBooking(id, transform) {
  const update = () => {
    refresh(); const b = bookings.find(b => b.id === id); if (!b) throw new Error('Reserva não encontrada.');
    const updated = transform(b); commit(bookings.map(item => item.id === id ? updated : item)); renderBookings(); renderSlots();
  };
  if (navigator.locks) await navigator.locks.request(storageKey, update); else update();
}
$('#payment-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter; button.disabled = true;
  try { await mutateBooking(paymentId, b => Bella.payBooking(b, new FormData(event.target).get('method'))); $('#payment-dialog').close(); receiptId = paymentId; showReceipt(); notify('Pagamento simulado aprovado. Comprovante disponível.'); }
  catch (error) { errorMessage(error); }
  finally { button.disabled = false; }
});
$('#confirm-cancel').addEventListener('click', async () => {
  try { await mutateBooking(cancelId, b => Bella.cancelBooking(b)); $('#cancel-dialog').close(); notify('Reserva cancelada. O horário foi liberado.'); }
  catch (error) { errorMessage(error); }
});
function receiptText() {
  const b = bookings.find(b => b.id === receiptId);
  if (!b?.payment) throw new Error('Comprovante não encontrado.');
  return `BELLA AGENDA — COMPROVANTE DEMONSTRATIVO\n\nReserva: ${b.id}\nCliente: ${b.name}\nServiço: ${Bella.services.find(s => s.id === b.serviceId).name}\nProfissional: ${Bella.professionals.find(p => p.id === b.professionalId).name}\nAtendimento: ${dateText(b.date)} às ${b.time}\nValor: ${money(b.payment.amount)}\nForma: ${b.payment.method === 'pix' ? 'Pix simulado' : 'Cartão simulado'}\nAprovação: ${new Date(b.payment.paidAt).toLocaleString('pt-BR')}\nStatus da reserva: ${statusNames[b.status]}\n\nSIMULAÇÃO ACADÊMICA. Sem cobrança real e sem valor fiscal.`;
}
function showReceipt() { $('#receipt-content').innerHTML = '<div class="receipt-success">✓ Simulação aprovada</div><div class="receipt-lines"></div>'; $('#receipt-content .receipt-lines').textContent = receiptText(); $('#receipt-dialog').showModal(); }
$('#download-receipt').addEventListener('click', () => {
  try { const blob = new Blob(['\uFEFF' + receiptText()], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `comprovante-${receiptId}.txt`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  catch (error) { errorMessage(error); }
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
$('#about-btn').addEventListener('click', () => $('#about-dialog').showModal());
window.addEventListener('hashchange', route);
window.addEventListener('storage', event => { if (event.key === storageKey || event.key === null) route(); });
window.addEventListener('focus', route);
// Atualiza também horários que acabaram de passar com a página aberta.
setInterval(() => { try { refresh(); renderSlots(); renderBookings(); } catch {} }, 60000);
let initialDate = new Date(); if (initialDate.getDay() === 0) initialDate.setDate(initialDate.getDate() + 1);
$('#date').value = Bella.localDate(initialDate);
renderServices(); renderProfessionals(); route();
