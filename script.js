// --- State & LocalStorage Persistence ---
const defaultStats = {
  linksChecked: 0,
  quizzesCompleted: 0,
  scenariosSolved: 0,
  lastQuizScore: 0
};

let stats = JSON.parse(localStorage.getItem('cs_stats')) || { ...defaultStats };
let currentUser = JSON.parse(localStorage.getItem('cs_currentUser')) || null;
let generatedCode = null;

function saveStats() {
  localStorage.setItem('cs_stats', JSON.stringify(stats));
  updateDashboard();
}

// --- Top View Switching (Home, Dashboard, Report Crime) ---
function switchSection(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  const activeNav = document.querySelector(`.nav-btn[data-section="${viewId}"]`);
  if (activeNav) activeNav.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToFeedback() {
  switchSection('home');
  setTimeout(() => {
    const fb = document.getElementById('feedbackSection');
    if (fb) fb.scrollIntoView({ behavior: 'smooth' });
  }, 60);
}

function openModule(toolId) {
  switchSection('dashboard');
  switchTool(toolId);
}

// --- Dashboard Tool Tabs ---
function switchTool(toolId) {
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));

  const panel = document.getElementById(toolId);
  if (panel) panel.classList.add('active');

  const btn = document.querySelector(`.tool-btn[data-tool="${toolId}"]`);
  if (btn) btn.classList.add('active');
}

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTool(btn.dataset.tool));
});

// --- Update Stats & Profile UI ---
function updateDashboard() {
  document.getElementById('statLinks').textContent = stats.linksChecked;
  document.getElementById('statQuizzes').textContent = stats.quizzesCompleted;
  document.getElementById('statScenarios').textContent = stats.scenariosSolved;

  const readiness = Math.min(
    100,
    Math.round((stats.lastQuizScore * 0.5) + (stats.scenariosSolved * 10) + (stats.linksChecked * 5))
  );
  document.getElementById('statScore').textContent = `${readiness}%`;

  const welcomeText = document.getElementById('welcomeText');
  const navAuth = document.getElementById('navAuth');

  if (currentUser) {
    welcomeText.textContent = `Welcome back, ${currentUser.name}! Your personal CyberShield safety workspace is active.`;
    navAuth.innerHTML = `<span style="margin-right:10px;color:#bae6fd;font-weight:600;">👤 ${currentUser.name}</span>
      <button class="btn-baby" onclick="logout()">Logout</button>`;
  } else {
    welcomeText.textContent = 'Test suspicious links, spot fake payment screenshots, practice scam scenarios, and get instant victim reporting assistance.';
    navAuth.innerHTML = `<button class="btn-baby" id="openAuthBtn">Login / Profile</button>`;
    document.getElementById('openAuthBtn').addEventListener('click', () => {
      document.getElementById('authModal').classList.remove('hidden');
    });
  }
}

// --- Soft Pastel ("Baby") Auth Modal Logic ---
const authModal = document.getElementById('authModal');
document.getElementById('closeAuthBtn').addEventListener('click', () => authModal.classList.add('hidden'));

document.getElementById('loginTabBtn').addEventListener('click', () => {
  document.getElementById('loginTabBtn').classList.add('active');
  document.getElementById('registerTabBtn').classList.remove('active');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
});

document.getElementById('registerTabBtn').addEventListener('click', () => {
  document.getElementById('registerTabBtn').classList.add('active');
  document.getElementById('loginTabBtn').classList.remove('active');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
});

document.getElementById('sendCodeBtn').addEventListener('click', () => {
  generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  const banner = document.getElementById('demoCodeBanner');
  banner.textContent = `Verification Code: ${generatedCode}`;
  banner.classList.remove('hidden');
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const code = document.getElementById('regCode').value.trim();
  const msg = document.getElementById('regMsg');

  if (!generatedCode || code !== generatedCode) {
    msg.textContent = 'Please click "Get Code" and enter the 6-digit code.';
    return;
  }

  const users = JSON.parse(localStorage.getItem('cs_users')) || [];
  if (users.find(u => u.email === email)) {
    msg.textContent = 'An account with this email already exists.';
    return;
  }

  const newUser = { name, email, password };
  users.push(newUser);
  localStorage.setItem('cs_users', JSON.stringify(users));
  currentUser = newUser;
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));
  authModal.classList.add('hidden');
  updateDashboard();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');

  const users = JSON.parse(localStorage.getItem('cs_users')) || [];
  const found = users.find(u => u.email === email && u.password === password);
  if (!found) {
    msg.textContent = 'Invalid email or password.';
    return;
  }

  currentUser = found;
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));
  authModal.classList.add('hidden');
  updateDashboard();
});

function logout() {
  currentUser = null;
  localStorage.removeItem('cs_currentUser');
  updateDashboard();
}

// --- Scrollable Home Feedback Submission ---
document.getElementById('feedbackForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('fbName').value.trim();
  const email = document.getElementById('fbEmail').value.trim();
  const category = document.getElementById('fbCategory').value;
  const message = document.getElementById('fbMessage').value.trim();

  const allFeedback = JSON.parse(localStorage.getItem('cs_feedback')) || [];
  allFeedback.push({ name, email, category, message, date: new Date().toLocaleString() });
  localStorage.setItem('cs_feedback', JSON.stringify(allFeedback));

  const statusEl = document.getElementById('fbStatus');
  statusEl.textContent = `✅ Thank you, ${name}! Your feedback has been submitted.`;
  statusEl.classList.remove('hidden');
  document.getElementById('feedbackForm').reset();
});

// --- Victim Crime Reporting Helpers ---
function copyHelpline() {
  navigator.clipboard.writeText('1930');
  const notice = document.getElementById('copyNotice');
  notice.classList.remove('hidden');
  setTimeout(() => notice.classList.add('hidden'), 3000);
}

function toggleChecklist() {
  const box = document.getElementById('victimPrepBox');
  box.scrollIntoView({ behavior: 'smooth' });
}

// --- Tool 1: Suspicious Link Checker ---
document.getElementById('checkUrlBtn').addEventListener('click', () => {
  const rawUrl = document.getElementById('urlInput').value.trim();
  const resultBox = document.getElementById('urlResult');
  if (!rawUrl) return;

  let riskScore = 0;
  const flags = [];
  const lower = rawUrl.toLowerCase();

  if (!lower.startsWith('https://')) {
    riskScore += 30;
    flags.push('Does not use HTTPS encryption.');
  }
  if (/https?:\/\/\d+\.\d+\.\d+\.\d+/.test(lower)) {
    riskScore += 40;
    flags.push('Uses a raw IP address instead of a domain name.');
  }
  if (/\.(xyz|tk|ml|ga|cf|top|click)(\/|$)/.test(lower)) {
    riskScore += 30;
    flags.push('Uses a high-risk/commonly abused top-level domain.');
  }
  if (lower.includes('@')) {
    riskScore += 35;
    flags.push('Contains "@" symbol, which can mask the real destination.');
  }
  if (/(login|verify|update|bank|secure|free-gift|prize)/.test(lower)) {
    riskScore += 20;
    flags.push('Contains common phishing trigger keywords.');
  }

  resultBox.classList.remove('hidden', 'safe', 'warn', 'danger');
  if (riskScore >= 50) {
    resultBox.classList.add('danger');
    resultBox.innerHTML = `<strong>🚨 High Risk (${riskScore}/100)</strong><ul>${flags.map(f => `<li>${f}</li>`).join('')}</ul>`;
  } else if (riskScore >= 20) {
    resultBox.classList.add('warn');
    resultBox.innerHTML = `<strong>⚠️ Moderate Risk (${riskScore}/100)</strong><ul>${flags.map(f => `<li>${f}</li>`).join('')}</ul>`;
  } else {
    resultBox.classList.add('safe');
    resultBox.innerHTML = `<strong>✅ Looks Safe (Low Risk)</strong><p>No obvious phishing patterns detected. Always verify the sender before entering credentials.</p>`;
  }

  stats.linksChecked++;
  saveStats();
});

// --- Tool 2: Pre-Assessment Quiz ---
const quizQuestions = [
  {
    q: 'Which of the following is the strongest password practice?',
    options: ['Using your birthday + name', 'Using a unique 12+ character passphrase for each site', 'Reusing one complex password everywhere'],
    answer: 1
  },
  {
    q: 'You receive an urgent SMS saying your bank account is suspended with a link. What should you do?',
    options: ['Click the link immediately', 'Reply with your PIN', 'Open your official bank app or call the number on your card'],
    answer: 2
  },
  {
    q: 'What is the national cybercrime helpline number in India to report financial fraud immediately?',
    options: ['1930', '108', '1999'],
    answer: 0
  }
];

let quizIdx = 0;
let quizCorrect = 0;

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (quizIdx >= quizQuestions.length) {
    const pct = Math.round((quizCorrect / quizQuestions.length) * 100);
    stats.quizzesCompleted++;
    stats.lastQuizScore = pct;
    saveStats();
    container.innerHTML = `<h4>Quiz Complete!</h4><p>You scored <strong>${quizCorrect}/${quizQuestions.length} (${pct}%)</strong>.</p>
      <button class="btn-primary" style="margin-top:1rem;" onclick="resetQuiz()">Retake Quiz</button>`;
    return;
  }

  const item = quizQuestions[quizIdx];
  container.innerHTML = `<h4>Question ${quizIdx + 1} of ${quizQuestions.length}</h4><p style="margin:0.75rem 0;">${item.q}</p>` +
    item.options.map((opt, i) => `<button class="option-btn" onclick="answerQuiz(${i})">${opt}</button>`).join('');
}

function answerQuiz(choice) {
  if (choice === quizQuestions[quizIdx].answer) quizCorrect++;
  quizIdx++;
  renderQuiz();
}

function resetQuiz() {
  quizIdx = 0;
  quizCorrect = 0;
  renderQuiz();
}

// --- Tool 3: Scam Scenarios ---
const scenarios = [
  {
    title: 'The "Wrongly Sent Money" UPI Call',
    text: 'A stranger calls claiming they accidentally sent ₹5,000 to your UPI ID and begs you to click a "Refund" link they just sent on WhatsApp.',
    options: [
      { text: 'Click the WhatsApp link and enter your UPI PIN to return it.', safe: false, feedback: 'Never enter your UPI PIN to receive or "refund" via an unknown link—that is a collect request!' },
      { text: 'Check your actual bank/UPI app balance first; never use external links.', safe: true, feedback: 'Correct! Always verify inside your official banking app.' }
    ]
  },
  {
    title: 'Fake Tech Support Pop-Up',
    text: 'A loud browser pop-up says your PC is infected and tells you to call a toll-free number and install AnyDesk.',
    options: [
      { text: 'Close the browser tab (Alt+F4 or Task Manager) and run Windows Defender.', safe: true, feedback: 'Correct! Legitimate companies never lock your browser and demand remote access.' },
      { text: 'Call the number and let them connect.', safe: false, feedback: 'Scammers use remote access tools to steal banking details.' }
    ]
  }
];

let scenIdx = 0;

function renderScenario() {
  const container = document.getElementById('scenarioContainer');
  const s = scenarios[scenIdx % scenarios.length];
  container.innerHTML = `<h4>${s.title}</h4><p style="margin:0.75rem 0;">${s.text}</p>` +
    s.options.map((o, i) => `<button class="option-btn" onclick="chooseScenario(${i})">${o.text}</button>`).join('') +
    `<div id="scenFeedback" class="result-box hidden"></div>`;
}

function chooseScenario(i) {
  const s = scenarios[scenIdx % scenarios.length];
  const chosen = s.options[i];
  const fb = document.getElementById('scenFeedback');
  fb.classList.remove('hidden', 'safe', 'danger');
  fb.classList.add(chosen.safe ? 'safe' : 'danger');
  fb.innerHTML = `<p>${chosen.feedback}</p><button class="btn-secondary" style="margin-top:0.75rem;" onclick="nextScenario()">Next Scenario</button>`;
  if (chosen.safe) {
    stats.scenariosSolved++;
    saveStats();
  }
}

function nextScenario() {
  scenIdx++;
  renderScenario();
}

// --- Tool 4: Fake Payment Screenshot Quiz ---
const paymentCases = [
  {
    app: 'PayQuick UPI',
    amount: '₹2,500.00',
    status: 'PAID SUCCESSFULLY',
    txnId: 'TXN_000000000',
    upi: 'customer@okaxis',
    time: 'Today, 25:61 PM',
    isFake: true,
    reason: 'Look at the timestamp ("25:61 PM") and placeholder transaction ID ("TXN_000000000")—clear signs of a forged screenshot.'
  },
  {
    app: 'PayQuick UPI',
    amount: '₹850.00',
    status: 'Completed',
    txnId: '419283746510',
    upi: 'shopkeeper@sbi',
    time: '24 Nov, 04:15 PM',
    isFake: false,
    reason: 'The formatting, 12-digit UTR/Transaction ID, and timestamp are consistent—though you should always still check your own bank SMS.'
  }
];

let payIdx = 0;

function renderPaymentQuiz() {
  const container = document.getElementById('paymentContainer');
  const p = paymentCases[payIdx % paymentCases.length];
  container.innerHTML = `
    <div class="receipt-box">
      <div class="receipt-header"><strong>${p.app}</strong><div style="color:#16a34a;font-weight:700;">${p.status}</div></div>
      <div class="receipt-row"><span>Amount:</span><strong>${p.amount}</strong></div>
      <div class="receipt-row"><span>To:</span><span>${p.upi}</span></div>
      <div class="receipt-row"><span>Txn ID:</span><span>${p.txnId}</span></div>
      <div class="receipt-row"><span>Time:</span><span>${p.time}</span></div>
    </div>
    <div style="display:flex;gap:1rem;justify-content:center;">
      <button class="btn-primary" onclick="checkPayment(false)">Genuine</button>
      <button class="btn-secondary" onclick="checkPayment(true)">Fake Screenshot</button>
    </div>
    <div id="payFeedback" class="result-box hidden"></div>`;
}

function checkPayment(userSaidFake) {
  const p = paymentCases[payIdx % paymentCases.length];
  const fb = document.getElementById('payFeedback');
  const correct = userSaidFake === p.isFake;
  fb.classList.remove('hidden', 'safe', 'danger');
  fb.classList.add(correct ? 'safe' : 'danger');
  fb.innerHTML = `<strong>${correct ? '✅ Correct!' : '❌ Incorrect!'}</strong><p>${p.reason}</p>
    <button class="btn-secondary" style="margin-top:0.75rem;" onclick="payIdx++;renderPaymentQuiz();">Next Receipt</button>`;
}

// --- Tool 5: Interactive Simulator ---
const simMessages = [
  {
    sender: '+91-98XXX-XXXXX (Unknown)',
    body: 'CONGRATS! Your number won ₹50,000 in Lucky Draw. Click http://claim-prize-now.tk to claim within 10 mins.',
    isPhishing: true
  },
  {
    sender: 'GitHub',
    body: 'A new SSH key was added to your account. If this was you, no action is needed.',
    isPhishing: false
  }
];

let simIdx = 0;

function renderSimulator() {
  const container = document.getElementById('simulatorContainer');
  const m = simMessages[simIdx % simMessages.length];
  container.innerHTML = `
    <div style="background:#0b1120;padding:1rem;border-radius:8px;border:1px solid #334155;margin-bottom:1rem;">
      <div style="color:#94a3b8;font-size:0.85rem;">From: ${m.sender}</div>
      <p style="margin-top:0.5rem;">${m.body}</p>
    </div>
    <div style="display:flex;gap:1rem;">
      <button class="btn-primary" onclick="checkSim(true)">🚩 Report Phishing</button>
      <button class="btn-secondary" onclick="checkSim(false)">✅ Trust Message</button>
    </div>
    <div id="simFeedback" class="result-box hidden"></div>`;
}

function checkSim(reported) {
  const m = simMessages[simIdx % simMessages.length];
  const fb = document.getElementById('simFeedback');
  const correct = reported === m.isPhishing;
  fb.classList.remove('hidden', 'safe', 'danger');
  fb.classList.add(correct ? 'safe' : 'danger');
  fb.innerHTML = `<strong>${correct ? '✅ Good eye!' : '❌ Watch out!'}</strong>
    <p>${m.isPhishing ? 'This is a classic phishing lure using urgency and a suspicious .tk domain.' : 'This is a standard security notification with no suspicious links.'}</p>
    <button class="btn-secondary" style="margin-top:0.75rem;" onclick="simIdx++;renderSimulator();">Next Message</button>`;
}

// --- Tool 6: Privacy & Security Checkup ---
const checkupItems = [
  'I use unique passwords for every important account.',
  'Two-Factor Authentication (2FA) is enabled on my email and bank.',
  'My phone and laptop OS are updated to the latest security patches.',
  'I never share OTPs or UPI PINs with anyone over call or chat.',
  'I check URLs for HTTPS and exact spelling before logging in.'
];

function renderCheckup() {
  const list = document.getElementById('checkupList');
  list.innerHTML = checkupItems.map((item) => `
    <label class="checklist-item">
      <input type="checkbox" class="hygiene-cb" onchange="updateHygiene()" />
      <span>${item}</span>
    </label>
  `).join('');
}

function updateHygiene() {
  const cbs = document.querySelectorAll('.hygiene-cb');
  const checked = Array.from(cbs).filter(c => c.checked).length;
  document.getElementById('hygieneScore').textContent = `${Math.round((checked / cbs.length) * 100)}%`;
}

// --- Initialize ---
updateDashboard();
renderQuiz();
renderScenario();
renderPaymentQuiz();
renderSimulator();
renderCheckup();