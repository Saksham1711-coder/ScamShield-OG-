const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../app/src/main/assets/web/engine.js');
const request = overrides => ({ id: 'demo-test-001', recipientId: 'maya', amount: '100', context: 'Lunch yesterday', clues: [], reviewed: true, ...overrides });

test('a familiar fictional recipient with ordinary context has lower risk, not a safety guarantee', () => {
  const result = E.evaluate('maya', 'Lunch yesterday', [], []);
  assert.equal(result.level, 'lower'); assert.equal(result.blocked, false); assert.equal(result.reasons.length, 0);
});
test('new seller, sample report and urgent context produce medium risk', () => {
  const result = E.evaluate('alex', 'Pay immediately to reserve the used desk.', [], []);
  assert.equal(result.level, 'medium'); assert.equal(result.score, 52);
});
test('threat, urgency and secrecy escalate even a familiar recipient to blocked high risk', () => {
  const result = E.evaluate('maya', 'Urgent, your account is locked. Do not tell anyone.', [], []);
  assert.equal(result.level, 'high'); assert.equal(result.blocked, true);
  assert.deepEqual(result.reasons.map(r => r.id), ['urgency', 'threat', 'secrecy']);
});
test('fake support is blocked on directory signals even with no message', () => {
  assert.equal(E.evaluate('support', '', [], []).blocked, true);
});
test('guaranteed return and unusual payment signals work independently of capitalization', () => {
  const result = E.evaluate('maya', 'GUARANTEED double profits in BITCOIN', [], []);
  assert.equal(result.level, 'medium'); assert.equal(result.score, 58);
});
test('explicit clues are counted once even when also present in text', () => {
  const result = E.evaluate('maya', 'Act now', ['urgency'], []);
  assert.equal(result.score, 22); assert.equal(result.reasons.length, 1);
});
test('local reports influence a subsequent assessment without multiplying the score', () => {
  const reports = [{ recipientId: 'maya' }, { recipientId: 'maya' }];
  assert.equal(E.evaluate('maya', '', [], reports).score, 15);
});
test('unknown recipient cannot be assessed or paid', () => {
  assert.throws(() => E.evaluate('unknown', '', [], []), /Choose a recipient/);
  assert.throws(() => E.transfer(E.initialState(), request({ recipientId: 'unknown' })), /Choose a recipient/);
});
test('wallet accepts positive whole numbers only', () => {
  for (const amount of ['', ' ', '0', 0, '-1', '1.1', '1e2', Infinity, NaN, null, true, [], '9007199254740992', ' 1']) assert.equal(E.validAmount(amount), false, String(amount));
  for (const amount of ['1', 100, '1000']) assert.equal(E.validAmount(amount), true);
});
test('completed payment conserves points and does not mutate previous state', () => {
  const before = E.initialState(), after = E.transfer(before, request());
  assert.equal(after.balance, 900); assert.equal(after.receipts.length, 1); assert.equal(before.balance, 1000); assert.equal(before.receipts.length, 0); assert.equal(E.validateState(after), true);
});
test('a transaction reference can only be spent once', () => {
  const after = E.transfer(E.initialState(), request());
  assert.throws(() => E.transfer(after, request()), /already been completed/); assert.equal(after.balance, 900);
});
test('insufficient balance and missing review never change the wallet', () => {
  const before = E.initialState();
  assert.throws(() => E.transfer(before, request({ amount: '1001' })), /Not enough/);
  assert.throws(() => E.transfer(before, request({ reviewed: false })), /Review the recipient/);
  assert.equal(before.balance, 1000); assert.equal(before.receipts.length, 0);
});
test('high risk is recomputed on submission and cannot use a forged risk result', () => {
  assert.throws(() => E.transfer(E.initialState(), request({ recipientId: 'support', risk: { level: 'lower' } })), /blocked/);
  assert.throws(() => E.transfer(E.initialState(), request({ context: 'Urgent. Arrest. Do not tell anyone.' })), /blocked/);
});
test('exact-balance transfer is allowed, next transfer is not', () => {
  const after = E.transfer(E.initialState(), request({ amount: '1000' }));
  assert.equal(after.balance, 0); assert.equal(E.validateState(after), true);
  assert.throws(() => E.transfer(after, request({ id: 'second', amount: '1' })), /Not enough/);
});
test('corrupted or forged persisted states fail validation', () => {
  for (const value of [null, {}, { ...E.initialState(), balance: 999 }, { ...E.initialState(), receipts: [{}] }, { ...E.initialState(), reports: [{}] }, { ...E.initialState(), balance: -1 }]) assert.equal(E.validateState(value), false);
  const after = E.transfer(E.initialState(), request());
  assert.equal(E.validateState({ ...after, receipts: [after.receipts[0], after.receipts[0]] }), false);
  assert.throws(() => E.transfer({ ...after, balance: 1000 }, request({ id: 'second' })), /could not be validated/);
});
test('JSON persistence round trip retains ledger and reports', () => {
  let state = E.transfer(E.initialState(), request());
  state.reports.push({ recipientId: 'alex', reason: 'Fictional urgency', date: new Date().toISOString() });
  state.learned.push('pressure'); state.quizCompleted = true;
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(E.validateState(restored), true); assert.deepEqual(restored, state);
});

test('parses a UPI QR link', () => {
  const u = E.parseUpi('upi://pay?pa=Ramesh@oksbi&pn=Ramesh%20Gupta&am=500');
  assert.deepEqual([u.vpa, u.name, u.amount, u.kind], ['ramesh@oksbi', 'Ramesh Gupta', '500', 'pay']);
  assert.equal(E.parseUpi('mail me at a@gmail.com'), null);
});
test('fake KYC collect request is high risk', () => {
  const r = E.checkScan({ text: 'upi://collect?pa=kyc.help@oksbi&pn=Bank Helpdesk&am=2000 KYC update, account will be blocked' });
  assert.equal(r.level, 'high');
});
test('ordinary shop QR is lower risk and name mismatch is flagged', () => {
  const t = 'upi://pay?pa=sharma@okaxis&pn=Sharma Stores&am=300';
  assert.equal(E.checkScan({ text: t, expected: 'Sharma' }).level, 'lower');
  assert.ok(E.checkScan({ text: t, expected: 'Ramesh Gupta' }).reasons.some(x => x.id === 'mismatch'));
});
test('Hinglish pressure and pay-to-receive are caught', () => {
  assert.notEqual(E.checkScan({ text: 'turant paise bhejo, kisi ko mat batana' }).level, 'lower');
  assert.ok(E.checkScan({ text: 'Refund ready, scan this QR and enter PIN' }).reasons.some(x => x.id === 'receive'));
});

test('new UPI ID is linked to an earlier report by phone number or wording', () => {
  const r = E.checkScan({ reports: E.sampleReports, text: 'Pay to fresh.id@ybl or call 98000 00000 / 9000011111 to finish' });
  assert.ok(r.reasons.some(x => x.id === 'reported'));
  const w = E.checkScan({ reports: E.sampleReports, text: 'Your refund of 7000 is ready. Scan this QR and enter your UPI PIN to receive the money' });
  assert.ok(w.reasons.some(x => x.id === 'reported'));
  assert.equal(E.checkScan({ reports: E.sampleReports, text: 'Lunch split, 250 rupees' }).reasons.some(x => x.id === 'reported'), false);
});

test('UPI Lab: risk model ranks payees sensibly and blocks the fake helpdesk', () => {
  const p = id => E.simulateUpi({ payeeId: id, amount: 500, note: '' }).p;
  assert.ok(p('maya') < 0.3 && p('imran') < 0.3, 'friend and busy legitimate shop are allowed');
  assert.ok(p('maya') < p('alex') && p('alex') < p('vikram') && p('vikram') < p('support'));
  assert.equal(E.simulateUpi({ payeeId: 'support', amount: 500, note: 'Urgent, account blocked' }).decision, 'decline');
  assert.equal(E.simulateUpi({ payeeId: 'maya', amount: 20000, note: '' }).decision, 'failed');
});
