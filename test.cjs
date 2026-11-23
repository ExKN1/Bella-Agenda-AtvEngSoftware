/* Testes das regras de negócio: executar com node test.cjs. */
const assert = require('node:assert/strict');
const B = require('./dist/model.js');
const now = new Date('2030-01-07T08:00:00'); // Segunda-feira, horário local.
const input = { name: 'Cliente de teste', serviceId: 'corte', professionalId: 'ana', date: '2030-01-07', time: '10:00' };
let count = 0;
function test(name, fn) { fn(); console.log('OK ' + name); count++; }
const first = B.createBooking([], input, now);
test('Agenda respeita abertura e duração até o fechamento', () => { const times = B.available([], 'corte', 'ana', input.date, now); assert.equal(times[0], '09:00'); assert.equal(times.at(-1), '17:00'); });
test('Reserva mantém preço e duração do catálogo', () => { assert.equal(first.price, 8000); assert.equal(first.duration, 60); assert.equal(first.status, 'pending'); });
test('Bloqueia horários sobrepostos e permite intervalos adjacentes', () => { const slots = B.available([first], 'escova', 'ana', input.date, now); assert(!slots.includes('09:30')); assert(!slots.includes('10:45')); assert(slots.includes('09:15')); assert(slots.includes('11:00')); });
test('Rejeita dupla reserva mesmo antes do pagamento', () => assert.throws(() => B.createBooking([first], input, now), /disponível/));
test('Permite o mesmo horário com outro profissional', () => assert(B.available([first], 'corte', 'julia', input.date, now).includes('10:00')));
test('Rejeita profissional sem especialidade adequada', () => assert.throws(() => B.createBooking([], { ...input, professionalId: 'beatriz' }, now)));
test('Rejeita domingo, data passada e data inexistente', () => { for (const date of ['2030-01-06', '2030-01-13', '2030-02-31']) assert.equal(B.available([], 'corte', 'ana', date, now).length, 0); });
test('Rejeita horário passado, fora da grade e fora do expediente', () => { for (const time of ['08:00', '10:07', '17:15', '25:00']) assert.throws(() => B.createBooking([], { ...input, time }, now)); assert.throws(() => B.createBooking([], input, new Date('2030-01-07T10:01:00'))); });
test('Valida nome obrigatório', () => assert.throws(() => B.createBooking([], { ...input, name: ' ' }, now), /nome/));
const paid = B.payBooking(first, 'pix', now);
test('Pagamento Pix registra valor e marca simulação', () => { assert.equal(paid.status, 'paid'); assert.equal(paid.payment.amount, 8000); assert.equal(paid.payment.simulation, true); });
test('Pagamento por cartão também funciona', () => assert.equal(B.payBooking(first, 'card', now).payment.method, 'card'));
test('Impede pagamento duplicado ou método inválido', () => { assert.throws(() => B.payBooking(paid, 'pix', now)); assert.throws(() => B.payBooking(first, 'cash', now)); });
const cancelled = B.cancelBooking(paid, now);
test('Cancelar libera a vaga e preserva histórico', () => { assert.equal(cancelled.status, 'cancelled'); assert.equal(cancelled.payment.amount, 8000); assert(B.available([cancelled], 'corte', 'ana', input.date, now).includes('10:00')); });
test('Reserva cancelada não pode ser paga ou cancelada novamente', () => { assert.throws(() => B.payBooking(cancelled, 'pix', now)); assert.throws(() => B.cancelBooking(cancelled, now)); });
test('Atendimento iniciado não aceita pagamento nem cancelamento', () => { const later = new Date('2030-01-07T11:00:00'); assert.throws(() => B.payBooking(first, 'pix', later)); assert.throws(() => B.cancelBooking(first, later)); });
test('Dados persistidos em JSON preservam bloqueio da vaga', () => { const restored = JSON.parse(JSON.stringify([paid])); assert(!B.available(restored, 'corte', 'ana', input.date, now).includes('10:00')); });
console.log(`\n${count} testes aprovados.`);
