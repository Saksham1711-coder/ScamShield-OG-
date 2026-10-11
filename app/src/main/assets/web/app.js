(function () {
  'use strict';
  const E = ShieldEngine;
  const KEY = 'scamshield-demo-v1';
  const main = document.getElementById('main');
  const modal = document.getElementById('modal');
  const icons = { check: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12l3 3 5-6"/>', home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>', pay: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18m-6 5h3"/>', learn: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>', updates: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>', wallet: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M17 5V3H6a3 3 0 0 0-3 3m18 6h-6v5h6"/>' };
  const labels = { check: 'Check', pay: 'Practice pay', learn: 'Library', updates: 'Alerts', wallet: 'Wallet' };
  let storageAvailable = true, dataWarning = '';
  function readState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return E.initialState();
      const parsed = JSON.parse(raw);
      if (!E.validateState(parsed)) throw new Error('Invalid data');
      return parsed;
    } catch (err) { dataWarning = 'Saved demo data could not be loaded. This session starts with a fresh practice wallet.'; return E.initialState(); }
  }
  let state = readState(), page = 'home', draft = freshDraft(), phase = 'details', lastReceipt = null, search = '', category = 'All', quizIndex = 0, quizScore = 0, quizAnswered = false;
  function freshDraft() { return { recipientId: 'maya', amount: '100', context: '', clues: [], id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` }; }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function save(next) {
    state = next;
    try { localStorage.setItem(KEY, JSON.stringify(next)); storageAvailable = true; }
    catch (err) { storageAvailable = false; toast('Storage unavailable. Your practice progress lasts only for this session.'); }
  }
  function latest() {
    if (!storageAvailable) return state;
    try { const raw = localStorage.getItem(KEY); if (raw) { const next = JSON.parse(raw); if (!E.validateState(next)) throw new Error('Saved wallet data is invalid. Reset the demo to continue.'); state = next; } return state; }
    catch (err) { if (err.message.includes('invalid')) throw err; return state; }
  }
  function toast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 4500); }
  const articles = [
    { id: 'pressure', category: 'Everyday scams', icon: '◷', title: 'Fake Urgency', intro: 'Slow down a request that wants you to speed up.', body: ['Scam messages often create a deadline, a threat or an exciting opportunity. Pressure can make a familiar-looking message feel more convincing.', 'Pause before paying. Leave the conversation and contact the person or organization using details you already know—not a number or link inside the message.', 'A real-looking profile, a familiar logo or a calm voice is not proof of identity. A lower-risk result in this demo cannot guarantee safety.'], tip: 'Give yourself a pause before every unexpected payment.' },
    { id: 'impersonation', category: 'Identity & trust', icon: '◎', title: 'Fake Identity', intro: 'Check who is really on the other end.', body: ['A message can copy a friend, a shop or a support team. Even a familiar account may be compromised.', 'Confirm an unexpected request through a separate trusted channel. For a friend, call a number already in your contacts. For an organization, use its official app or a web address you know.', 'In this prototype, names, profile age, identity matches and reports are invented. Real identity verification is not connected.'], tip: 'Verify the story and the payment destination independently.' },
    { id: 'investment', category: 'Money traps', icon: '↗', title: 'Easy Profit', intro: 'Be curious when an offer sounds certain.', body: ['Guaranteed profits, secret opportunities and pressure to send more money can be warning signs. A small initial payout does not establish that an offer is legitimate.', 'Do independent checks before acting. Do not rely only on testimonials, screenshots or links supplied by the person making the offer.', 'Never send extra money just because someone claims it will unlock a prize, a withdrawal or a refund. Stop and verify the request first.'], tip: 'A promise is a claim. It is not evidence.' },
    { id: 'codes', category: 'Identity & trust', icon: '✳', title: 'OTP Theft', intro: 'Security codes and passwords are private.', body: ['Someone asking for a password, a one-time code or remote access may be trying to take control of an account.', 'Do not share codes or install remote-control software at the request of an unexpected caller. End the interaction and use your provider’s trusted support channel.', 'ScamShield never asks for bank credentials, security codes, contacts or device permissions. The practice form should contain fictional information only.'], tip: 'Keep authentication codes in the app or site where you requested them.' },
    { id: 'marketplace', category: 'Everyday scams', icon: '▣', title: 'Shopping Trap', intro: 'Watch for unexpected changes in a sale.', body: ['A seller may ask you to leave a platform, pay an unexpected fee or use an unusual payment method. A buyer may claim to have overpaid and request a refund.', 'Review the platform’s payment and buyer-protection information through its own app or site. Confirm that funds actually arrived through your own account, not a screenshot.', 'Pause if payment details change. Check the new details with the intended recipient through a channel you already trust.'], tip: 'A screenshot of a payment is not the same as a received payment.' },
    { id: 'after', category: 'Money traps', icon: '♡', title: 'Act Fast', intro: 'You can stop, get support and take action.', body: ['Stop further payments and save relevant messages or transaction details. Contact your payment provider promptly through a trusted channel if real money was involved.', 'If you shared a password, change it through the official service and review account access. Ask someone you trust to help you work through the next steps.', 'Be cautious of anyone promising to recover lost money for an upfront fee. This demo’s report button only saves a fictional report on this device; it does not contact anyone.'], tip: 'Scams can happen to anyone. Asking for help is a useful next step.' }
  ];
  const quizzes = [
    { question: 'A “support agent” says your account will be locked unless you move money now. What is the best next step?', options: ['Send a small amount to test the account.', 'End the conversation and contact support through a trusted channel.', 'Ask the caller to send a picture of their badge.'], answer: 1, why: 'Independent contact breaks the pressure and gives you a way to check the claim.' },
    { question: 'This demo shows a lower-risk result. What does that tell you?', options: ['The recipient is guaranteed safe.', 'The payment can always be reversed.', 'The demo found fewer modeled signals; independent checking still matters.'], answer: 2, why: 'This is a limited rules-based simulation. Missing signals do not prove safety.' },
    { question: 'A new contact promises guaranteed returns and asks you to keep the offer secret. What should you do?', options: ['Pause and independently verify before paying.', 'Pay before the opportunity expires.', 'Share your one-time code to verify your account.'], answer: 0, why: 'Guaranteed returns, secrecy and urgency are reasons to stop and check.' }
  ];
  function heading(title, subtitle) { return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div></div>`; }
  function recipient(id) { return E.recipients.find(r => r.id === id); }
  function avatar(r) { return `<span class="avatar ${r.color}">${r.initials}</span>`; }
  function riskLabel(level) { return level === 'lower' ? 'Lower risk' : level === 'medium' ? 'Medium risk' : 'High risk'; }
  function money(n) { return Number(n).toLocaleString('en-US'); }
  function date(s) { return new Date(s).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function render() {
    const raw = location.hash.slice(1); page = Object.hasOwn(labels, raw) ? raw : 'check';
    document.getElementById('navigation').innerHTML = Object.entries(labels).map(([id, label]) => `<a class="nav-link ${page === id ? 'active' : ''}" href="#${id}" ${page === id ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg><span>${label}</span></a>`).join('');
    document.getElementById('page-kicker').textContent = page === 'check' ? '' : `SCAMSHIELD / ${labels[page].toUpperCase()}`;
    main.innerHTML = ({ check, pay, learn, updates, wallet })[page]();
    if (dataWarning) { main.insertAdjacentHTML('afterbegin', `<div class="notice warning">${esc(dataWarning)}</div>`); }
    if (!storageAvailable) main.insertAdjacentHTML('afterbegin', '<div class="notice warning">Session-only mode: local storage is unavailable.</div>');
  }
  function home() {
    return heading('A safer habit starts here.', 'Build your scam instincts. One small pause at a time.') + `<section class="hero"><div><div class="eyebrow">A MOMENT TO CHECK. A LOT TO PROTECT.</div><h2>Before you pay,<br>take a closer look.</h2><p>Practice spotting warning signs in a safe space. No real money. No real-world risk checks.</p><button class="primary" data-action="new-pay">Try a practice payment <span class="arrow">↗</span></button></div><div class="hero-art" aria-hidden="true"><span class="spark one">✦</span><div class="shield"><svg viewBox="0 0 70 70"><path d="m17 35 12 12 25-27"/></svg></div><span class="spark two">✧</span></div></section><div class="grid two"><section class="card balance-card"><div><div class="eyebrow muted">Your practice wallet</div><div class="balance-number">${money(state.balance)} <span>demo points</span></div><p class="tiny muted">For learning. Never real money.</p></div><span class="coin" aria-hidden="true">◈</span></section><section class="card balance-card"><div><div class="eyebrow muted">Your learning journey</div><div class="balance-number">${state.learned.filter(id => articles.some(a => a.id === id)).length} <span>of 6 guides explored</span></div><p class="tiny muted">${state.quizCompleted ? 'Quick quiz completed. Nice progress.' : 'A little knowledge goes a long way.'}</p></div><span class="coin" aria-hidden="true">✳</span></section></div><div class="section-heading"><h2>Know the warning signs</h2><a href="#learn" class="text-button">Explore all guides ↗</a></div><div class="grid three">${articles.slice(0, 3).map(a => `<article class="card lesson-preview"><div class="lesson-icon" aria-hidden="true">${a.icon}</div><span class="tag">${a.category} · 2 min</span><h3>${a.title}</h3><p>${a.intro}</p><button class="text-button" data-article="${a.id}">Read the guide ↗</button></article>`).join('')}</div><div class="tip"><span class="tip-icon" aria-hidden="true">◎</span><div><strong>Your pause is your superpower.</strong>If a request feels urgent, slow it down. Check with the person through a contact method you already trust.</div></div>`;
  }
  function pay() {
    if (phase === 'receipt' && lastReceipt) return receiptView();
    return heading('Practice a safer payment.', 'Use fictional points to see the signals before you decide.') + `<div class="stepper" aria-label="Payment progress"><div class="step ${phase === 'details' ? 'active' : ''}">01 · Set up</div><div class="step ${phase === 'review' ? 'active' : ''}">02 · Check signals</div><div class="step ${phase === 'npci' ? 'active' : ''}">03 · NPCI path</div></div>` + (phase === 'npci' ? npciStage() : phase === 'review' ? reviewView() : detailView());
  }
  function detailView() {
    return `<div class="form-layout"><form class="card" id="payment-form" novalidate><h2>Who are you practicing with?</h2><p class="section-sub">Every profile below is fictional.</p><div class="recipient-options" role="group" aria-label="Choose a demo recipient">${E.recipients.map(r => `<button type="button" class="recipient-option ${draft.recipientId === r.id ? 'selected' : ''}" data-recipient="${r.id}" aria-pressed="${draft.recipientId === r.id}">${avatar(r)}<span><strong>${r.name}</strong><small>@${r.handle}</small></span><span class="radio" aria-hidden="true"></span></button>`).join('')}</div><div class="field"><label for="amount">Amount in demo points</label><input id="amount" name="amount" type="text" inputmode="numeric" autocomplete="off" maxlength="7" value="${esc(draft.amount)}" aria-describedby="balance-hint payment-error"><small id="balance-hint">Available: ${money(state.balance)} points · Whole numbers only</small></div><div class="field"><label for="context">What did they ask you to do? <span class="muted">(optional)</span></label><textarea id="context" name="context" maxlength="1000" placeholder="Use a fictional message, e.g. “Send it now or your account will be locked.”">${esc(draft.context)}</textarea><small>Fictional details only. Text is checked locally using simple demo rules.</small></div><div class="field"><span class="field-label" id="clue-label">Anything else you noticed?</span><div class="checks" role="group" aria-labelledby="clue-label">${E.clues.map(c => `<label class="check-chip"><input name="clue" type="checkbox" value="${c.id}" ${draft.clues.includes(c.id) ? 'checked' : ''}>${{ urgency: 'Time pressure', threat: 'Threats', guarantee: 'Guaranteed returns', secrecy: 'Keep it secret', unusual: 'Codes / unusual payment' }[c.id]}</label>`).join('')}</div></div><p class="error" id="payment-error" role="alert"></p><button class="primary full" type="submit">Check the signals <span class="arrow">→</span></button></form><aside class="card aside-card"><div class="eyebrow muted">START WITH A STORY</div><h3 style="margin-top:12px">Try a demo scenario</h3><p>See how context changes an assessment.</p><button class="scenario-button" data-scenario="lunch"><strong>☕ Paying a friend back</strong><small>A familiar profile and a simple lunch split.</small></button><button class="scenario-button" data-scenario="seller"><strong>◷ The rushed seller</strong><small>A new profile wants you to pay immediately.</small></button><button class="scenario-button" data-scenario="support"><strong>⚑ The fake support request</strong><small>An account threat and a “safe account.”</small></button><div class="notice">Demo profile age, reports and identity matches are invented. This app does not verify anyone or connect to payment providers.</div></aside></div>`;
  }
  function collectDraft() { const form = document.getElementById('payment-form'); if (!form) return; draft.amount = form.elements.amount.value; draft.context = form.elements.context.value; draft.clues = Array.from(form.querySelectorAll('input[name="clue"]:checked')).map(x => x.value); }
  function reviewView() {
    const r = recipient(draft.recipientId), risk = E.evaluate(r.id, draft.context, draft.clues, state.reports);
    return `<div class="form-layout"><section class="card"><div class="risk-header ${risk.level}"><div class="eyebrow">SIMULATED ASSESSMENT</div><h2>${riskLabel(risk.level)}${risk.blocked ? ' · Payment blocked' : ''}</h2><p>${risk.level === 'lower' ? 'Fewer modeled warning signs were found. This does not mean a payment or person is safe.' : risk.level === 'medium' ? 'Some warning signs need a closer look. Pause and independently check the request.' : 'Strong warning signs were found. This demo will not move points for this request.'}</p></div><h3>What shaped this result</h3>${risk.reasons.length ? risk.reasons.map(reason => `<div class="reason"><strong>${reason.label}</strong><p>${reason.advice}</p></div>`).join('') : '<div class="reason"><strong>No modeled warning signs detected</strong><p>The demo only checks a small set of rules. It can miss scams and cannot establish trust.</p></div>'}<div class="notice">Always check unexpected requests through a trusted channel. Profile age and reports alone do not establish identity or intent.</div>${!risk.blocked ? `<label class="review-check"><input type="checkbox" id="reviewed"><span>I reviewed the fictional recipient and the warning signs. I understand this result cannot guarantee safety.</span></label>${risk.level === 'medium' ? '<label class="review-check"><input type="checkbox" id="medium-reviewed"><span>I understand the medium-risk warning. In a real situation, I would independently confirm this request before paying.</span></label>' : ''}` : '<div class="notice danger"><strong>No points have moved.</strong> High-risk requests cannot be overridden in this demo. Change the scenario or return to learning.</div>'}<p class="error" id="payment-error" role="alert"></p><div class="actions"><button class="secondary" data-action="edit-payment">← Edit details</button>${risk.blocked ? '<a href="#learn" class="primary">Learn what to check</a>' : `<button class="primary" data-action="send" disabled>Send ${money(draft.amount)} demo points</button>`}</div></section><aside class="card"><h3>Recipient snapshot</h3><p class="tiny muted" style="margin:7px 0 19px">Simulated directory data · Not verified</p><div class="history-row">${avatar(r)}<div><h3>${r.name}</h3><p>@${r.handle}</p></div></div><div class="detail-row"><span>Profile age</span><strong>${r.ageDays} days (demo)</strong></div><div class="detail-row"><span>Sample reports</span><strong>${r.reports} unverified</strong></div><div class="detail-row"><span>Your local reports</span><strong>${state.reports.filter(x => x.recipientId === r.id).length}</strong></div><div class="detail-row"><span>Identity signal</span><strong>${r.identity}</strong></div><div class="detail-row"><span>Practice amount</span><strong>${money(draft.amount)} points</strong></div><button class="text-button" data-action="report" style="margin-top:23px">Add a local demo report ↗</button></aside></div>`;
  }
  function receiptView() {
    const r = recipient(lastReceipt.recipientId);
    return `<section class="card success-card"><div class="success-icon" aria-hidden="true">✓</div><div class="eyebrow muted">PRACTICE COMPLETE</div><h1 style="margin-top:12px">A pause well practiced.</h1><p class="muted">Your fictional points moved inside this demo only.</p><div class="success-amount">${money(lastReceipt.amount)} <small>demo points</small></div><div class="detail-row"><span>To fictional recipient</span><strong>${r.name}</strong></div>${npciResult ? `<div class="detail-row"><span>Scam check (demo)</span><strong>${Math.round(npciResult.p * 100)}/100 · ${npciResult.decision === 'allow' ? 'Safe' : 'Paid after warning'}</strong></div>` : ''}<div class="detail-row"><span>Simulated assessment</span><strong>${riskLabel(lastReceipt.level)}</strong></div><div class="detail-row"><span>Remaining balance</span><strong>${money(state.balance)} points</strong></div><div class="detail-row"><span>Demo reference</span><strong>${esc(lastReceipt.id)}</strong></div><div class="detail-row"><span>Time</span><strong>${esc(date(lastReceipt.date))}</strong></div><div class="notice">This is a simulated receipt, not proof of payment. No money was sent and no real recipient was contacted.</div><div class="actions"><a class="secondary" href="#wallet">View practice history</a><button class="primary" data-action="new-pay">Practice again ↗</button></div></section>`;
  }
  function learn() {
    return heading('Small lessons. Stronger instincts.', 'Explore the patterns. Build a habit of checking.') + `<div class="search-wrap"><label class="field-label" for="learn-search">Find a guide</label><input id="learn-search" class="search-input" type="search" placeholder="Search topics or warning signs…" value="${esc(search)}"></div><div class="filter-row" role="group" aria-label="Guide category">${['All', 'Everyday scams', 'Identity & trust', 'Money traps'].map(c => `<button class="filter-button ${category === c ? 'active' : ''}" data-category="${esc(c)}" aria-pressed="${category === c}">${c}</button>`).join('')}</div><div class="learn-grid" id="learn-results">${learnResults()}</div><section class="quiz-banner"><div><h3>Put your instincts to the test.</h3><p>3 quick questions. No score pressure. ${state.quizCompleted ? 'You’ve completed this quiz—try it again.' : ''}</p></div><button class="primary" data-action="quiz">Take the quick quiz ↗</button></section>`;
  }
  function learnResults() { const matches = articles.filter(a => (category === 'All' || a.category === category) && `${a.title} ${a.intro} ${a.body.join(' ')}`.toLowerCase().includes(search.toLowerCase())); return matches.length ? matches.map(a => `<article class="card article-card"><div class="tag">${a.category} · 2 min read</div><h3>${a.title}</h3><p>${a.intro}</p><div class="actions"><button class="text-button" data-article="${a.id}">Read the guide ↗</button>${state.learned.includes(a.id) ? '<span class="complete-tag">✓ Explored</span>' : ''}</div></article>`).join('') : '<div class="empty" role="status">No guides found. Try “password” or clear your search.</div>'; }
  function updates() {
    const items = [
      { icon: '◷', kind: 'Impersonation', title: '“Your account is about to be locked.”', desc: 'An unexpected caller claims to be support and tells someone to move money to a “safe account.”', tip: 'End the call. Open your provider’s app or use a trusted support number to check.' },
      { icon: '↗', kind: 'Investment lure', title: '“Double your money. Today only.”', desc: 'A fictional group chat promotes guaranteed returns and insists on keeping the opportunity private.', tip: 'Pause. Guaranteed returns plus urgency and secrecy are warning signs.' },
      { icon: '▣', kind: 'Marketplace', title: '“Pay this fee to receive your payment.”', desc: 'A fictional buyer sends a payment screenshot and asks the seller to pay an unexpected release fee.', tip: 'Check your account directly. A screenshot or a buyer’s claim does not prove funds arrived.' }
    ];
    return heading('Recognize the story.', 'Sample scam patterns to explore at your own pace.') + '<div class="notice warning" style="margin-top:0"><strong>DEMO EXAMPLES · NOT A LIVE ALERT FEED</strong><br>These invented scenarios are learning content. They are not current incidents, verified reports or live scam updates.</div>' + `<div class="update-list">${items.map((u, i) => `<article class="card update-card"><div class="lesson-icon" aria-hidden="true">${u.icon}</div><div><div class="tag">Sample ${String(i + 1).padStart(2, '0')} · ${u.kind}</div><h3>${u.title}</h3><p>${u.desc}</p><div class="notice"><strong>A safer next step</strong><br>${u.tip}</div></div></article>`).join('')}</div><div class="tip"><span class="tip-icon">◎</span><div><strong>Want to see a warning in action?</strong>Try the fake support scenario in Practice pay.</div><button class="text-button" data-scenario="support">Try it ↗</button></div>`;
  }
  function wallet() {
    return heading('Your practice wallet.', 'A safe place to practice decisions with fictional points.') + `<section class="card wallet-hero"><div><div class="eyebrow">AVAILABLE DEMO POINTS</div><div class="balance-number">${money(state.balance)} <span>points</span></div><p class="tiny muted">Started with 1,000 · No cash value</p></div><button class="secondary" data-action="new-pay">Practice pay ↗</button></section><section class="card"><div class="section-heading" style="margin-top:0"><h2>Practice history</h2><span class="tiny muted">${state.receipts.length} completed</span></div>${state.receipts.length ? state.receipts.map(r => `<div class="history-row">${avatar(recipient(r.recipientId))}<div><h3>${recipient(r.recipientId).name}</h3><p>${esc(date(r.date))} · ${riskLabel(r.level)}</p><p>${esc(r.id)}</p></div><div class="amount">−${money(r.amount)}<span>demo points</span></div></div>`).join('') : '<div class="empty">Your first practice payment will appear here.<br>No real transactions are connected.</div>'}</section><section class="card" style="margin-top:20px"><h3>Local demo reports</h3><p class="section-sub">${state.reports.length} report${state.reports.length === 1 ? '' : 's'} saved on this device. Nothing is sent to a service or authority.</p>${state.reports.map(r => `<div class="reason"><strong>${recipient(r.recipientId).name}</strong><p>${esc(r.reason)}</p><p class="tiny">${esc(date(r.date))} · Unverified demo report</p></div>`).join('') || '<p class="tiny muted">No local reports yet.</p>'}</section><div class="settings-row"><p>Want a fresh start?<br>Reset restores 1,000 points and clears local progress.</p><button class="text-button" data-action="reset">Reset demo</button></div>`;
  }
  function openModal(html) { document.getElementById('modal-body').innerHTML = html; if (!modal.open) modal.showModal(); }
  function modalTitle(title) { return `<div class="modal-top"><h2>${title}</h2><button class="close" data-action="close" aria-label="Close dialog">×</button></div>`; }
  function openArticle(id) { const a = articles.find(x => x.id === id); if (!a) return; openModal(modalTitle(a.title) + `<div class="modal-copy"><div class="tag">${a.category} · 2 min read</div>${a.body.map(p => `<p>${p}</p>`).join('')}<div class="notice"><strong>${a.tip}</strong></div><button class="primary full" data-complete="${a.id}">${state.learned.includes(id) ? 'Guide explored ✓' : 'Mark as explored ✓'}</button></div>`); }
  function showQuiz() {
    if (quizIndex >= quizzes.length) {
      save({ ...latest(), quizCompleted: true });
      openModal(modalTitle('Keep that pause with you.') + `<div class="modal-copy"><div class="success-icon">✓</div><h3 style="text-align:center">${quizScore} of ${quizzes.length} correct</h3><p>Every question is a chance to practice. Check unexpected requests independently and keep your credentials private.</p><button class="primary full" data-action="close">Back to learning</button></div>`); render(); return;
    }
    quizAnswered = false; const q = quizzes[quizIndex];
    openModal(modalTitle('A quick instinct check') + `<div class="tag">QUESTION ${quizIndex + 1} OF ${quizzes.length}</div><h3 style="margin:16px 0">${q.question}</h3>${q.options.map((x, i) => `<button class="quiz-choice" data-answer="${i}">${x}</button>`).join('')}<div id="quiz-feedback" aria-live="polite"></div>`);
  }

  /* ---- Check: scan or paste, answer 3 quick questions, get a clear result ---- */
  let scanStream = null, scanTimer = null;
  function check() {
    return heading('Check before you pay', 'Scan the QR or paste what you received. Nothing leaves your phone.') + `<section class="card"><button class="primary full" data-action="scan">📷 Scan a payment QR</button>
    <div class="field"><label for="chk-text">Or paste the UPI link, UPI ID or the message</label><textarea id="chk-text" placeholder="e.g. upi://pay?pa=kyc.help@oksbi&pn=Bank Help&am=2000"></textarea></div>
    <div class="field"><label for="chk-exp">Who do you think you are paying? (optional)</label><input id="chk-exp" placeholder="e.g. Ramesh Gupta"><small>We compare this with the name inside the QR.</small></div>
    <div class="field"><span class="field-label">Quick questions</span><label class="check-row"><input type="checkbox" value="first"> Someone contacted me first</label><label class="check-row"><input type="checkbox" value="rush"> I am being rushed or threatened</label><label class="check-row"><input type="checkbox" value="receive"> I must pay to receive money</label></div>
    <button class="primary full" data-action="run-check">Check now</button></section><div class="big-actions"><button class="big-action" data-action="lab">🏦 Try a payment<small>See how NPCI checks it for scams</small></button><button class="big-action alt" data-action="report-scam">🚩 Report a scam<small>Warn others and learn what to do next</small></button></div><button class="text-button" data-action="npci" style="margin-top:14px">How can NPCI help?</button>`;
  }
  function runCheck(text) {
    const box = document.getElementById('chk-text');
    if (text && box) box.value = text;
    const quick = [...document.querySelectorAll('.check-row input:checked')].map(i => i.value);
    lastText = box ? box.value : (text || '');
    const r = E.checkScan({ reports: allReports(), text: lastText, expected: (document.getElementById('chk-exp') || {}).value, quick });
    if (r.empty) { toast('Scan a QR or paste something first.'); return; }
    const head = r.level === 'high' ? ['🛑 Stop. Do not pay.', 'Several strong scam signs match.'] : r.level === 'medium' ? ['⚠️ Be careful', 'Some warning signs. Verify before paying.'] : ['✅ No strong warning signs', 'This is not a guarantee. Stay alert.'];
    const payee = r.upi ? `<div class="notice"><strong>Paying:</strong> ${esc(r.upi.name || 'name not shown')} · ${esc(r.upi.vpa)}${r.upi.amount ? ' · ₹' + esc(r.upi.amount) : ''}</div>` : '';
    openModal(modalTitle(head[0]) + `<div class="modal-copy"><div class="risk-header risk-${r.level}"><strong>${riskLabel(r.level)}</strong><p>${head[1]}</p></div>${payee}${r.reasons.map(x => `<div class="reason"><strong>${esc(x.label)}</strong><p>${esc(x.advice)}</p></div>`).join('') || '<p>No scam script or payee warning matched.</p>'}${r.level === 'lower' ? '' : '<div class="notice"><strong>Before you do anything:</strong> talk to someone you trust. If money is already sent, call <strong>1930</strong> or visit cybercrime.gov.in.</div>'}<button class="primary full" data-action="close">${r.level === 'high' ? 'I will not pay' : 'Close'}</button>${r.level === 'lower' ? '' : '<button class="secondary full" data-action="report-scam">🚩 Report this</button>'}</div>`);
  }
  function stopScan() { clearInterval(scanTimer); if (scanStream) scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
  async function startScan() {
    const detector = window.BarcodeDetector ? new BarcodeDetector({ formats: ['qr_code'] }) : null;
    if (!navigator.mediaDevices || (!detector && !window.jsQR)) { toast('Camera scan is not supported here. Paste the link instead.'); return; }
    openModal(modalTitle('Point at the QR code') + '<div class="modal-copy"><video id="scan-video" playsinline muted style="width:100%;border-radius:14px;background:#000"></video><p class="tiny">The picture stays on your phone and is never saved.</p></div>');
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = document.getElementById('scan-video'); v.srcObject = scanStream; await v.play();
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
      scanTimer = setInterval(async () => {
        let value = '';
        try {
          if (detector) { const f = await detector.detect(v); value = f.length ? f[0].rawValue : ''; }
          else if (v.videoWidth) { canvas.width = v.videoWidth; canvas.height = v.videoHeight; ctx.drawImage(v, 0, 0); const d = ctx.getImageData(0, 0, canvas.width, canvas.height), c = window.jsQR(d.data, d.width, d.height); value = c ? c.data : ''; }
        } catch (err) { /* keep trying */ }
        if (value) { stopScan(); modal.close(); runCheck(value); }
      }, 300);
    } catch (err) { stopScan(); modal.close(); toast('Camera permission was not granted. You can paste the link instead.'); }
  }
  modal.addEventListener('close', stopScan);
  document.addEventListener('click', event => {
    const el = event.target.closest('button'); if (!el) return;
    if (el.dataset.action === 'scan') startScan();
    if (el.dataset.action === 'run-check') runCheck();
  });

  /* ---- Report a scam (stored on this phone only in the prototype) ---- */
  const REP_KEY = 'scamshield-reports-v1';
  let lastText = '';
  function localReports() { try { const v = JSON.parse(localStorage.getItem(REP_KEY) || '[]'); return Array.isArray(v) ? v.filter(r => r && typeof r.text === 'string' && r.ids) : []; } catch (err) { return []; } }
  function allReports() { return E.sampleReports.concat(localReports()); }
  function reportForm() {
    const ids = E.extractIds(lastText), found = [...ids.phones, ...ids.urls, ...ids.vpas];
    openModal(modalTitle('Report a scam') + `<div class="modal-copy"><div class="notice">Do not write your name, Aadhaar, PAN, card number or OTP. Only describe the scam.</div>
    <div class="field"><label for="rp-type">What kind of scam?</label><select id="rp-type">${E.scripts.map(s => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}<option value="other">Something else</option></select></div>
    <div class="field"><label for="rp-text">Message, link, number or UPI ID</label><textarea id="rp-text">${esc(lastText)}</textarea><small>${found.length ? 'We found: ' + esc(found.join(', ')) : 'Numbers, links and UPI IDs in the text help us connect reports.'}</small></div>
    <label class="check-row"><input type="checkbox" id="rp-lost"> I already lost money</label>
    <button class="primary full" data-action="submit-report">Submit report</button></div>`);
  }
  function submitReport() {
    const text = document.getElementById('rp-text').value.trim().slice(0, 600);
    if (text.length < 8) { toast('Please add the message, link, number or UPI ID.'); return; }
    const entry = { type: document.getElementById('rp-type').value, text, ids: E.extractIds(text), lost: document.getElementById('rp-lost').checked, date: new Date().toISOString() };
    try { localStorage.setItem(REP_KEY, JSON.stringify(localReports().concat(entry).slice(-50))); } catch (err) { toast('Could not save on this device.'); }
    openModal(modalTitle('Thank you 🙏') + `<div class="modal-copy"><p>Your report is saved on this phone. In the full version it would warn others who meet the same number, link or wording.</p>${entry.lost ? '<div class="notice"><strong>If money was sent, act now:</strong> call <strong>1930</strong> immediately and tell your bank. Fast reporting gives the best chance of freezing the money.</div>' : ''}<div class="notice">Also report at <strong>cybercrime.gov.in</strong>. For scam calls or SMS, use <strong>Chakshu</strong> on the Sanchar Saathi site.</div><button class="primary full" data-action="close">Done</button></div>`);
  }
  function npciView() {
    const step = (n, t, p, d) => `<div class="reason" style="animation-delay:${d}s"><strong>${n}. ${t}</strong><p>${p}</p></div>`;
    openModal(modalTitle('How NPCI can help') + `<div class="modal-copy"><div class="notice warning"><strong>COMING LATER, NOT CONNECTED.</strong> NPCI does not give apps direct access. We would work through a partner bank or UPI app.</div>
    ${step(1, 'Today: checks on your phone', 'We read the QR, spot scam wording and match reports by phone number, link and message, so a new UPI ID cannot hide a repeat scam.', 0.05)}
    ${step(2, 'Next: with a partner bank', 'Before you pay, we send only the receiver’s UPI ID and the amount, with your OK. Never your PIN or bank login. The bank replies with the account name and any fraud warning, like the government’s fraud risk rating for phone numbers.', 0.2)}
    ${step(3, 'What only banks can see', 'Banks and NPCI can spot scam accounts from patterns, like many new senders and money moved out within minutes. They would share just low, medium or high.', 0.35)}
    ${step(4, 'Reports help everyone', 'Confirmed reports go to the bank and the cybercrime portal and warn the next person.', 0.5)}
    <p class="tiny">Scammers change accounts. Banks see the pattern, we see the story. Together we warn you before you pay.</p><button class="primary full" data-action="close">Close</button></div>`);
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('button'); if (!el) return;
    if (el.dataset.action === 'report-scam') reportForm();
    if (el.dataset.action === 'submit-report') submitReport();
    if (el.dataset.action === 'npci') npciView();
  });

  function upiLab() {
    openModal(modalTitle('Try a payment') + `<div class="modal-copy"><div class="notice warning"><strong>DEMO ONLY.</strong> See how a payment travels from your phone to the receiver’s bank, with a scam check on the way. No real money, banks or NPCI.</div>
    <div class="field"><label for="lab-payee">Pay to</label><select id="lab-payee">${E.recipients.map(r => `<option value="${r.id}">${esc(r.name)} · ${esc(r.handle)}</option>`).join('')}</select></div>
    <div class="field"><label for="lab-amt">Amount (₹)</label><input id="lab-amt" inputmode="numeric" value="500"></div>
    <div class="field"><label for="lab-note">Message you received (optional)</label><input id="lab-note" placeholder="e.g. urgent, pay now or you will be arrested"></div>
    <button class="primary full" data-action="lab-run">Send the payment</button><div id="lab-out"></div></div>`);
  }
  function labRun() {
    let r;
    try { r = E.simulateUpi({ payeeId: document.getElementById('lab-payee').value, amount: document.getElementById('lab-amt').value, note: document.getElementById('lab-note').value }); } catch (err) { toast(err.message); return; }
    const bar = { ok: '#3b8a5a', warn: '#d9a21b', stop: '#a53841', skip: '#b7bfba' };
    const banner = { allow: ['lower', 'Payment goes through', 'Low scam risk in this demo.'], hold: ['medium', 'Stopped for your OK', 'You get a warning before the payment completes.'], decline: ['high', 'Blocked: looks like a scam', 'No money moved. In real life this account would be checked.'], failed: ['medium', 'Payment failed', 'Check the amount.'] }[r.decision];
    document.getElementById('lab-out').innerHTML = `<div class="risk-header risk-${banner[0]}" style="margin-top:20px"><strong>${banner[1]}</strong><p>${banner[2]}</p></div>` + r.steps.map((s, i) => `<div class="reason" style="animation-delay:${0.12 * i}s;border-left:4px solid ${bar[s.status]};padding-left:14px"><strong>${i + 1}. ${esc(s.title)}</strong><p>${esc(s.detail)}</p></div>`).join('') + '<p class="tiny">Demo only: the scam check uses practice data, so the scores are just for show.</p>';
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('button'); if (!el) return;
    if (el.dataset.action === 'lab') upiLab();
    if (el.dataset.action === 'lab-run') labRun();
  });

  /* ---- Practice pay stage 03: the simulated UPI / NPCI path before the receipt ---- */
  let npciResult = null;
  function npciStage() {
    const r = npciResult, rec = recipient(draft.recipientId);
    if (!r) { phase = 'review'; return reviewView(); }
    const bar = { ok: '#3b8a5a', warn: '#d9a21b', stop: '#a53841', skip: '#b7bfba' }, gap = 0.45, end = gap * r.steps.length + 0.1;
    const banner = { allow: ['lower', 'Safe to go ahead', 'Low scam risk in this demo. Tap to finish the payment.'], hold: ['medium', 'Warning: be careful', 'Cancelling is safer. If you continue, only demo points move.'], decline: ['high', 'Blocked: looks like a scam', 'No points moved. In real life this account would be checked.'], failed: ['medium', 'Payment failed', 'Go back and change the amount.'] }[r.decision];
    const buttons = r.decision === 'allow' ? '<button class="primary full" data-action="npci-complete">Finish payment</button>' : r.decision === 'hold' ? '<button class="secondary" data-action="npci-cancel">Cancel (recommended)</button><button class="danger-button" data-action="npci-complete">Pay anyway</button>' : '<button class="primary" data-action="npci-cancel">Back to edit</button><button class="secondary" data-action="report">Add a local demo report</button>';
    return `<div class="form-layout"><section class="card"><div class="eyebrow">DEMO ONLY · NO REAL BANK OR NPCI</div><h2>Payment to ${esc(rec.name)}</h2><p class="section-sub">Follow your ${esc(money(draft.amount))} demo points from your phone, through NPCI, to the banks.</p>` +
      r.steps.map((s, i) => `<div class="reason" style="animation-delay:${(gap * i).toFixed(2)}s;border-left:4px solid ${bar[s.status]};padding-left:14px"><strong>${i + 1}. ${esc(s.title)}</strong><p>${esc(s.detail)}</p></div>`).join('') +
      `<div class="risk-header risk-${banner[0]}" style="margin-top:20px;animation:rise .5s ${end.toFixed(2)}s both"><strong>${banner[1]}</strong><p>${banner[2]}</p></div><div class="actions" style="animation:rise .5s ${(end + 0.1).toFixed(2)}s both">${buttons}</div><p class="tiny">Demo only: the scam check uses practice data, so the scores are just for show.</p></section></div>`;
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('button'); if (!el) return;
    if (el.dataset.action === 'npci-cancel') { phase = 'details'; render(); window.scrollTo(0, 0); }
    if (el.dataset.action === 'npci-complete') {
      el.disabled = true;
      try { const next = E.transfer(latest(), { ...draft, reviewed: true }); lastReceipt = next.receipts[0]; save(next); phase = 'receipt'; render(); main.focus(); window.scrollTo(0, 0); }
      catch (err) { el.disabled = false; toast(err.message); }
    }
  });
  function navigate(id) { if (location.hash === `#${id}`) { render(); window.scrollTo(0, 0); } else location.hash = id; }
  function scenario(id) {
    draft = freshDraft(); phase = 'details';
    if (id === 'lunch') { draft.context = 'Our lunch split from yesterday. I confirmed the details with Ananya in person.'; draft.amount = '80'; }
    if (id === 'seller') { draft.recipientId = 'alex'; draft.context = 'Pay immediately to reserve the used desk.'; draft.amount = '180'; }
    if (id === 'support') { draft.recipientId = 'support'; draft.context = 'Urgent: your account will be locked. Move money to a safe account right now. Do not tell anyone.'; draft.amount = '500'; }
    navigate('pay'); toast('Fictional scenario loaded. Review the details.');
  }
  document.addEventListener('input', event => { if (event.target.id === 'learn-search') { search = event.target.value; document.getElementById('learn-results').innerHTML = learnResults(); } });
  document.addEventListener('change', event => { if (event.target.id === 'reviewed' || event.target.id === 'medium-reviewed') { const button = document.querySelector('[data-action="send"]'); const extra = document.getElementById('medium-reviewed'); if (button) button.disabled = !(document.getElementById('reviewed').checked && (!extra || extra.checked)); } });
  document.addEventListener('submit', event => {
    if (event.target.id === 'payment-form') { event.preventDefault(); collectDraft(); const error = document.getElementById('payment-error'); if (!E.validAmount(draft.amount)) { error.textContent = 'Enter a positive whole number of demo points.'; return; } if (Number(draft.amount) > state.balance) { error.textContent = 'Not enough demo points. Try a smaller amount.'; return; } phase = 'review'; render(); main.focus(); window.scrollTo(0, 0); }
    if (event.target.id === 'report-form') { event.preventDefault(); const value = event.target.elements.reason.value.trim(); if (!value) { document.getElementById('report-error').textContent = 'Add a short fictional reason.'; return; } try { const current = latest(); save({ ...current, reports: [...current.reports, { recipientId: draft.recipientId, reason: value.slice(0, 500), date: new Date().toISOString() }] }); modal.close(); render(); toast('Demo report saved locally. It has not been sent anywhere.'); } catch (err) { document.getElementById('report-error').textContent = err.message; } }
  });
  document.addEventListener('click', event => {
    const el = event.target.closest('button, a'); if (!el) return;
    if (el.dataset.recipient) { collectDraft(); draft.recipientId = el.dataset.recipient; render(); document.querySelector(`[data-recipient="${draft.recipientId}"]`).focus(); }
    if (el.dataset.scenario) scenario(el.dataset.scenario);
    if (el.dataset.article) openArticle(el.dataset.article);
    if (el.dataset.complete) { try { const current = latest(); save({ ...current, learned: [...new Set([...current.learned, el.dataset.complete])] }); modal.close(); render(); toast('Guide marked as explored.'); } catch (err) { toast(err.message); } }
    if (el.dataset.category) { category = el.dataset.category; render(); }
    if (el.dataset.answer !== undefined && !quizAnswered) { quizAnswered = true; const selected = Number(el.dataset.answer), q = quizzes[quizIndex]; if (selected === q.answer) quizScore++; document.querySelectorAll('[data-answer]').forEach(b => { b.disabled = true; if (Number(b.dataset.answer) === q.answer) b.classList.add('correct'); else if (b === el) b.classList.add('incorrect'); }); document.getElementById('quiz-feedback').innerHTML = `<div class="notice"><strong>${selected === q.answer ? 'That’s right.' : 'A useful moment to pause.'}</strong><br>${q.why}</div><button class="primary full" data-action="quiz-next">${quizIndex === quizzes.length - 1 ? 'See results' : 'Next question →'}</button>`; }
    const action = el.dataset.action;
    if (action === 'close') modal.close();
    if (action === 'new-pay') { draft = freshDraft(); phase = 'details'; navigate('pay'); }
    if (action === 'edit-payment') { phase = 'details'; render(); }
    if (action === 'send') {
      const checked = document.getElementById('reviewed')?.checked;
      const extra = document.getElementById('medium-reviewed');
      if (!checked || (extra && !extra.checked)) return;
      el.disabled = true;
      try { E.transfer(latest(), { ...draft, reviewed: true }); npciResult = E.simulateUpi({ payeeId: draft.recipientId, amount: draft.amount, note: draft.context }); phase = 'npci'; render(); main.focus(); window.scrollTo(0, 0); }
      catch (err) { el.disabled = false; document.getElementById('payment-error').textContent = err.message; }
    }
    if (action === 'report') openModal(modalTitle('Add a local demo report') + `<form id="report-form"><p class="section-sub">Report the fictional profile ${recipient(draft.recipientId).name}. This only affects your local simulation.</p><div class="field"><label for="report-reason">Fictional reason</label><textarea id="report-reason" name="reason" maxlength="500" required placeholder="Example: This fictional profile pressured me to pay."></textarea><small>Do not include personal or sensitive information.</small></div><p class="error" id="report-error" role="alert"></p><button type="submit" class="primary full">Save demo report locally</button></form>`);
    if (action === 'quiz') { quizIndex = 0; quizScore = 0; showQuiz(); }
    if (action === 'quiz-next') { quizIndex++; showQuiz(); }
    if (action === 'privacy') openModal(modalTitle('A practice space, by design.') + '<div class="modal-copy"><p>ScamShield is an offline educational prototype. It uses fictional recipients and points to demonstrate payment warning signs.</p><h3>What this app can do</h3><p>Apply simple local rules to fictional messages, show sample identity signals and reports, and save your practice history on this device.</p><h3>What it cannot do</h3><p>Verify a real person, access your bank, send money, detect all scams, fetch live alerts or contact authorities. A lower-risk result does not mean safe.</p><h3>Your data stays here</h3><p>No accounts, analytics, network calls or banking credentials. Wallet history, completed guides and demo reports are saved in local browser storage. Form messages are held in memory only. Use fictional text: local storage is not encrypted and may be accessible on a shared device.</p><h3>No device permissions</h3><p>The Android wrapper does not request contacts, SMS, camera, location or internet access. Reset demo clears this app’s saved practice data.</p><div class="notice">This prototype is not a security product or a financial service.</div></div>');
    if (action === 'reset') openModal(modalTitle('Start fresh?') + '<div class="modal-copy"><p>This clears your practice payment history, local demo reports, explored guides and quiz progress. Your wallet will return to 1,000 fictional points.</p><div class="actions"><button class="secondary" data-action="close">Keep my progress</button><button class="danger-button" data-action="confirm-reset">Reset all demo data</button></div></div>');
    if (action === 'confirm-reset') { save(E.initialState()); dataWarning = ''; draft = freshDraft(); phase = 'details'; lastReceipt = null; modal.close(); render(); toast('Demo reset. You have 1,000 practice points.'); }
  });
  window.addEventListener('hashchange', () => { if (page === 'pay' && phase === 'details') collectDraft(); render(); main.focus(); window.scrollTo(0, 0); });
  window.addEventListener('storage', e => { if (e.key === KEY) { state = readState(); render(); toast('Practice data updated from another tab.'); } });
  render();
})();
