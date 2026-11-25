// --- State & LocalStorage Persistence ---
const defaultStats = {
  linksChecked: 0,
  quizzesCompleted: 0,
  scenariosSolved: 0,
  lastQuizScore: 0,
  completedChapters: [] // Tracks the 8 chapter-wise learning modules independently
};

let stats = JSON.parse(localStorage.getItem('cs_stats')) || { ...defaultStats };
if (!Array.isArray(stats.completedChapters)) stats.completedChapters = [];

let currentUser = JSON.parse(localStorage.getItem('cs_currentUser')) || null;
let generatedCode = null;

function saveStats() {
  localStorage.setItem('cs_stats', JSON.stringify(stats));
  updateDashboard();
  renderChaptersGrid();
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

// --- Navigation (Home, Modules, Dashboard, Report Crime, Feedback) ---
function switchSection(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  const activeNav = document.querySelector(`.nav-btn[data-section="${viewId}"]`);
  if (activeNav) activeNav.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
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

// --- Home Knowledge Hub Tab Switcher ---
function switchHomeHub(panelId) {
  document.querySelectorAll('.hub-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.hub-tab-btn').forEach(b => b.classList.remove('active'));

  const targetPanel = document.getElementById(panelId);
  if (targetPanel) targetPanel.classList.add('active');

  const activeBtn = document.querySelector(`.hub-tab-btn[data-hub="${panelId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const hubCard = document.getElementById('homeKnowledgeHub');
  if (hubCard) hubCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// --- Update Stats & Profile UI ---
function updateDashboard() {
  const completedCount = Math.min(8, stats.completedChapters.length);
  document.getElementById('statModules').textContent = `${completedCount} / 8`;
  const badge = document.getElementById('chapterProgressBadge');
  if (badge) badge.textContent = `${completedCount} / 8`;

  document.getElementById('statLinks').textContent = stats.linksChecked;
  document.getElementById('statQuizzes').textContent = stats.quizzesCompleted;
  document.getElementById('statScenarios').textContent = stats.scenariosSolved;

  const chapterContribution = (completedCount / 8) * 50;
  const quizContribution = (stats.lastQuizScore / 100) * 30;
  const activityContribution = Math.min(20, (stats.scenariosSolved * 5) + (stats.linksChecked * 2));
  const readiness = Math.min(100, Math.round(chapterContribution + quizContribution + activityContribution));
  document.getElementById('statScore').textContent = `${readiness}%`;

  if (currentUser) {
    document.getElementById('profileInitial').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('profileNameLabel').textContent = currentUser.name.split(' ')[0];
    document.getElementById('dropFullName').textContent = currentUser.name;
    document.getElementById('dropEmail').textContent = currentUser.email;
    document.getElementById('welcomeText').textContent = `Welcome back, ${currentUser.name}! Explore your 8 cybersecurity chapters and safety tools below.`;
    const fbNameInput = document.getElementById('fbName');
    if (fbNameInput && !fbNameInput.value) fbNameInput.value = currentUser.name;
  }
}

// =========================================================
// DEDICATED 8 CHAPTER-WISE LEARNING MODULES (Pre -> Lesson -> Post)
// =========================================================
const learningChapters = [
  {
    id: 1,
    title: 'UPI & Digital Payment Safety',
    summary: 'How QR code traps, collect requests, and fake payment screenshots work.',
    preQuestion: {
      q: 'Pre-Check: If someone wants to send you ₹1,000 via UPI, what do you need to do?',
      options: ['Scan their QR code and enter your UPI PIN', 'Nothing—money arrives directly without entering your PIN', 'Click a WhatsApp refund link'],
      answer: 1
    },
    lesson: {
      heading: 'How UPI Fraud Happens & How to Stay Safe',
      points: [
        'A UPI PIN is ONLY required when money is leaving your bank account—never when receiving money.',
        'Scammers send "Collect Requests" disguised as cashback or refunds; approving them deducts your balance.',
        'Always verify credited amounts inside your own bank/UPI app rather than trusting a buyer’s screenshot.'
      ],
      tip: 'Golden Rule: Never scan a QR code or enter your UPI PIN to receive money.'
    },
    postQuestion: {
      q: 'Post-Check: A buyer on OLX sends a QR code asking you to scan it to receive an advance payment. What is happening?',
      options: ['It is a standard business payment method', 'It is a scam attempt to deduct money from your account', 'It verifies your bank KYC'],
      answer: 1
    }
  },
  {
    id: 2,
    title: 'Phishing Links & Fake Domains',
    summary: 'Spot lookalike bank URLs, SMS lures, and malicious top-level domains.',
    preQuestion: {
      q: 'Pre-Check: Which of these URLs is the genuine Government of India cybercrime portal?',
      options: ['http://cybercrime-help.xyz', 'https://cybercrime.gov.in', 'https://gov-in-verify.tk'],
      answer: 1
    },
    lesson: {
      heading: 'Anatomy of a Phishing Link',
      points: [
        'Attackers register lookalike domains (such as sbi-kyc-alert.xyz) to steal net-banking passwords and OTPs.',
        'Always read the domain right before the first single "/" — subdomains like "sbi.verify-login.tk" belong to verify-login.tk, not SBI.',
        'Urgent threats ("Your electricity will be cut tonight" or "Account blocked") are classic social engineering triggers.'
      ],
      tip: 'Golden Rule: Never click banking or KYC links inside SMS/WhatsApp—open the official app directly.'
    },
    postQuestion: {
      q: 'Post-Check: In the URL "https://hdfc-bank.update-kyc.top/login", who actually owns the website?',
      options: ['HDFC Bank', 'update-kyc.top', 'Reserve Bank of India'],
      answer: 1
    }
  },
  {
    id: 3,
    title: '"Digital Arrest" & Impersonation Scams',
    summary: 'Recognize fake police, CBI, customs, and courier extortion video calls.',
    preQuestion: {
      q: 'Pre-Check: Can Indian Police or CBI place you under "Digital Arrest" over a Skype or WhatsApp video call?',
      options: ['Yes, for parcel cases', 'No—Indian law enforcement never conducts arrests or collects money via video call', 'Only on weekends'],
      answer: 1
    },
    lesson: {
      heading: 'How Fake Police & Courier Scams Operate',
      points: [
        'Scammers call claiming a parcel in your name contains illegal items and transfer you to a fake police studio on video call.',
        'They threaten arrest unless you stay on camera and transfer "verification" or "bail" funds to an RBI/court account.',
        'No government agency ever asks citizens to transfer money online to prove innocence.'
      ],
      tip: 'Golden Rule: Disconnect the video call immediately, block the number, and report on 1930.'
    },
    postQuestion: {
      q: 'Post-Check: A caller in a police uniform on WhatsApp video warns you not to tell anyone and demands ₹50,000 to clear a fake courier case. What should you do?',
      options: ['Transfer the money quickly', 'Hang up immediately—it is a Digital Arrest scam—and report it on 1930', 'Share your Aadhaar card on video'],
      answer: 1
    }
  },
  {
    id: 4,
    title: 'Strong Passwords & 2FA Defense',
    summary: 'Protect email, banking, and social accounts from credential stuffing.',
    preQuestion: {
      q: 'Pre-Check: Why is using the same password across multiple websites risky?',
      options: ['It slows down your browser', 'If one site suffers a data breach, hackers can unlock all your other accounts', 'Websites block repeated passwords'],
      answer: 1
    },
    lesson: {
      heading: 'Building Unbreakable Account Security',
      points: [
        'Use a unique 12+ character passphrase for every critical account (primary email, banking, GitHub, Instagram).',
        'Enable Two-Factor Authentication (2FA) using an Authenticator app or SMS OTP so a stolen password alone cannot log in.',
        'Never share 6-digit WhatsApp or email verification codes with anyone—even friends whose accounts may be hacked.'
      ],
      tip: 'Golden Rule: Turn on 2FA on your primary email first, because email controls password resets for everything else.'
    },
    postQuestion: {
      q: 'Post-Check: A friend messages you on WhatsApp asking for a 6-digit code sent to your SMS by mistake. What is happening?',
      options: ['They are trying to hijack your WhatsApp account', 'They are backing up their photos', 'It is a normal network check'],
      answer: 0
    }
  },
  {
    id: 5,
    title: 'Safe Apps & Remote Access Traps',
    summary: 'Why unknown APK files and screen-sharing apps drain bank accounts.',
    preQuestion: {
      q: 'Pre-Check: Should you install an ".apk" file sent on WhatsApp to claim a reward or update bank KYC?',
      options: ['Yes, if the icon looks official', 'No—sideloaded APKs can read your SMS OTPs and steal banking credentials', 'Only on Android phones'],
      answer: 1
    },
    lesson: {
      heading: 'Protecting Your Device from Malware & Screen Spying',
      points: [
        'Malicious APK files disguised as wedding invites, challans, or bank rewards silently forward your incoming OTP SMS to attackers.',
        'Remote desktop apps (AnyDesk, TeamViewer, QuickSupport) let strangers watch your screen in real time.',
        'Keep Google Play Protect enabled and install apps strictly from official app stores.'
      ],
      tip: 'Golden Rule: Never install AnyDesk/TeamViewer on instructions from customer care callers.'
    },
    postQuestion: {
      q: 'Post-Check: Why do scammers ask victims to install AnyDesk during a fake customer support call?',
      options: ['To fix battery drain', 'To mirror the victim’s screen and capture banking logins and OTPs', 'To update Android OS'],
      answer: 1
    }
  },
  {
    id: 6,
    title: 'Social Media Privacy & Identity Theft',
    summary: 'Prevent profile cloning, morphed images, and oversharing risks.',
    preQuestion: {
      q: 'Pre-Check: What is profile cloning on Instagram or Facebook?',
      options: ['Creating a backup account', 'Scammers copying your public photos and name to ask your friends for urgent money', 'Syncing contacts'],
      answer: 1
    },
    lesson: {
      heading: 'Locking Down Your Digital Footprint',
      points: [
        'Public photos, birthdates, and college/workplace details make it easy for scammers to impersonate you or guess security questions.',
        'Set personal social media accounts to Private and hide your friend/follower list from strangers.',
        'Verify via a phone call before sending money to a friend who messages asking for an "emergency loan" on social media.'
      ],
      tip: 'Golden Rule: Always call your friend on their real phone number before transferring emergency money.'
    },
    postQuestion: {
      q: 'Post-Check: Your friend DMs you on Instagram asking for ₹5,000 urgently for a hospital bill via a new UPI ID. What should you do first?',
      options: ['Send the money immediately', 'Call your friend directly on their saved phone number to verify', 'Reply with your bank details'],
      answer: 1
    }
  },
  {
    id: 7,
    title: 'Part-Time Job & Task Scam Awareness',
    summary: 'How "like YouTube videos / rate hotels" Telegram scams steal lakhs.',
    preQuestion: {
      q: 'Pre-Check: Why do Telegram "work-from-home task" scammers pay ₹150–₹500 at the very beginning?',
      options: ['Because it is a genuine company', 'To build false trust before demanding large "prepaid VIP deposits" they never return', 'Government stipend'],
      answer: 1
    },
    lesson: {
      heading: 'How Prepaid Task & Investment Scams Work',
      points: [
        'Scammers reach out via WhatsApp/Telegram offering easy money for liking videos or rating hotels.',
        'After paying a small initial amount to gain trust, they move victims to "prepaid crypto/merchant tasks" requiring ₹10,000 to ₹2,00,000.',
        'When the victim tries to withdraw, the scammers demand "taxes" or "unlock fees" and block them.'
      ],
      tip: 'Golden Rule: A real job pays you for your work—it never asks you to deposit your own money to unlock earnings.'
    },
    postQuestion: {
      q: 'Post-Check: What is the biggest red flag of an online part-time job offer?',
      options: ['Asking for a resume', 'Asking you to deposit money first to complete "prepaid tasks" or withdraw earnings', 'Conducting a video interview'],
      answer: 1
    }
  },
  {
    id: 8,
    title: 'The 1930 "Golden Hour" Emergency Protocol',
    summary: 'Exact steps to freeze stolen money within the first 2 hours of fraud.',
    preQuestion: {
      q: 'Pre-Check: What is the most important 12-digit identifier needed when reporting a fraudulent UPI/bank transfer?',
      options: ['Your Wi-Fi MAC address', 'The 12-digit UTR (Unique Transaction Reference) number', 'Your phone serial number'],
      answer: 1
    },
    lesson: {
      heading: 'Immediate Action Plan When Cyber Fraud Strikes',
      points: [
        'Act within the first 1–2 hours ("Golden Hour"): dial 1930 immediately so the Citizen Financial Cyber Fraud Reporting System can put a lien/freeze on the scammer’s account.',
        'File a detailed complaint on https://cybercrime.gov.in with screenshots of the transaction, UTR number, and scammer’s UPI/phone details.',
        'Call your bank’s official toll-free number to block compromised cards, UPI, or internet banking.'
      ],
      tip: 'Golden Rule: Speed saves money—report on 1930 first before visiting a police station.'
    },
    postQuestion: {
      q: 'Post-Check: If someone loses money to a cyber scammer, what should be their very first step?',
      options: ['Wait 3 days to see if the bank refunds it automatically', 'Call 1930 immediately with the 12-digit UTR number and file at cybercrime.gov.in', 'Delete all chat messages'],
      answer: 1
    }
  }
];

let activeChapterId = null;
let activeChapterStep = 'pre';

function renderChaptersGrid() {
  const grid = document.getElementById('chaptersGrid');
  if (!grid) return;

  grid.innerHTML = learningChapters.map(ch => {
    const isDone = stats.completedChapters.includes(ch.id);
    return `
      <div class="chapter-card ${isDone ? 'completed-chap' : ''}" onclick="openChapter(${ch.id})">
        <div>
          <div class="chap-top">
            <span class="chap-num">Chapter ${ch.id}</span>
            <span class="chap-status ${isDone ? 'done' : 'pending'}">${isDone ? '✅ Completed' : 'Start Lesson'}</span>
          </div>
          <h4>${ch.title}</h4>
          <p>${ch.summary}</p>
        </div>
        <button type="button" class="btn-secondary" style="width:100%;padding:0.5rem;">
          ${isDone ? 'Review Chapter' : 'Open Chapter →'}
        </button>
      </div>
    `;
  }).join('');
}

function openChapter(chapterId) {
  activeChapterId = chapterId;
  activeChapterStep = 'pre';
  const ch = learningChapters.find(c => c.id === chapterId);
  if (!ch) return;

  const reader = document.getElementById('chapterReaderCard');
  reader.classList.remove('hidden');
  document.getElementById('readerChapterTag').textContent = `Chapter ${ch.id} of ${learningChapters.length}`;
  document.getElementById('readerTitle').textContent = ch.title;
  document.getElementById('readerSubtitle').textContent = ch.summary;

  switchChapterStep('pre');
  reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeChapterReader() {
  document.getElementById('chapterReaderCard').classList.add('hidden');
  activeChapterId = null;
}

function switchChapterStep(step) {
  activeChapterStep = step;
  ['pre', 'lesson', 'post'].forEach(s => {
    const btn = document.getElementById(`chapTab${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (btn) btn.classList.toggle('active', s === step);
  });

  const ch = learningChapters.find(c => c.id === activeChapterId);
  const box = document.getElementById('chapterStepContent');
  if (!ch || !box) return;

  if (step === 'pre') {
    const pq = ch.preQuestion;
    box.innerHTML = `
      <p style="margin-bottom:0.75rem;font-size:1.05rem;"><strong>${pq.q}</strong></p>
      ${pq.options.map((opt, idx) => `<button type="button" class="option-btn" onclick="answerChapterPre(${idx})">${opt}</button>`).join('')}
      <div id="chapPreFeedback" class="result-box hidden"></div>
    `;
  } else if (step === 'lesson') {
    box.innerHTML = `
      <div class="lesson-body">
        <h4>${ch.lesson.heading}</h4>
        <ul class="lesson-points">
          ${ch.lesson.points.map(pt => `<li>${pt}</li>`).join('')}
        </ul>
        <div class="lesson-tip-box">🛡️ <strong>${ch.lesson.tip}</strong></div>
        <button type="button" class="btn-primary" onclick="switchChapterStep('post')">Proceed to Chapter Post-Check →</button>
      </div>
    `;
  } else if (step === 'post') {
    const postQ = ch.postQuestion;
    box.innerHTML = `
      <p style="margin-bottom:0.75rem;font-size:1.05rem;"><strong>${postQ.q}</strong></p>
      ${postQ.options.map((opt, idx) => `<button type="button" class="option-btn" onclick="answerChapterPost(${idx})">${opt}</button>`).join('')}
      <div id="chapPostFeedback" class="result-box hidden"></div>
    `;
  }
}

function answerChapterPre(choice) {
  const ch = learningChapters.find(c => c.id === activeChapterId);
  const fb = document.getElementById('chapPreFeedback');
  const isRight = choice === ch.preQuestion.answer;
  fb.classList.remove('hidden', 'safe', 'warn');
  fb.classList.add(isRight ? 'safe' : 'warn');
  fb.innerHTML = `
    <strong>${isRight ? '✅ Great baseline instinct!' : '💡 Good try—let’s learn why in the lesson!'}</strong>
    <p style="margin:0.4rem 0;">Now read the core lesson to master this topic.</p>
    <button type="button" class="btn-primary" style="margin-top:0.5rem;" onclick="switchChapterStep('lesson')">Read Chapter Lesson →</button>
  `;
}

function answerChapterPost(choice) {
  const ch = learningChapters.find(c => c.id === activeChapterId);
  const fb = document.getElementById('chapPostFeedback');
  const isRight = choice === ch.postQuestion.answer;

  if (isRight) {
    if (!stats.completedChapters.includes(ch.id)) {
      stats.completedChapters.push(ch.id);
      saveStats();
    }
    const nextId = ch.id < learningChapters.length ? ch.id + 1 : null;
    fb.classList.remove('hidden', 'danger');
    fb.classList.add('safe');
    fb.innerHTML = `
      <strong>🎉 Chapter ${ch.id} Completed! (${stats.completedChapters.length} / 8 Modules Done)</strong>
      <p style="margin:0.4rem 0;">You answered correctly and unlocked completion for <strong>${ch.title}</strong>.</p>
      ${nextId
        ? `<button type="button" class="btn-primary" style="margin-top:0.5rem;" onclick="openChapter(${nextId})">Start Chapter ${nextId} →</button>`
        : `<button type="button" class="btn-primary" style="margin-top:0.5rem;" onclick="switchSection('dashboard')">All 8 Chapters Complete! Go to Dashboard →</button>`
      }
    `;
  } else {
    fb.classList.remove('hidden', 'safe');
    fb.classList.add('danger');
    fb.innerHTML = `
      <strong>❌ Not quite!</strong>
      <p style="margin:0.4rem 0;">Review the key takeaway in the lesson and try the Post-Check again to complete this chapter.</p>
      <button type="button" class="btn-secondary" style="margin-top:0.5rem;" onclick="switchChapterStep('lesson')">← Back to Lesson</button>
    `;
  }
}

// --- Myths vs. Facts & Cybercrime Stories Content ---
const mythsAndFacts = [
  {
    myth: '“I need to enter my UPI PIN or scan a QR code to receive money.”',
    fact: 'Entering a UPI PIN or scanning a QR code ONLY deducts money from your account—never to receive funds.'
  },
  {
    myth: '“Only people with lots of money in their bank get targeted by hackers.”',
    fact: 'Automated phishing SMS and fake job/parcel links target everyone indiscriminately—students are among the most targeted groups.'
  },
  {
    myth: '“If a website has a padlock icon (HTTPS), it is 100% safe and genuine.”',
    fact: 'HTTPS only encrypts traffic; scammers also register fake domains with free SSL certificates (e.g., https://bank-kyc-update.xyz).'
  },
  {
    myth: '“Police or CBI officers conduct ‘Digital Arrests’ over WhatsApp/Skype video calls.”',
    fact: 'Indian law enforcement NEVER conducts arrests or demands bail transfers over video calls. Hang up immediately and dial 1930.'
  }
];

const cyberStories = [
  {
    tag: 'Case Study #1 • Fake Courier & Digital Arrest',
    title: 'The Parcel With Illegal Items Call',
    story: 'A Bengaluru engineering student received an IVR call claiming a FedEx parcel in her name contained illegal drugs. She was transferred to a fake “cyber officer” on Skype who demanded ₹45,000 for “account verification.”',
    lesson: 'Takeaway: Courier companies and police never demand money over video calls to clear your name.'
  },
  {
    tag: 'Case Study #2 • Marketplace QR Code Trap',
    title: 'Selling a Used Study Table Online',
    story: 'While selling furniture online, a buyer sent a QR code saying “Scan this to receive ₹3,500 advance.” The seller entered their UPI PIN and lost ₹3,500 instead of receiving it.',
    lesson: 'Takeaway: Never scan a QR code or enter your UPI PIN when you are the one receiving payment.'
  },
  {
    tag: 'Case Study #3 • Golden Hour 1930 Recovery',
    title: 'How Reporting Within 40 Minutes Saved ₹28,000',
    story: 'A victim clicked a fake electricity bill SMS link and lost ₹28,000. Instead of waiting until the next day, they called 1930 within 40 minutes with the 12-digit UTR number, freezing the funds before withdrawal.',
    lesson: 'Takeaway: Dial 1930 immediately within the first 1–2 hours ("Golden Hour") to block fraudulent transfers.'
  }
];

function renderMythsAndStories() {
  const mythsGrid = document.getElementById('mythsGrid');
  if (mythsGrid) {
    mythsGrid.innerHTML = mythsAndFacts.map(item => `
      <div class="myth-card">
        <span class="myth-tag">❌ MYTH</span>
        <p><strong>${item.myth}</strong></p>
        <div class="fact-box">
          <strong>✅ FACT</strong>
          <span>${item.fact}</span>
        </div>
      </div>
    `).join('');
  }

  const storiesGrid = document.getElementById('storiesGrid');
  if (storiesGrid) {
    storiesGrid.innerHTML = cyberStories.map(s => `
      <div class="story-card">
        <span class="story-badge">${s.tag}</span>
        <h4>${s.title}</h4>
        <p>${s.story}</p>
        <div class="story-lesson">🛡️ ${s.lesson}</div>
      </div>
    `).join('');
  }
}

// --- Separate Feedback Page Logic ---
function renderRecentFeedback() {
  const allFeedback = JSON.parse(localStorage.getItem('cs_feedback')) || [];
  const box = document.getElementById('recentFeedbackBox');
  const list = document.getElementById('recentFeedbackList');
  if (!box || !list) return;

  if (allFeedback.length === 0) {
    box.classList.add('hidden');
    return;
  }

  box.classList.remove('hidden');
  list.innerHTML = allFeedback.slice().reverse().map(item => `
    <div class="fb-entry">
      <div class="fb-entry-meta">
        <span><strong>${item.category}</strong> • ${item.rating || ''}</span>
        <span>${item.date}</span>
      </div>
      <p>${item.message}</p>
    </div>
  `).join('');
}

document.getElementById('feedbackForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('fbName').value.trim();
  const email = document.getElementById('fbEmail').value.trim();
  const category = document.getElementById('fbCategory').value;
  const rating = document.getElementById('fbRating').value;
  const message = document.getElementById('fbMessage').value.trim();

  const allFeedback = JSON.parse(localStorage.getItem('cs_feedback')) || [];
  allFeedback.push({ name, email, category, rating, message, date: new Date().toLocaleString() });
  localStorage.setItem('cs_feedback', JSON.stringify(allFeedback));

  const statusEl = document.getElementById('fbStatus');
  statusEl.textContent = `✅ Thank you, ${name}! Your "${category}" submission has been recorded.`;
  statusEl.classList.remove('hidden');
  document.getElementById('feedbackForm').reset();
  if (currentUser) document.getElementById('fbName').value = currentUser.name;
  renderRecentFeedback();
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

// --- Tool 2: Standalone 3-Stage Assessments (Independent of Chapter Modules) ---
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
    label: 'Assessment (Applied Scam Detection)',
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
        q: 'What is a "Digital Arrest" scam?',
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
renderChaptersGrid();
renderMythsAndStories();
renderRecentFeedback();
renderQuiz();
renderScenario();
renderPaymentQuiz();
renderSimulator();
renderCheckup();