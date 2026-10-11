/* Pure, reusable demo risk and wallet logic. No network or banking integration. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShieldEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const recipients = [
    { id: 'maya', name: 'Ananya Iyer', handle: 'ananya.iyer@demobank', initials: 'AI', ageDays: 730, reports: 0, identity: 'Name matches bank record (simulated)', mismatch: false, color: 'mint' },
    { id: 'harbor', name: 'Sharma Book Depot', handle: 'sharmabooks@demobank', initials: 'SB', ageDays: 365, reports: 0, identity: 'Merchant listed in simulated directory', mismatch: false, color: 'blue' },
    { id: 'priya', name: 'Priya Nair', handle: 'priya.nair@demobank', initials: 'PN', ageDays: 1400, reports: 0, identity: 'Name matches bank record (simulated)', mismatch: false, color: 'mint' },
    { id: 'imran', name: 'Qureshi Kirana Store', handle: 'qureshi.kirana@demobank', initials: 'QK', ageDays: 900, reports: 0, identity: 'Merchant listed in simulated directory', mismatch: false, color: 'blue' },
    { id: 'deepak', name: 'Deepak Joshi (Plumber)', handle: 'deepak.joshi@demobank', initials: 'DJ', ageDays: 500, reports: 0, identity: 'Name matches bank record (simulated)', mismatch: false, color: 'mint' },
    { id: 'sunita', name: 'Sunita Devi', handle: 'sunita.devi@demobank', initials: 'SD', ageDays: 45, reports: 0, identity: 'Name matches bank record (simulated)', mismatch: false, color: 'amber' },
    { id: 'alex', name: 'Rohit Verma (OLX seller)', handle: 'rohit.quick@demobank', initials: 'RV', ageDays: 12, reports: 1, identity: 'No match in simulated directory', mismatch: false, color: 'amber' },
    { id: 'vikram', name: 'Vikram Profit Tips', handle: 'vikram.tips@demobank', initials: 'VP', ageDays: 9, reports: 4, identity: 'No match in simulated directory', mismatch: false, color: 'amber' },
    { id: 'support', name: 'Bank KYC Helpdesk', handle: 'kyc.helpdesk@demobank', initials: 'KH', ageDays: 2, reports: 7, identity: 'Name mismatch in simulated directory', mismatch: true, color: 'pink' }
  ];
  const clues = [
    { id: 'urgency', label: 'Pressure to act now', weight: 22, words: /\b(urgent|immediately|hurry|right now|today only|act now|minutes|expires?)\b/i, advice: 'Pause. Pressure can stop you from checking the story.' },
    { id: 'threat', label: 'Threat or account scare', weight: 32, words: /\b(arrest|police|suspend(?:ed)?|locked|freeze|frozen|legal action|penalty|threat)\b/i, advice: 'Contact the organization through a number or app you already trust.' },
    { id: 'guarantee', label: 'Guaranteed reward or return', weight: 28, words: /\b(guaranteed|double|risk.free|profit|winner|prize|lottery)\b/i, advice: 'A promised reward is not proof. Verify the offer independently.' },
    { id: 'secrecy', label: 'Request for secrecy', weight: 30, words: /\b(secret|do not tell|don.t tell|keep quiet|confidential|tell no one)\b/i, advice: 'Talk to someone you trust before taking any action.' },
    { id: 'unusual', label: 'Unusual payment or sensitive access', weight: 30, words: /\b(gift cards?|crypto|bitcoin|password|otp|one.time code|remote access|screen shar(?:e|ing)|safe account)\b/i, advice: 'Do not share security codes or transfer money to a supposed safe account.' }
  ];
  function evaluate(recipientId, context, selected, localReports) {
    const recipient = recipients.find(r => r.id === recipientId);
    if (!recipient) throw new Error('Choose a recipient from the demo directory.');
    const reasons = [];
    if (recipient.ageDays < 30) reasons.push({ id: 'new', label: 'Recently created demo profile', weight: 15, advice: 'A new profile needs more independent checking.' });
    if (recipient.reports > 0 || (localReports || []).some(r => r.recipientId === recipientId)) reasons.push({ id: 'reports', label: 'Reports associated with this demo profile', weight: recipient.reports >= 3 ? 35 : 15, advice: 'Reports are unverified signals, not proof of wrongdoing.' });
    if (recipient.mismatch) reasons.push({ id: 'mismatch', label: 'Recipient name does not match', weight: 35, advice: 'Stop and check the intended recipient using a trusted channel.' });
    clues.forEach(c => { if ((selected || []).includes(c.id) || c.words.test(context || '')) reasons.push({ ...c }); });
    const score = Math.min(100, reasons.reduce((sum, r) => sum + r.weight, 0));
    const level = score >= 60 ? 'high' : score >= 25 ? 'medium' : 'lower';
    return { level, score, reasons, recipientId, blocked: level === 'high' };
  }

  // More scam "scripts" seen in India, including Hinglish. Plain keyword rules, explainable on purpose.
  const scripts = [
    { id: 'kyc', label: 'Fake KYC or bank helpdesk', weight: 28, words: /\b(kyc|pan (?:card )?(?:update|expire)|account (?:will be )?(?:blocked|closed)|khata band|customer care|helpdesk)\b/i, advice: 'Banks never ask you to pay or share codes for KYC. Use the official app or visit the branch.' },
    { id: 'arrest', label: 'Digital arrest or fake officer', weight: 40, words: /\b(digital arrest|cbi|narcotics|money laundering|arrest warrant|customs officer)\b/i, advice: 'No agency arrests anyone on a video call or takes money to close a case. Hang up and call 1930.' },
    { id: 'receive', label: 'Asked to pay or scan in order to receive money', weight: 35, words: /\b(?:refund|cashback|prize)\b.{0,60}\b(?:pay|scan|qr|pin)\b|\b(?:scan|pay)\b.{0,30}\bto (?:receive|get|claim)\b/i, advice: 'You never need to enter a PIN or scan a QR to receive money.' },
    { id: 'job', label: 'Task, job or commission offer', weight: 28, words: /\b(part.?time job|work from home|task (?:job|work|group)|like (?:and|&) subscribe|telegram group|earn daily)\b/i, advice: 'Real jobs do not ask you to pay first or to complete paid tasks.' },
    { id: 'invest', label: 'Investment tip or trading group', weight: 28, words: /\b(stock tips?|trading group|vip group|ipo allotment|forex|daily returns?|double your money)\b/i, advice: 'Check the advisor on the SEBI website before sending money.' },
    { id: 'parcel', label: 'Parcel, customs or bill-cut threat', weight: 30, words: /\b(parcel|courier|customs duty|electricity bill|power (?:will be )?(?:cut|disconnect\w*))\b/i, advice: 'Call the company on its official number. Do not pay through a link or a personal UPI ID.' },
    { id: 'hinglish', label: 'Pressure or secrecy in Hindi/Hinglish', weight: 28, words: /\b(turant|jaldi|abhi paise|band ho jayega|kisi ko mat batana|paise bhejo)\b/i, advice: 'Pause. Ask someone at home before paying.' },
    { id: 'link', label: 'Shortened link or APK file', weight: 20, words: /\b(?:bit\.ly|tinyurl|cutt\.ly|t\.co)\/\S+|\.apk\b/i, advice: 'Do not open short links or install apps sent in messages.' }
  ];
  const handles = ['okaxis', 'oksbi', 'okhdfcbank', 'okicici', 'ybl', 'ibl', 'axl', 'paytm', 'apl', 'upi', 'sbi', 'icici', 'hdfcbank', 'axisbank', 'pnb', 'kotak', 'yesbank', 'airtel', 'jio', 'fbl', 'demobank'];
  function parseUpi(text) {
    const t = String(text || ''), m = t.match(/upi:\/\/(pay|collect|mandate)\?\S+/i), p = {};
    if (m) {
      m[0].split('?')[1].split('&').forEach(kv => { const [k, ...v] = kv.split('='); const raw = v.join('=').replace(/\+/g, ' '); try { p[k.toLowerCase()] = decodeURIComponent(raw); } catch (err) { p[k.toLowerCase()] = raw; } });
      p.kind = m[1].toLowerCase();
    } else { const v = t.match(/\b[\w.\-]{2,}@[a-z]{2,}(?![\w.])/i); if (v) { p.pa = v[0]; p.kind = 'id'; } }
    return p.pa && /@/.test(p.pa) ? { vpa: p.pa.toLowerCase(), name: p.pn || '', amount: p.am || '', kind: p.kind } : null;
  }
  function sameName(expected, actual) {
    const a = String(actual).toLowerCase().replace(/[^a-z ]/g, ' ');
    return String(expected).toLowerCase().split(/\s+/).filter(w => w.length > 2).some(w => a.includes(w));
  }
  /* Checks a scanned QR, a pasted link/ID or a message. Returns the same shape as evaluate(). */

  // Link scams by what scammers reuse (phone, link, wording), because they rotate UPI IDs.
  const sampleReports = [
    { sample: true, type: 'kyc', text: 'Dear customer your bank account is blocked today. Update KYC now at http://kyc-update-sbi.example/login or call 9000011111', ids: { phones: ['9000011111'], urls: ['kyc-update-sbi.example'], vpas: ['kycdesk.9911@oksbi'] } },
    { sample: true, type: 'job', text: 'Part time job earn 3000 daily. Like and subscribe tasks, join our telegram group, pay 500 registration fee', ids: { phones: ['9000022222'], urls: [], vpas: ['hr.jobs77@ybl'] } },
    { sample: true, type: 'receive', text: 'Your refund of 4500 is ready. Scan this QR and enter your UPI PIN to receive the money', ids: { phones: [], urls: [], vpas: ['refund.help@paytm'] } }
  ];
  function extractIds(text) {
    const t = String(text || ''), phones = [], urls = [], vpas = [];
    (t.match(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/g) || []).forEach(p => phones.push(p.replace(/\D/g, '').slice(-10)));
    (t.match(/https?:\/\/[^\s/]+|\b(?:bit\.ly|tinyurl\.com|cutt\.ly)(?=\/)/gi) || []).forEach(u => urls.push(u.replace(/^https?:\/\//i, '').toLowerCase()));
    const u = parseUpi(t); if (u) vpas.push(u.vpa);
    return { phones: [...new Set(phones)], urls: [...new Set(urls)], vpas: [...new Set(vpas)] };
  }
  const words = s => new Set(String(s).toLowerCase().match(/[a-z]{4,}/g) || []);
  function matchReports(text, reports) {
    const ids = extractIds(text), mine = words(text); let count = 0; const via = new Set();
    (reports || []).forEach(r => {
      let hit = false; const rid = r.ids || {};
      [['phones', 'phone number'], ['urls', 'link'], ['vpas', 'UPI ID']].forEach(([k, label]) => { if ((rid[k] || []).some(x => ids[k].includes(x))) { hit = true; via.add(label); } });
      const theirs = words(r.text); const both = [...mine].filter(w => theirs.has(w)).length, all = new Set([...mine, ...theirs]).size;
      if (mine.size >= 6 && all && both / all >= 0.45) { hit = true; via.add('similar wording'); }
      if (hit) count++;
    });
    return { count, via: [...via].join(', ') };
  }
  function checkScan(input) {
    const text = (input && input.text) || '', quick = (input && input.quick) || [], upi = parseUpi(text), found = new Map();
    const add = (id, label, weight, advice) => { if (!found.has(id)) found.set(id, { id, label, weight, advice }); };
    clues.concat(scripts).forEach(c => { if (c.words.test(text)) add(c.id, c.label, c.weight, c.advice); });
    if (quick.includes('first')) add('first', 'Someone contacted you first', 15, 'Scammers start the chat. Contact the person yourself on a number you already trust.');
    if (quick.includes('rush')) add('urgency', 'You are being rushed', 22, 'Real organisations let you take your time.');
    if (quick.includes('receive')) add('receive', 'Asked to pay in order to receive money', 35, 'You never need to pay to receive money.');
    if (upi) {
      const [user, handle] = upi.vpa.split('@');
      if (!handles.includes(handle)) add('handle', `Unfamiliar UPI handle (@${handle})`, 10, 'Check that the handle belongs to a real bank or app.');
      if (/(sbi|rbi|npci|bank|support|help|care|kyc|refund|official|police|cbi|customs)/i.test(`${user} ${upi.name}`)) add('brand', 'ID or name pretends to be a bank or officer', 30, 'Banks do not collect money on personal-looking UPI IDs.');
      if (upi.kind === 'collect') add('collect', 'This is a money request: it asks YOU to pay', 30, 'Never approve a collect request you did not start.');
      if (input.expected && upi.name && !sameName(input.expected, upi.name)) add('mismatch', `QR name "${upi.name}" is not who you expected`, 35, 'Stop and confirm the payee on a trusted channel.');
      if (Number(upi.amount) >= 10000) add('big', `Large amount (₹${upi.amount})`, 12, 'Double-check big payments with someone you trust.');
    }
    const m = matchReports(text, input.reports);
    if (m.count) add('reported', `Matches ${m.count} earlier scam report${m.count > 1 ? 's' : ''} (${m.via})`, m.count >= 3 ? 40 : 25, 'New UPI ID, same scam? Scammers rotate accounts but reuse numbers, links and wording.');
    const reasons = [...found.values()], score = Math.min(100, reasons.reduce((s, r) => s + r.weight, 0));
    const level = score >= 60 ? 'high' : score >= 25 ? 'medium' : 'lower';
    return { level, score, reasons, upi, blocked: level === 'high', empty: !text.trim() && !quick.length };
  }

  /* ---- UPI Lab: a SIMULATION of the UPI path (app, payer PSP, NPCI switch, payee PSP, banks) plus an AI risk model. ---- */
  // Weights from tools/train_model.py, trained on SYNTHETIC data. Replace with real labelled data before any real use.
  const MODEL = { bias: -2.091, w: { age: -4.479, complaints: 1.559, senders: 0.603, outflow: 4.339, fri: 1.542, mismatch: 2.262, amount: 2.673, firstTime: 1.232, text: 2.733 } };
  const FACTOR = { age: 'Very new account', complaints: 'Fraud complaints on the account', senders: 'Many different senders paying in', outflow: 'Money is moved out within minutes, a common scam-account pattern', fri: 'Phone number has a fraud warning', mismatch: 'Name does not match', amount: 'Large amount for this payer', firstTime: 'First time paying this person', text: 'Scam wording in the message' };
  // Invented network-side signals per demo payee: [unique senders in 24h, share of inflow moved out quickly, risk flag 0-3]
  const net = { maya: [2, .05, 0], harbor: [30, .1, 0], priya: [3, .05, 0], imran: [45, .15, 0], deepak: [6, .1, 0], sunita: [4, .1, 0], alex: [9, .6, 1], vikram: [38, .9, 2], support: [61, .95, 3] };
  const knownPayees = ['maya', 'harbor', 'priya', 'imran', 'deepak'];
  function modelScore(x) {
    let z = MODEL.bias; const parts = [];
    Object.keys(MODEL.w).forEach(k => { const c = MODEL.w[k] * x[k]; z += c; parts.push({ key: k, label: FACTOR[k], c }); });
    return { p: 1 / (1 + Math.exp(-z)), factors: parts.filter(f => f.c > 0.25 && f.key !== 'age' || (f.key === 'age' && f.c > -0.8)).sort((a, b) => b.c - a.c).slice(0, 4) };
  }
  function simulateUpi(tx) {
    const rec = recipients.find(r => r.id === (tx && tx.payeeId));
    if (!rec) throw new Error('Choose a payee from the demo directory.');
    if (!validAmount(tx.amount)) throw new Error('Enter a positive whole amount.');
    const amount = Number(tx.amount), n = net[rec.id], balance = 10000, ref = 'SIM' + (Date.now() % 1e8);
    const text = checkScan({ text: tx.note || '' }).score / 100;
    const x = { age: Math.log1p(rec.ageDays) / 7.8, complaints: Math.min(rec.reports, 10) / 10, senders: n[0] / 90, outflow: n[1], fri: n[2] / 3, mismatch: rec.mismatch ? 1 : 0, amount: Math.min(1, Math.log10(1 + amount / 500) / 2), firstTime: knownPayees.includes(rec.id) ? 0 : 1, text };
    const m = modelScore(x), decision = m.p >= 0.7 ? 'decline' : m.p >= 0.3 ? 'hold' : 'allow';
    const st = (id, from, to, title, detail, status) => ({ id, from, to, title, detail, status });
    const steps = [
      st(1, 'You', 'Your app', 'You approve the payment', 'Your phone checks it is really you. Your UPI PIN is never typed or saved in this demo.', 'ok'),
      st(2, 'Your app', 'NPCI', 'Your app asks NPCI to send the money', `₹${amount.toLocaleString('en-IN')} to ${rec.handle}. Ref no. ${ref}.`, 'ok'),
      st(3, 'NPCI', 'Receiver', 'NPCI checks who owns the account', `The receiver's bank says the account name is "${rec.name}" and it is active. ${rec.mismatch ? 'This is NOT the name on the QR.' : ''}`, rec.mismatch ? 'warn' : 'ok'),
      st(4, 'NPCI', 'Scam check', `Scam check: risk ${Math.round(m.p * 100)} out of 100`, decision === 'allow' ? 'No strong scam signs found.' : 'Why: ' + m.factors.map(f => f.label).join('; ') + '.', decision === 'allow' ? 'ok' : decision === 'hold' ? 'warn' : 'stop')
    ];
    let outcome = decision;
    if (decision === 'decline') steps.push(st(5, 'NPCI', 'Banks', 'Your money stays safe', 'Nothing was sent. No money moved.', 'skip'));
    else if (amount > balance) { outcome = 'failed'; steps.push(st(5, 'NPCI', 'Your bank', 'Your bank says no', 'Not enough balance. The demo balance is 10,000.', 'stop')); }
    else {
      steps.push(st(5, 'NPCI', 'Your bank', 'Your bank sets the money aside', `₹${amount.toLocaleString('en-IN')} is taken from your account.`, 'ok'));
      steps.push(st(6, 'NPCI', 'Receiver bank', 'Receiver’s bank adds the money', decision === 'hold' ? 'Waiting for you to confirm the warning.' : 'The money reaches their account.', decision === 'hold' ? 'warn' : 'ok'));
    }
    steps.push(st(7, 'NPCI', 'Your app', 'You see the result', outcome === 'allow' ? 'Payment done. Your receipt is ready.' : outcome === 'hold' ? 'You get a warning before it completes.' : outcome === 'decline' ? 'Blocked. The account is held for review.' : 'Payment failed.', outcome === 'allow' ? 'ok' : outcome === 'hold' ? 'warn' : 'stop'));
    return { steps, decision: outcome, p: m.p, factors: m.factors };
  }
  function initialState() { return { version: 1, balance: 1000, receipts: [], reports: [], learned: [], quizCompleted: false }; }
  function validAmount(value) { return (typeof value === 'number' || typeof value === 'string') && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0; }
  function validateState(state) {
    if (!state || state.version !== 1 || !Number.isSafeInteger(state.balance) || state.balance < 0 || state.balance > 1000 || !Array.isArray(state.receipts) || !Array.isArray(state.reports) || !Array.isArray(state.learned) || typeof state.quizCompleted !== 'boolean') return false;
    const ids = new Set();
    let spent = 0;
    for (const r of state.receipts) {
      if (!r || typeof r.id !== 'string' || ids.has(r.id) || !validAmount(r.amount) || !recipients.some(x => x.id === r.recipientId) || !['lower', 'medium'].includes(r.level) || !Number.isFinite(Date.parse(r.date))) return false;
      ids.add(r.id); spent += Number(r.amount);
    }
    return state.balance + spent === 1000 && state.reports.every(r => r && recipients.some(x => x.id === r.recipientId) && typeof r.reason === 'string' && r.reason.length <= 500 && Number.isFinite(Date.parse(r.date))) && state.learned.every(x => typeof x === 'string');
  }
  function transfer(state, input) {
    if (!validateState(state)) throw new Error('Wallet data could not be validated. Reset the demo to continue.');
    if (!input || typeof input.id !== 'string' || !input.id) throw new Error('A transaction reference is required.');
    if (state.receipts.some(r => r.id === input.id)) throw new Error('This demo transfer has already been completed.');
    if (!validAmount(input.amount)) throw new Error('Enter a positive whole number of points.');
    const amount = Number(input.amount);
    if (amount > state.balance) throw new Error('Not enough demo points. Try a smaller amount.');
    const risk = evaluate(input.recipientId, input.context, input.clues, state.reports);
    if (risk.blocked) throw new Error('High-risk demo transfers are blocked. No points moved.');
    if (!input.reviewed) throw new Error('Review the recipient and risk assessment before continuing.');
    const receipt = { id: input.id, recipientId: input.recipientId, amount, level: risk.level, date: new Date().toISOString() };
    return { ...state, balance: state.balance - amount, receipts: [receipt, ...state.receipts] };
  }
  return { simulateUpi, sampleReports, extractIds, matchReports, recipients, clues, scripts, parseUpi, checkScan, evaluate, initialState, validateState, validAmount, transfer };
});
