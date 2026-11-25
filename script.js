// --- State & LocalStorage Persistence ---
const defaultStats = {
  linksChecked: 0,
  postAssessmentsDone: 0,
  scenariosSolved: 0,
  completedChapters: [] // Tracks Module 1 through Module 8
};

let stats = JSON.parse(localStorage.getItem('cs_stats')) || { ...defaultStats };
if (!Array.isArray(stats.completedChapters)) stats.completedChapters = [];
if (typeof stats.postAssessmentsDone !== 'number') stats.postAssessmentsDone = 0;

let currentUser = JSON.parse(localStorage.getItem('cs_currentUser')) || null;
let generatedCode = null;
let forgotResetCode = null;

function saveStats() {
  localStorage.setItem('cs_stats', JSON.stringify(stats));
  updateDashboard();
  renderChaptersGrid();
}

// --- Login-First Gate, Forgot Password & Change Password Logic ---
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

function showGateForm(which) {
  document.getElementById('loginForm').classList.toggle('hidden', which !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', which !== 'register');
  document.getElementById('forgotForm').classList.toggle('hidden', which !== 'forgot');

  document.getElementById('loginTabBtn').classList.toggle('active', which === 'login');
  document.getElementById('registerTabBtn').classList.toggle('active', which === 'register');
}

document.getElementById('loginTabBtn').addEventListener('click', () => showGateForm('login'));
document.getElementById('registerTabBtn').addEventListener('click', () => showGateForm('register'));
document.getElementById('openForgotBtn').addEventListener('click', () => showGateForm('forgot'));
document.getElementById('backToLoginBtn').addEventListener('click', () => showGateForm('login'));

document.getElementById('sendCodeBtn').addEventListener('click', () => {
  generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  const banner = document.getElementById('demoCodeBanner');
  banner.textContent = `Verification Code: ${generatedCode}`;
  banner.classList.remove('hidden');
});

document.getElementById('sendForgotCodeBtn').addEventListener('click', () => {
  forgotResetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const banner = document.getElementById('forgotCodeBanner');
  banner.textContent = `Reset Verification Code: ${forgotResetCode}`;
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
    msg.textContent = 'Invalid email or password (or use Forgot Password / Create Profile).';
    return;
  }

  currentUser = found;
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));
  checkAuthState();
});

document.getElementById('forgotForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  const code = document.getElementById('forgotCode').value.trim();
  const newPass = document.getElementById('forgotNewPassword').value;
  const msg = document.getElementById('forgotMsg');

  if (!forgotResetCode || code !== forgotResetCode) {
    msg.textContent = 'Please click "Get Code" and enter the 6-digit reset code.';
    return;
  }

  const users = JSON.parse(localStorage.getItem('cs_users')) || [];
  const userIdx = users.findIndex(u => u.email === email);
  if (userIdx === -1) {
    msg.textContent = 'No account found with that email. Please create a profile first.';
    return;
  }

  users[userIdx].password = newPass;
  localStorage.setItem('cs_users', JSON.stringify(users));
  currentUser = users[userIdx];
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));
  msg.textContent = '';
  showGateForm('login');
  checkAuthState();
});

document.getElementById('demoQuickLoginBtn').addEventListener('click', () => {
  const demoUser = { name: 'Dedeepya Reddy', email: 'citizen@cybershield.in', password: 'password123' };
  const users = JSON.parse(localStorage.getItem('cs_users')) || [];
  if (!users.find(u => u.email === demoUser.email)) {
    users.push(demoUser);
    localStorage.setItem('cs_users', JSON.stringify(users));
  }
  currentUser = users.find(u => u.email === demoUser.email) || demoUser;
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));
  checkAuthState();
});

// Change Password Modal (Inside Profile Dropdown)
function openChangePasswordModal() {
  closeProfileMenu();
  document.getElementById('changePassForm').reset();
  document.getElementById('changePassMsg').textContent = '';
  document.getElementById('changePassModal').classList.remove('hidden');
}

document.getElementById('closeChangePassBtn').addEventListener('click', () => {
  document.getElementById('changePassModal').classList.add('hidden');
});

document.getElementById('changePassForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const oldPass = document.getElementById('oldPasswordInput').value;
  const newPass = document.getElementById('newPasswordInput').value;
  const confirmPass = document.getElementById('confirmNewPasswordInput').value;
  const msg = document.getElementById('changePassMsg');

  if (!currentUser) return;

  if (currentUser.password && oldPass !== currentUser.password) {
    msg.style.color = '#dc2626';
    msg.textContent = 'Current password is incorrect.';
    return;
  }

  if (newPass !== confirmPass) {
    msg.style.color = '#dc2626';
    msg.textContent = 'New passwords do not match.';
    return;
  }

  currentUser.password = newPass;
  localStorage.setItem('cs_currentUser', JSON.stringify(currentUser));

  const users = JSON.parse(localStorage.getItem('cs_users')) || [];
  const idx = users.findIndex(u => u.email === currentUser.email);
  if (idx !== -1) {
    users[idx].password = newPass;
    localStorage.setItem('cs_users', JSON.stringify(users));
  }

  msg.style.color = '#16a34a';
  msg.textContent = '✅ Password updated successfully!';
  setTimeout(() => {
    document.getElementById('changePassModal').classList.add('hidden');
  }, 1100);
});

function logout() {
  currentUser = null;
  localStorage.removeItem('cs_currentUser');
  closeProfileMenu();
  showGateForm('login');
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

function openDashboardTool(toolId) {
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
  document.getElementById('statQuizzes').textContent = stats.postAssessmentsDone;
  document.getElementById('statScenarios').textContent = stats.scenariosSolved;

  const moduleScore = (completedCount / 8) * 70;
  const toolScore = Math.min(30, (stats.scenariosSolved * 6) + (stats.linksChecked * 3));
  const readiness = Math.min(100, Math.round(moduleScore + toolScore));
  document.getElementById('statScore').textContent = `${readiness}%`;

  if (currentUser) {
    document.getElementById('profileInitial').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('profileNameLabel').textContent = currentUser.name.split(' ')[0];
    document.getElementById('dropFullName').textContent = currentUser.name;
    document.getElementById('dropEmail').textContent = currentUser.email;
    document.getElementById('welcomeText').textContent = `Welcome back, ${currentUser.name}! Open Modules 1 to 8 to explore lessons, Pre-Assessments, and Post-Assessments.`;
    const fbNameInput = document.getElementById('fbName');
    if (fbNameInput && !fbNameInput.value) fbNameInput.value = currentUser.name;
  }
}

// =========================================================
// MODULES 1 TO 8 (Each Module -> Module Content, Pre-Assessment, Post-Assessment)
// =========================================================
const learningModules = [
  {
    id: 1,
    label: 'Module 1',
    title: 'UPI & Digital Payment Safety',
    summary: 'How QR code traps, collect requests, and fake payment screenshots work.',
    lesson: {
      heading: 'Module 1 Content: How UPI Fraud Happens & How to Stay Safe',
      points: [
        'A UPI PIN is ONLY required when money is leaving your bank account—never when receiving money.',
        'Scammers send "Collect Requests" disguised as cashback or refunds; approving them deducts your balance.',
        'Always verify credited amounts inside your own bank/UPI app rather than trusting a buyer’s screenshot.'
      ],
      tip: 'Golden Rule: Never scan a QR code or enter your UPI PIN to receive money.'
    },
    preAssessment: [
      {
        q: 'If someone wants to send you ₹1,000 via UPI, what do you need to do?',
        options: ['Scan their QR code and enter your UPI PIN', 'Nothing—money arrives directly without entering your PIN', 'Click a WhatsApp refund link'],
        answer: 1
      },
      {
        q: 'What happens if you approve an unknown UPI "Collect Request"?',
        options: ['Money is added to your bank', 'Money is deducted from your bank account', 'Your KYC gets updated'],
        answer: 1
      }
    ],
    postAssessment: [
      {
        q: 'A buyer sends a QR code asking you to scan it to receive an advance payment. What is happening?',
        options: ['Standard business payment', 'A scam attempt to deduct money from your account', 'Bank verification'],
        answer: 1
      },
      {
        q: 'A customer shows a "Payment Successful" screenshot, but your bank SMS has not arrived. What should you do?',
        options: ['Hand over the item immediately', 'Check your actual bank/UPI transaction history inside your own app first', 'Ask for another screenshot'],
        answer: 1
      }
    ]
  },
  {
    id: 2,
    label: 'Module 2',
    title: 'Phishing Links & Fake Domains',
    summary: 'Spot lookalike bank URLs, SMS lures, and malicious top-level domains.',
    lesson: {
      heading: 'Module 2 Content: Anatomy of a Phishing Link',
      points: [
        'Attackers register lookalike domains (such as sbi-kyc-alert.xyz) to steal net-banking passwords and OTPs.',
        'Always read the domain right before the first single "/" — subdomains like "sbi.verify-login.tk" belong to verify-login.tk, not SBI.',
        'Urgent threats ("Your electricity will be cut tonight" or "Account blocked") are classic social engineering triggers.'
      ],
      tip: 'Golden Rule: Never click banking or KYC links inside SMS/WhatsApp—open the official app directly.'
    },
    preAssessment: [
      {
        q: 'Which of these URLs is the genuine Government of India cybercrime portal?',
        options: ['http://cybercrime-help.xyz', 'https://cybercrime.gov.in', 'https://gov-in-verify.tk'],
        answer: 1
      },
      {
        q: 'Does the HTTPS padlock icon guarantee that a website is not a scam?',
        options: ['Yes, 100% safe', 'No—scammers also use free SSL certificates on fake domains', 'Only on mobile phones'],
        answer: 1
      }
    ],
    postAssessment: [
      {
        q: 'In the URL "https://hdfc-bank.update-kyc.top/login", who actually owns the website?',
        options: ['HDFC Bank', 'update-kyc.top', 'Reserve Bank of India'],
        answer: 1
      },
      {
        q: 'You receive an SMS warning that your electricity will be disconnected tonight unless you click a link. What is the safe action?',
        options: ['Click and pay ₹10 immediately', 'Ignore the link and check your official electricity board app/bill directly', 'Reply with your consumer ID'],
        answer: 1
      }
    ]
  },
  {
    id: 3,
    label: 'Module 3',
    title: '"Digital Arrest" & Impersonation Scams',
    summary: 'Recognize fake police, CBI, customs, and courier extortion video calls.',
    lesson: {
      heading: 'Module 3 Content: How Fake Police & Courier Scams Operate',
      points: [
        'Scammers call claiming a parcel in your name contains illegal items and transfer you to a fake police studio on video call.',
        'They threaten arrest unless you stay on camera and transfer "verification" or "bail" funds to an RBI/court account.',
        'No government agency ever asks citizens to transfer money online to prove innocence.'
      ],
      tip: 'Golden Rule: Disconnect the video call immediately, block the number, and report on 1930.'
    },
    preAssessment: [
      {
        q: 'Can Indian Police or CBI place you under "Digital Arrest" over a Skype or WhatsApp video call?',
        options: ['Yes, for parcel cases', 'No—Indian law enforcement never conducts arrests or collects money via video call', 'Only on weekends'],
        answer: 1
      },
      {
        q: 'Do real courts or RBI ever ask citizens to transfer money to "verify" innocence?',
        options: ['Never', 'Yes, via UPI', 'Only for students'],
        answer: 0
      }
    ],
    postAssessment: [
      {
        q: 'A caller in a police uniform on WhatsApp video warns you not to tell anyone and demands ₹50,000 to clear a fake courier case. What should you do?',
        options: ['Transfer the money quickly', 'Hang up immediately—it is a Digital Arrest scam—and report it on 1930', 'Share your Aadhaar card on video'],
        answer: 1
      },
      {
        q: 'Why do Digital Arrest scammers order victims to stay on camera without informing family?',
        options: ['To isolate the victim so nobody alerts them that it is a scam', 'Standard police rule', 'To record attendance'],
        answer: 0
      }
    ]
  },
  {
    id: 4,
    label: 'Module 4',
    title: 'Strong Passwords & 2FA Defense',
    summary: 'Protect email, banking, and social accounts from credential stuffing.',
    lesson: {
      heading: 'Module 4 Content: Building Unbreakable Account Security',
      points: [
        'Use a unique 12+ character passphrase for every critical account (primary email, banking, GitHub, Instagram).',
        'Enable Two-Factor Authentication (2FA) using an Authenticator app or SMS OTP so a stolen password alone cannot log in.',
        'Never share 6-digit WhatsApp or email verification codes with anyone—even friends whose accounts may be hacked.'
      ],
      tip: 'Golden Rule: Turn on 2FA on your primary email first, because email controls password resets for everything else.'
    },
    preAssessment: [
      {
        q: 'Why is using the same password across multiple websites risky?',
        options: ['It slows down your browser', 'If one site suffers a data breach, hackers can unlock all your other accounts', 'Websites block repeated passwords'],
        answer: 1
      },
      {
        q: 'What does 2FA (Two-Factor Authentication) add to your login?',
        options: ['A second verification step beyond just your password', 'Faster Wi-Fi', 'Automatic password sharing'],
        answer: 0
      }
    ],
    postAssessment: [
      {
        q: 'A friend messages you on WhatsApp asking for a 6-digit code sent to your SMS by mistake. What is happening?',
        options: ['They are trying to hijack your WhatsApp account', 'They are backing up their photos', 'Normal network check'],
        answer: 0
      },
      {
        q: 'Which account should you secure with 2FA first?',
        options: ['Your primary email account, since it resets passwords for all other services', 'A random gaming forum', 'None'],
        answer: 0
      }
    ]
  },
  {
    id: 5,
    label: 'Module 5',
    title: 'Safe Apps & Remote Access Traps',
    summary: 'Why unknown APK files and screen-sharing apps drain bank accounts.',
    lesson: {
      heading: 'Module 5 Content: Protecting Your Device from Malware & Screen Spying',
      points: [
        'Malicious APK files disguised as wedding invites, challans, or bank rewards silently forward your incoming OTP SMS to attackers.',
        'Remote desktop apps (AnyDesk, TeamViewer, QuickSupport) let strangers watch your screen in real time.',
        'Keep Google Play Protect enabled and install apps strictly from official app stores.'
      ],
      tip: 'Golden Rule: Never install AnyDesk/TeamViewer on instructions from customer care callers.'
    },
    preAssessment: [
      {
        q: 'Should you install an ".apk" file sent on WhatsApp to view a wedding invite or traffic challan?',
        options: ['Yes, if it looks urgent', 'No—sideloaded APKs can read your SMS OTPs and steal banking credentials', 'Only on Android'],
        answer: 1
      },
      {
        q: 'What does a screen-sharing app like AnyDesk allow a caller to do?',
        options: ['View everything on your phone screen including OTPs and banking apps', 'Only change wallpaper', 'Boost battery life'],
        answer: 0
      }
    ],
    postAssessment: [
      {
        q: 'Why do scammers ask victims to install AnyDesk during a fake customer support call?',
        options: ['To fix battery drain', 'To mirror the victim’s screen and capture banking logins and OTPs', 'To update Android OS'],
        answer: 1
      },
      {
        q: 'If you accidentally installed a suspicious APK from WhatsApp, what should you do immediately?',
        options: ['Turn on Airplane Mode, uninstall the app, and check bank activity', 'Forward it to friends', 'Leave it installed'],
        answer: 0
      }
    ]
  },
  {
    id: 6,
    label: 'Module 6',
    title: 'Social Media Privacy & Identity Theft',
    summary: 'Prevent profile cloning, morphed images, and oversharing risks.',
    lesson: {
      heading: 'Module 6 Content: Locking Down Your Digital Footprint',
      points: [
        'Public photos, birthdates, and college/workplace details make it easy for scammers to impersonate you or guess security questions.',
        'Set personal social media accounts to Private and hide your friend/follower list from strangers.',
        'Verify via a phone call before sending money to a friend who messages asking for an "emergency loan" on social media.'
      ],
      tip: 'Golden Rule: Always call your friend on their real phone number before transferring emergency money.'
    },
    preAssessment: [
      {
        q: 'What is profile cloning on Instagram or Facebook?',
        options: ['Creating a backup account', 'Scammers copying your public photos and name to ask your friends for urgent money', 'Syncing contacts'],
        answer: 1
      },
      {
        q: 'Who can see your photos and friend list if your social profile is set to Public?',
        options: ['Anyone on the internet, including scammers', 'Only your family', 'Nobody'],
        answer: 0
      }
    ],
    postAssessment: [
      {
        q: 'Your friend DMs you on Instagram asking for ₹5,000 urgently for a hospital bill via a new UPI ID. What should you do first?',
        options: ['Send the money immediately', 'Call your friend directly on their saved phone number to verify', 'Reply with your bank details'],
        answer: 1
      },
      {
        q: 'Which setting helps stop scammers from messaging all your contacts from a fake clone account?',
        options: ['Hiding your follower/friend list and setting your profile to Private', 'Posting your phone number in bio', 'Using weak passwords'],
        answer: 0
      }
    ]
  },
  {
    id: 7,
    label: 'Module 7',
    title: 'Part-Time Job & Task Scam Awareness',
    summary: 'How "like YouTube videos / rate hotels" Telegram scams steal lakhs.',
    lesson: {
      heading: 'Module 7 Content: How Prepaid Task & Investment Scams Work',
      points: [
        'Scammers reach out via WhatsApp/Telegram offering easy money for liking videos or rating hotels.',
        'After paying a small initial amount to gain trust, they move victims to "prepaid crypto/merchant tasks" requiring ₹10,000 to ₹2,00,000.',
        'When the victim tries to withdraw, the scammers demand "taxes" or "unlock fees" and block them.'
      ],
      tip: 'Golden Rule: A real job pays you for your work—it never asks you to deposit your own money to unlock earnings.'
    },
    preAssessment: [
      {
        q: 'Why do Telegram "work-from-home task" scammers pay ₹150–₹500 at the very beginning?',
        options: ['Because it is a genuine company', 'To build false trust before demanding large "prepaid VIP deposits" they never return', 'Government stipend'],
        answer: 1
      },
      {
        q: 'Should a legitimate employer ever ask you to deposit money to unlock your salary?',
        options: ['Never', 'Yes, always', 'Only for remote jobs'],
        answer: 0
      }
    ],
    postAssessment: [
      {
        q: 'What is the biggest red flag of an online part-time job offer?',
        options: ['Asking for a resume', 'Asking you to deposit money first to complete "prepaid tasks" or withdraw earnings', 'Conducting an interview'],
        answer: 1
      },
      {
        q: 'If you already lost money in a prepaid Telegram task group, what should you do?',
        options: ['Pay more "tax" to get a refund', 'Stop paying immediately, save screenshots/UTR IDs, and report on 1930', 'Delete Telegram'],
        answer: 1
      }
    ]
  },
  {
    id: 8,
    label: 'Module 8',
    title: 'The 1930 "Golden Hour" Emergency Protocol',
    summary: 'Exact steps to freeze stolen money within the first 2 hours of fraud.',
    lesson: {
      heading: 'Module 8 Content: Immediate Action Plan When Cyber Fraud Strikes',
      points: [
        'Act within the first 1–2 hours ("Golden Hour"): dial 1930 immediately so the Citizen Financial Cyber Fraud Reporting System can put a lien/freeze on the scammer’s account.',
        'File a detailed complaint on https://cybercrime.gov.in with screenshots of the transaction, UTR number, and scammer’s UPI/phone details.',
        'Call your bank’s official toll-free number to block compromised cards, UPI, or internet banking.'
      ],
      tip: 'Golden Rule: Speed saves money—report on 1930 first before visiting a police station.'
    },
    preAssessment: [
      {
        q: 'What is the most important 12-digit identifier needed when reporting a fraudulent UPI/bank transfer?',
        options: ['Your Wi-Fi MAC address', 'The 12-digit UTR (Unique Transaction Reference) number', 'Your phone serial number'],
        answer: 1
      },
      {
        q: 'What is the 24x7 National Cybercrime Helpline number in India?',
        options: ['1930', '108', '1999'],
        answer: 0
      }
    ],
    postAssessment: [
      {
        q: 'If someone loses money to a cyber scammer, what should be their very first step?',
        options: ['Wait 3 days to see if the bank refunds it automatically', 'Call 1930 immediately with the 12-digit UTR number and file at cybercrime.gov.in', 'Delete all chat messages'],
        answer: 1
      },
      {
        q: 'Why is reporting within the first 1–2 hours called the "Golden Hour"?',
        options: ['Banks can freeze the stolen funds before the scammer withdraws or moves them', 'Helpline is only open for 2 hours', 'It gives extra interest'],
        answer: 0
      }
    ]
  }
];

let activeModuleId = null;
let activeModuleStep = 'lesson';
let modQuizIdx = 0;
let modQuizScore = 0;

function renderChaptersGrid() {
  const grid = document.getElementById('chaptersGrid');
  if (!grid) return;

  grid.innerHTML = learningModules.map(mod => {
    const isDone = stats.completedChapters.includes(mod.id);
    return `
      <div class="chapter-card ${isDone ? 'completed-chap' : ''}" onclick="openChapter(${mod.id})">
        <div>
          <div class="chap-top">
            <span class="chap-num">${mod.label}</span>
            <span class="chap-status ${isDone ? 'done' : 'pending'}">${isDone ? '✅ Completed' : 'Open Module'}</span>
          </div>
          <h4>${mod.title}</h4>
          <p>${mod.summary}</p>
        </div>
        <button type="button" class="btn-secondary" style="width:100%;padding:0.5rem;">
          ${isDone ? 'Review Module' : 'Start Module →'}
        </button>
      </div>
    `;
  }).join('');
}

function openChapter(moduleId) {
  activeModuleId = moduleId;
  const mod = learningModules.find(m => m.id === moduleId);
  if (!mod) return;

  const reader = document.getElementById('chapterReaderCard');
  reader.classList.remove('hidden');
  document.getElementById('readerChapterTag').textContent = `${mod.label} of ${learningModules.length}`;
  document.getElementById('readerTitle').textContent = `${mod.label}: ${mod.title}`;
  document.getElementById('readerSubtitle').textContent = mod.summary;

  switchChapterStep('lesson');
  reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeChapterReader() {
  document.getElementById('chapterReaderCard').classList.add('hidden');
  activeModuleId = null;
}

function switchChapterStep(step) {
  activeModuleStep = step;
  modQuizIdx = 0;
  modQuizScore = 0;

  document.getElementById('chapTabLesson').classList.toggle('active', step === 'lesson');
  document.getElementById('chapTabPre').classList.toggle('active', step === 'pre');
  document.getElementById('chapTabPost').classList.toggle('active', step === 'post');

  renderModuleStep();
}

function renderModuleStep() {
  const mod = learningModules.find(m => m.id === activeModuleId);
  const box = document.getElementById('chapterStepContent');
  if (!mod || !box) return;

  if (activeModuleStep === 'lesson') {
    box.innerHTML = `
      <div class="lesson-body">
        <h4>${mod.lesson.heading}</h4>
        <ul class="lesson-points">
          ${mod.lesson.points.map(pt => `<li>${pt}</li>`).join('')}
        </ul>
        <div class="lesson-tip-box">🛡️ <strong>${mod.lesson.tip}</strong></div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button type="button" class="btn-secondary" onclick="switchChapterStep('pre')">📝 Take Pre-Assessment</button>
          <button type="button" class="btn-primary" onclick="switchChapterStep('post')">✅ Take Post-Assessment →</button>
        </div>
      </div>
    `;
    return;
  }

  const isPre = activeModuleStep === 'pre';
  const questions = isPre ? mod.preAssessment : mod.postAssessment;
  const stageLabel = isPre ? `${mod.label} — Pre-Assessment` : `${mod.label} — Post-Assessment`;

  if (modQuizIdx >= questions.length) {
    const passed = modQuizScore === questions.length;
    if (!isPre && passed) {
      if (!stats.completedChapters.includes(mod.id)) {
        stats.completedChapters.push(mod.id);
      }
      stats.postAssessmentsDone++;
      saveStats();
    }

    const nextId = mod.id < learningModules.length ? mod.id + 1 : null;
    box.innerHTML = `
      <div class="result-box ${isPre || passed ? 'safe' : 'warn'}">
        <h4>${isPre ? '📝 Pre-Assessment Complete!' : (passed ? `🎉 ${mod.label} Post-Assessment Passed!` : `⚠️ ${mod.label} Post-Assessment Score: ${modQuizScore}/${questions.length}`)}</h4>
        <p style="margin:0.5rem 0;">You scored <strong>${modQuizScore} out of ${questions.length}</strong>.</p>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:0.85rem;">
          ${isPre
            ? `<button type="button" class="btn-primary" onclick="switchChapterStep('lesson')">📖 Read ${mod.label} Content →</button>`
            : (passed
              ? (nextId
                ? `<button type="button" class="btn-primary" onclick="openChapter(${nextId})">Open Module ${nextId} →</button>`
                : `<button type="button" class="btn-primary" onclick="switchSection('dashboard')">All 8 Modules Completed! View Dashboard →</button>`)
              : `<button type="button" class="btn-secondary" onclick="switchChapterStep('lesson')">← Review Module Content</button>
                 <button type="button" class="btn-primary" onclick="switchChapterStep('post')">Retry Post-Assessment</button>`)
          }
        </div>
      </div>
    `;
    return;
  }

  const qObj = questions[modQuizIdx];
  box.innerHTML = `
    <div style="color:#38bdf8;font-size:0.88rem;font-weight:600;margin-bottom:0.35rem;">${stageLabel} (Question ${modQuizIdx + 1} of ${questions.length})</div>
    <p style="margin-bottom:0.75rem;font-size:1.05rem;"><strong>${qObj.q}</strong></p>
    ${qObj.options.map((opt, idx) => `<button type="button" class="option-btn" onclick="answerModuleQuestion(${idx})">${opt}</button>`).join('')}
  `;
}

function answerModuleQuestion(choice) {
  const mod = learningModules.find(m => m.id === activeModuleId);
  const questions = activeModuleStep === 'pre' ? mod.preAssessment : mod.postAssessment;
  if (choice === questions[modQuizIdx].answer) {
    modQuizScore++;
  }
  modQuizIdx++;
  renderModuleStep();
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

// --- Tool 2: Scam Scenarios ---
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

// --- Tool 3: Expanded Fake Payment Screenshot Quiz ---
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

// --- Tool 4: Interactive Simulator ---
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

// --- Tool 5: Expanded Privacy & Security Checkup (10 Items) ---
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
renderScenario();
renderPaymentQuiz();
renderSimulator();
renderCheckup();