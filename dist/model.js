/* Regras de negócio compartilhadas pela interface e pelos testes. */
(function (root) {
  'use strict';
  const services = [
    { id: 'corte', name: 'Corte de cabelo', category: 'Cabelo', duration: 60, price: 8000, icon: '✂', description: 'Um novo corte, do seu jeito.' },
    { id: 'escova', name: 'Escova & finalização', category: 'Cabelo', duration: 45, price: 6000, icon: '◌', description: 'Leveza e movimento para os fios.' },
    { id: 'manicure', name: 'Manicure', category: 'Unhas', duration: 45, price: 3500, icon: '✧', description: 'Cuidado em cada detalhe.' },
    { id: 'pedicure', name: 'Pedicure', category: 'Unhas', duration: 60, price: 4500, icon: '❋', description: 'Uma pausa para cuidar de você.' }
  ];
  const professionals = [
    { id: 'ana', name: 'Ana Oliveira', initials: 'AO', role: 'Cabeleireira', services: ['corte', 'escova'] },
    { id: 'julia', name: 'Júlia Santos', initials: 'JS', role: 'Cabeleireira', services: ['corte', 'escova'] },
    { id: 'beatriz', name: 'Beatriz Lima', initials: 'BL', role: 'Manicure e pedicure', services: ['manicure', 'pedicure'] },
    { id: 'camila', name: 'Camila Costa', initials: 'CC', role: 'Manicure e pedicure', services: ['manicure', 'pedicure'] }
  ];
  function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function minutes(time) {
    if (!/^\d{2}:\d{2}$/.test(time)) return NaN;
    const [h, m] = time.split(':').map(Number);
    return h < 24 && m < 60 ? h * 60 + m : NaN;
  }
  function timeLabel(value) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
  function validDay(date, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const d = new Date(date + 'T12:00:00');
    return !isNaN(d) && localDate(d) === date && date >= localDate(now) && d.getDay() !== 0;
  }
  function available(bookings, serviceId, professionalId, date, now = new Date()) {
    const service = services.find(s => s.id === serviceId);
    const professional = professionals.find(p => p.id === professionalId);
    if (!service || !professional?.services.includes(serviceId) || !validDay(date, now)) return [];
    const slots = [];
    for (let start = 9 * 60; start + service.duration <= 18 * 60; start += 15) {
      const time = timeLabel(start);
      if (new Date(date + 'T' + time) <= now) continue;
      // Intervalos que apenas encostam são permitidos; sobreposições são bloqueadas.
      const busy = bookings.some(b => b.status !== 'cancelled' && b.professionalId === professionalId && b.date === date && start < minutes(b.time) + b.duration && start + service.duration > minutes(b.time));
      if (!busy) slots.push(time);
    }
    return slots;
  }
  function createBooking(bookings, input, now = new Date()) {
    const name = String(input.name || '').trim();
    if (name.length < 2 || name.length > 80) throw new Error('Informe um nome entre 2 e 80 caracteres.');
    if (!available(bookings, input.serviceId, input.professionalId, input.date, now).includes(input.time)) throw new Error('Este horário não está disponível. Escolha outro horário.');
    const service = services.find(s => s.id === input.serviceId);
    return { id: globalThis.crypto?.randomUUID?.() || `res-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, serviceId: service.id, professionalId: input.professionalId, date: input.date, time: input.time, duration: service.duration, price: service.price, status: 'pending', createdAt: now.toISOString(), payment: null };
  }
  function payBooking(booking, method, now = new Date()) {
    if (booking.status !== 'pending') throw new Error('Somente reservas aguardando pagamento podem ser pagas.');
    if (new Date(booking.date + 'T' + booking.time) <= now) throw new Error('Este atendimento já começou. Faça uma nova reserva.');
    if (!['pix', 'card'].includes(method)) throw new Error('Escolha uma forma de pagamento.');
    return { ...booking, status: 'paid', payment: { method, paidAt: now.toISOString(), amount: booking.price, simulation: true } };
  }
  function cancelBooking(booking, now = new Date()) {
    if (booking.status === 'cancelled') throw new Error('Esta reserva já foi cancelada.');
    if (new Date(booking.date + 'T' + booking.time) <= now) throw new Error('Só é possível cancelar antes do atendimento.');
    return { ...booking, status: 'cancelled', cancelledAt: now.toISOString() };
  }
  const api = { services, professionals, localDate, available, createBooking, payBooking, cancelBooking, timeLabel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Bella = api;
})(globalThis);
