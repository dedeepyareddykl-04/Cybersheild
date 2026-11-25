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

// --- Login-First Gate Logic ---
const loginGate = document.getElementById('loginGate');
const appShell = document.getElementById('appShell');

function checkAuthState() {
  if (currentUser) {
    loginGate.classList.add('hidden');
    appShell.classList.remove('hidden');
    updateDashboard();
  } else {
    loginGate.classList.remove('hidden');
    appShell.classList.add('hidden');
  }
}

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
  checkAuthState();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');

  const users = JSON.parse(localStorage.getItem('cs_users')) || [];
  const found = users.find(u => u.email === email && u.password === password);
  if (!found) {
    msg.textContent = 'Invalid email or password (or use Create Profile / Demo Login).';
    return;
  }

  currentUser = found;
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));
  checkAuthState();
});

document.getElementById('demoQuickLoginBtn').addEventListener('click', () => {
  currentUser = { name: 'Dedeepya Reddy', email: 'citizen@cybershield.in' };
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));
  checkAuthState();
});

function logout() {
  currentUser = null;
  localStorage.removeItem('cs_currentUser');
  closeProfileMenu();
  checkAuthState();
}

// --- Top-Right Profile Menu ---
const profileMenuBtn = document.getElementById('profileMenuBtn');
const profileDropdown = document.getElementById('profileDropdown');

profileMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('hidden');
});

function closeProfileMenu() {
  profileDropdown.classList.add('hidden');
}

document.addEventListener('click', () => closeProfileMenu());

// --- Navigation (Home, Dashboard, Report Crime, Feedback) ---
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

  if (currentUser) {
    document.getElementById('profileInitial').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('profileNameLabel').textContent = currentUser.name.split(' ')[0];
    document.getElementById('dropFullName').textContent = currentUser.name;
    document.getElementById('dropEmail').textContent = currentUser.email;
    document.getElementById('welcomeText').textContent = `Welcome back, ${currentUser.name}! Your personal CyberShield safety workspace is active.`;
  }
}

// --- Feedback Form ---
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
  document.getElementById('victimPrepBox').scrollIntoView({ behavior: 'smooth' });
}

// --- Tool 1: Suspicious Link Checker + Example URLs ---
function analyzeUrl(rawUrl) {
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
    flags.push('Uses a raw IP address instead of a legitimate domain name.');
  }
  if (/\.(xyz|tk|ml|ga|cf|top|click)(\/|$)/.test(lower)) {
    riskScore += 30;
    flags.push('Uses a high-risk/commonly abused top-level domain.');
  }
  if (lower.includes('@')) {
    riskScore += 35;
    flags.push('Contains "@" symbol, which masks the real destination server.');
  }
  if (/(login|verify|update|bank|secure|free-gift|prize|kyc|alert)/.test(lower)) {
    riskScore += 20;
    flags.push('Contains common phishing urgency/trigger keywords.');
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
    resultBox.innerHTML = `<strong>✅ Looks Safe (Low Risk)</strong><p>Uses HTTPS and no suspicious phishing patterns were found.</p>`;
  }

  stats.linksChecked++;
  saveStats();
}

document.getElementById('checkUrlBtn').addEventListener('click', () => {
  analyzeUrl(document.getElementById('urlInput').value.trim());
});

function testExampleUrl(sampleUrl) {
  document.getElementById('urlInput').value = sampleUrl;
  analyzeUrl(sampleUrl);
}

// --- Tool 2: 3-Stage Assessments (Pre, Mid, Post) ---
const assessmentBanks = {
  pre: {
    label: 'Pre-Assessment (Baseline Check)',
    questions: [
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
        q: 'What does Two-Factor Authentication (2FA) protect against?',
        options: ['Stolen passwords alone', 'Slow internet speeds', 'Hardware damage'],
        answer: 0
      },
      {
        q: 'Do you ever need to enter your UPI PIN to RECEIVE money into your bank account?',
        options: ['Yes, always', 'No—UPI PIN is only required to SEND money', 'Only for amounts above ₹5,000'],
        answer: 1
      }
    ]
  },
  mid: {
    label: 'Mid-Assessment (Applied Scam Detection)',
    questions: [
      {
        q: 'A link reads "https://sbi-kyc.verify-user.xyz". Which part is the actual domain you are connecting to?',
        options: ['sbi-kyc.com', 'verify-user.xyz', 'sbi.co.in'],
        answer: 1
      },
      {
        q: 'A buyer sends a UPI payment screenshot claiming they paid ₹4,000, but your bank SMS has not arrived. What should you do?',
        options: ['Hand over the item immediately', 'Open your own UPI/bank app and check actual credited balance first', 'Ask them to send another screenshot'],
        answer: 1
      },
      {
        q: 'An unknown caller asks you to install AnyDesk or TeamViewer to "fix a KYC issue". What is the risk?',
        options: ['They can view your screen and capture OTPs/banking credentials', 'It speeds up your phone', 'No risk if you keep Wi-Fi on'],
        answer: 0
      },
      {
        q: 'Which URL indicator shows encrypted communication between your browser and a website?',
        options: ['http://', 'https:// with a valid domain', 'ftp://'],
        answer: 1
      },
      {
        q: 'What is "Digital Arrest" scam?',
        options: ['A real CBI arrest over WhatsApp video call', 'Fraudsters impersonating police/customs on video calls to extort money', 'An official court summons via SMS'],
        answer: 1
      }
    ]
  },
  post: {
    label: 'Post-Assessment (Mastery & Emergency Response)',
    questions: [
      {
        q: 'What is the National Cybercrime Helpline number in India for immediate financial fraud reporting?',
        options: ['1930', '108', '1999'],
        answer: 0
      },
      {
        q: 'Within how many hours ("Golden Hour") should financial cyber fraud be reported to maximize chances of freezing funds?',
        options: ['Within the first 1–2 hours', 'After 15 days', 'Only after visiting a court'],
        answer: 0
      },
      {
        q: 'Which is the official Government of India portal for filing online cybercrime complaints?',
        options: ['https://cybercrime.gov.in', 'http://india-cyber-help.tk', 'https://report-scam-now.xyz'],
        answer: 0
      },
      {
        q: 'What 12-digit number is most critical to give 1930 officers when reporting a fraudulent UPI transaction?',
        options: ['Your phone IMEI', 'The 12-digit UTR / UPI Transaction Reference Number', 'Your Aadhaar enrollment ID'],
        answer: 1
      },
      {
        q: 'After spotting a phishing email on your account, what is the safest complete response?',
        options: ['Forward it to 10 friends', 'Do not click links, mark as phishing/spam, and enable 2FA if you interacted with it', 'Reply asking the scammer to stop'],
        answer: 1
      }
    ]
  }
};

let currentStage = 'pre';
let quizIdx = 0;
let quizCorrect = 0;

function selectAssessmentStage(stage) {
  currentStage = stage;
  quizIdx = 0;
  quizCorrect = 0;
  document.querySelectorAll('.stage-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.stage-btn[data-stage="${stage}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  const bank = assessmentBanks[currentStage];
  const questions = bank.questions;

  if (quizIdx >= questions.length) {
    const pct = Math.round((quizCorrect / questions.length) * 100);
    stats.quizzesCompleted++;
    stats.lastQuizScore = pct;
    saveStats();
    container.innerHTML = `
      <div class="result-box safe">
        <h4>🎉 ${bank.label} Complete!</h4>
        <p style="margin:0.5rem 0;">You scored <strong>${quizCorrect} out of ${questions.length} (${pct}%)</strong>.</p>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem;">
          <button class="btn-primary" onclick="resetQuiz()">Retake This Stage</button>
          ${currentStage === 'pre' ? `<button class="btn-secondary" onclick="selectAssessmentStage('mid')">Proceed to Assessment →</button>` : ''}
          ${currentStage === 'mid' ? `<button class="btn-secondary" onclick="selectAssessmentStage('post')">Proceed to Post-Assessment →</button>` : ''}
        </div>
      </div>`;
    return;
  }

  const item = questions[quizIdx];
  container.innerHTML = `
    <div style="color:#38bdf8;font-size:0.88rem;font-weight:600;margin-bottom:0.35rem;">${bank.label} — Question ${quizIdx + 1} of ${questions.length}</div>
    <p style="margin:0.65rem 0;font-size:1.05rem;">${item.q}</p>` +
    item.options.map((opt, i) => `<button class="option-btn" onclick="answerQuiz(${i})">${opt}</button>`).join('');
}

function answerQuiz(choice) {
  if (choice === assessmentBanks[currentStage].questions[quizIdx].answer) quizCorrect++;
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

// --- Tool 4: Expanded Fake Payment Screenshot Quiz ---
const paymentCases = [
  {
    app: 'PayQuick UPI',
    amount: '₹2,500.00',
    status: 'PAID SUCCESSFULLY',
    txnId: 'TXN_000000000',
    upi: 'customer@okaxis',
    time: 'Today, 25:61 PM',
    isFake: true,
    reason: 'Impossible timestamp ("25:61 PM") and placeholder transaction ID ("TXN_000000000") prove this receipt was edited.'
  },
  {
    app: 'PayQuick UPI',
    amount: '₹850.00',
    status: 'Completed',
    txnId: '419283746510',
    upi: 'shopkeeper@sbi',
    time: '24 Nov, 04:15 PM',
    isFake: false,
    reason: 'Valid 12-digit UTR number and realistic timestamp—though you should always still confirm the credit in your own bank app.'
  },
  {
    app: 'BharatPay Wallet',
    amount: '₹12,000.00',
    status: 'PAYMENT CREDITED ✅✅',
    txnId: '12345',
    upi: 'merchant-store@ybl',
    time: '32 Nov 2026, 11:10 AM',
    isFake: true,
    reason: 'Notice the non-existent date ("32 Nov"), 5-digit fake Txn ID ("12345"), and informal double-check emojis.'
  },
  {
    app: 'InstaBank IMPS',
    amount: '₹3,200.00',
    status: 'Settled',
    txnId: '632910485721',
    upi: 'traders.blr@icici',
    time: '25 Nov 2026, 02:42 PM',
    isFake: false,
    reason: 'Consistent 12-digit reference ID, clean typography, and valid timestamp.'
  },
  {
    app: 'G-Transfer UPI',
    amount: '₹1,499.00',
    status: 'Processing... (Money Will Arrive in 24 Hrs)',
    txnId: 'PENDING_9988',
    upi: 'buyer99@oksbi',
    time: '25 Nov 2026, 06:18 PM',
    isFake: true,
    reason: 'Scammers use fake "Processing" screens to trick sellers into handing over goods before any money actually leaves their account.'
  }
];

let payIdx = 0;

function renderPaymentQuiz() {
  const container = document.getElementById('paymentContainer');
  const p = paymentCases[payIdx % paymentCases.length];
  container.innerHTML = `
    <div style="text-align:center;color:#94a3b8;font-size:0.88rem;">Receipt ${(payIdx % paymentCases.length) + 1} of ${paymentCases.length}</div>
    <div class="receipt-box">
      <div class="receipt-header"><strong>${p.app}</strong><div style="color:#16a34a;font-weight:700;">${p.status}</div></div>
      <div class="receipt-row"><span>Amount:</span><strong>${p.amount}</strong></div>
      <div class="receipt-row"><span>To:</span><span>${p.upi}</span></div>
      <div class="receipt-row"><span>Txn ID:</span><span>${p.txnId}</span></div>
      <div class="receipt-row"><span>Time:</span><span>${p.time}</span></div>
    </div>
    <div style="display:flex;gap:1rem;justify-content:center;">
      <button class="btn-primary" onclick="checkPayment(false)">✅ Genuine</button>
      <button class="btn-secondary" onclick="checkPayment(true)">🚨 Fake Screenshot</button>
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
    <button class="btn-secondary" style="margin-top:0.75rem;" onclick="payIdx++;renderPaymentQuiz();">Next Receipt →</button>`;
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

// --- Tool 6: Expanded Privacy & Security Checkup (10 Items) ---
const checkupItems = [
  'I use unique passwords for every important email, banking, and social account.',
  'Two-Factor Authentication (2FA) is enabled on my email, WhatsApp, and bank apps.',
  'My phone and laptop OS are updated to the latest security patches.',
  'I never share OTPs, CVV numbers, or UPI PINs with anyone over call or chat.',
  'I check URLs for HTTPS and exact domain spelling before logging in.',
  'I never install remote screen-sharing apps (AnyDesk, TeamViewer) for strangers.',
  'I verify UPI payment credits inside my own bank app rather than trusting screenshots.',
  'I only download apps from official Google Play Store / Apple App Store (no unknown APK files).',
  'My social media profiles have privacy locks enabled to prevent photo/identity cloning.',
  'I have saved the National Cybercrime Helpline (1930) in my emergency contacts.'
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
  document.getElementById('hygieneCount').textContent = `${checked} / ${cbs.length}`;
  document.getElementById('hygieneScore').textContent = `${Math.round((checked / cbs.length) * 100)}%`;
}

// --- Initialize ---
checkAuthState();
renderQuiz();
renderScenario();
renderPaymentQuiz();
renderSimulator();
renderCheckup();