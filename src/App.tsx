/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Key, 
  Network, 
  Cpu, 
  AlertTriangle, 
  ChevronRight,
  Clock,
  Unlock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Activity,
  Zap,
  HardDrive,
  BookOpen,
  Info,
  Monitor,
  Radio,
  Gamepad2,
  Trophy,
  History,
  GraduationCap
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Types ---
type GameStage = 'intro' | 'board' | 'phishing' | 'osint' | 'network' | 'cipher' | 'final' | 'victory' | 'game-over';
type Category = 'phishing' | 'osint' | 'network' | 'cipher' | 'final';
type Difficulty = 'easy' | 'medium' | 'hard';

interface QuestionItem {
  id: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  prompt: string;
  choices: string[];
  answerIndex: number;
  hint: string;
}

interface QuestionSupport {
  realisticExample: string;
  howToSolve: string[];
  resources: { label: string; href: string }[];
}

const PRACTICE_MODE = true;

const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 300
};

const BOARD_DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: 'border-emerald-400/50 text-emerald-400',
  medium: 'border-amber-400/50 text-amber-400',
  hard: 'border-red-400/50 text-red-400'
};

const CATEGORY_LABELS: Record<Category, string> = {
  phishing: 'Phishing Defense',
  osint: 'OSINT Recon',
  network: 'Network Hunting',
  cipher: 'Cipher Analysis',
  final: 'Incident Command'
};

const QUESTION_BANK: Record<Category, QuestionItem[]> = {
  phishing: [
    { id: 'phishing-easy', category: 'phishing', difficulty: 'easy', points: 100, prompt: 'A teammate posts a free-skins link in Discord. Biggest red flag?', choices: ['All caps text', 'Misspelled URL requesting login', 'Meme image attached', 'Uses countdown timer'], answerIndex: 1, hint: 'Spoofed domains are the fastest way to spot phishing.' },
    { id: 'phishing-medium', category: 'phishing', difficulty: 'medium', points: 200, prompt: 'DM says your game account is banned and asks to verify now. Best move?', choices: ['Use DM link fast', 'Send password to support', 'Open official app/site and verify there', 'Ignore forever'], answerIndex: 2, hint: 'Never verify through panic links.' },
    { id: 'phishing-hard', category: 'phishing', difficulty: 'hard', points: 300, prompt: 'School alert email passes SPF but fails DKIM and has mismatched reply-to. Conclusion?', choices: ['Safe enough', 'Likely spoofed/tampered', 'Just formatting issue', 'Only attachment is risky'], answerIndex: 1, hint: 'Mixed auth signals plus identity mismatch = suspicious.' }
  ],
  osint: [
    { id: 'osint-easy', category: 'osint', difficulty: 'easy', points: 100, prompt: 'Someone guessed your password theme from social posts. This is:', choices: ['Brute force only', 'OSINT from public info', 'Inside job required', 'Wi-Fi sniffing'], answerIndex: 1, hint: 'OSINT uses open/public data.' },
    { id: 'osint-medium', category: 'osint', difficulty: 'medium', points: 200, prompt: 'Most dangerous combo from social media for password guessing?', choices: ['Favorite snack + shoe size', 'Pet name + graduation year', 'Backpack color + meme', 'Controller brand + weather'], answerIndex: 1, hint: 'People reuse pet names and milestone years.' },
    { id: 'osint-hard', category: 'osint', difficulty: 'hard', points: 300, prompt: 'Reverse image challenge: identify the city or college shown in the location evidence.', choices: ['Run reverse-image lookup and infer location', 'Only check profile bio text', 'Ignore visual landmarks', 'Guess randomly'], answerIndex: 0, hint: 'Use visible landmarks plus reverse-image tooling to identify the location.' }
  ],
  network: [
    { id: 'network-easy', category: 'network', difficulty: 'easy', points: 100, prompt: 'One IP probes many ports in sequence. This is:', choices: ['Patch check', 'Port scan', 'Cloud sync', 'Certificate refresh'], answerIndex: 1, hint: 'Recon starts by checking open doors.' },
    { id: 'network-medium', category: 'network', difficulty: 'medium', points: 200, prompt: 'Best control to limit spread after one PC compromise?', choices: ['Flat network', 'Open file shares', 'Network segmentation', 'Disable logs'], answerIndex: 2, hint: 'Isolate trust zones.' },
    { id: 'network-hard', category: 'network', difficulty: 'hard', points: 300, prompt: 'Every-5-minute outbound callbacks to rare domain usually indicate:', choices: ['Normal patching', 'C2 beaconing', 'DNS cache update', 'Printer sync'], answerIndex: 1, hint: 'Periodic low-volume callbacks are beacon behavior.' }
  ],
  cipher: [
    { id: 'cipher-easy', category: 'cipher', difficulty: 'easy', points: 100, prompt: 'ROT13 shifts letters by:', choices: ['7', '10', '13', '26'], answerIndex: 2, hint: 'Half the alphabet.' },
    { id: 'cipher-medium', category: 'cipher', difficulty: 'medium', points: 200, prompt: 'In Caesar +3, plaintext S becomes:', choices: ['Q', 'R', 'V', 'W'], answerIndex: 2, hint: 'Count forward three.' },
    { id: 'cipher-hard', category: 'cipher', difficulty: 'hard', points: 300, prompt: 'Why can one-time pad be theoretically unbreakable?', choices: ['Easy to memorize', 'Random one-use key same length as message', 'Uses base64', 'Changes hourly'], answerIndex: 1, hint: 'Perfect secrecy needs truly random non-reused key material.' }
  ],
  final: [
    { id: 'final-easy', category: 'final', difficulty: 'easy', points: 100, prompt: 'Defense-in-depth means:', choices: ['One perfect firewall', 'Overlapping security controls', 'Antivirus only', 'No updates ever'], answerIndex: 1, hint: 'If one layer fails, others still protect.' },
    { id: 'final-medium', category: 'final', difficulty: 'medium', points: 200, prompt: 'First action after active compromise is detected?', choices: ['Delete logs', 'Public post first', 'Contain affected systems/accounts', 'Reboot everything'], answerIndex: 2, hint: 'Contain first to reduce blast radius.' },
    { id: 'final-hard', category: 'final', difficulty: 'hard', points: 300, prompt: 'Zero Trust assumes:', choices: ['Internal users are trusted', 'Trust must be continuously verified', 'VPN means full trust', 'Known devices bypass checks'], answerIndex: 1, hint: 'Never trust by default.' }
  ]
};

const QUESTION_SUPPORT: Record<string, QuestionSupport> = {
  'phishing-easy': {
    realisticExample: 'Your friend shares a "free skin" login link in a group chat before a Friday night match.',
    howToSolve: ['Check the domain spelling carefully.', 'Never log in from chat links. Open the official site directly.', 'Report suspicious links to your coach/teacher.'],
    resources: [{ label: 'CISA: Avoid Social Engineering and Phishing', href: 'https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks' }]
  },
  'phishing-medium': {
    realisticExample: 'A panic DM says your gaming account will be banned in 10 minutes unless you verify now.',
    howToSolve: ['Ignore urgent pressure tactics.', 'Log in through the official app/site only.', 'Enable MFA on the account immediately.'],
    resources: [{ label: 'FTC: How to recognize and report spam texts', href: 'https://consumer.ftc.gov/articles/how-recognize-and-report-spam-text-messages' }]
  },
  'phishing-hard': {
    realisticExample: 'A school notice looks real but sender authentication details do not line up.',
    howToSolve: ['Compare sender, reply-to, and auth results together.', 'Treat mixed SPF/DKIM signals as suspicious.', 'Verify by contacting school staff through known channels.'],
    resources: [{ label: 'Google: Authenticate email with SPF/DKIM/DMARC', href: 'https://support.google.com/a/answer/2466563' }]
  },
  'osint-easy': {
    realisticExample: 'Someone guesses your password style from public TikTok and Instagram posts.',
    howToSolve: ['Audit what personal details are public.', 'Avoid password clues in bios/posts.', 'Use unique passphrases for each account.'],
    resources: [{ label: 'NCSC: People and passwords', href: 'https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online/password-managers' }]
  },
  'osint-medium': {
    realisticExample: 'An attacker combines pet names and graduation years to build targeted password guesses.',
    howToSolve: ['Never use personal details in passwords.', 'Use a password manager and random generation.', 'Turn on MFA for school/social/gaming accounts.'],
    resources: [{ label: 'CISA: Creating a password tip sheet', href: 'https://www.cisa.gov/news-events/news/creating-password-tip-sheet' }]
  },
  'osint-hard': {
    realisticExample: 'You are given an image clue and must geolocate it using reverse-image and landmark analysis.',
    howToSolve: ['Inspect visible landmarks and architecture.', 'Run a reverse-image lookup to find similar images/pages.', 'Correlate clues to city or campus name before submitting.'],
    resources: [{ label: 'Google Lens', href: 'https://lens.google.com/' }, { label: 'Bing Visual Search', href: 'https://www.bing.com/visualsearch' }, { label: 'Yandex Images', href: 'https://yandex.com/images/' }]
  },
  'network-easy': {
    realisticExample: 'During a school event stream, one external IP probes many ports in sequence.',
    howToSolve: ['Identify repeated source IP patterns.', 'Check for sequential/high-volume port attempts.', 'Block and monitor that source at perimeter controls.'],
    resources: [{ label: 'Cloudflare: What is a port scan?', href: 'https://www.cloudflare.com/learning/security/glossary/what-is-a-port-scan/' }]
  },
  'network-medium': {
    realisticExample: 'One compromised lab PC tries to spread toward grade and attendance systems.',
    howToSolve: ['Use segmentation between student and admin networks.', 'Limit lateral movement with ACLs/firewalls.', 'Apply least privilege for service accounts and shares.'],
    resources: [{ label: 'NIST: Zero Trust architecture', href: 'https://www.nist.gov/publications/zero-trust-architecture' }]
  },
  'network-hard': {
    realisticExample: 'A host sends periodic low-volume callbacks to a rare domain every 5 minutes.',
    howToSolve: ['Look for periodic beacon timing patterns.', 'Correlate DNS + endpoint process telemetry.', 'Isolate host, then investigate persistence and C2.'],
    resources: [{ label: 'MITRE ATT&CK: C2 techniques', href: 'https://attack.mitre.org/tactics/TA0011/' }]
  },
  'cipher-easy': {
    realisticExample: 'A club challenge uses ROT13 to hide a simple keyword in plain sight.',
    howToSolve: ['Remember ROT13 shifts by 13.', 'Decode quickly using a ROT13 tool table.', 'Confirm output still makes contextual sense.'],
    resources: [{ label: 'dCode ROT Cipher', href: 'https://www.dcode.fr/rot-cipher' }]
  },
  'cipher-medium': {
    realisticExample: 'You need to decode a Caesar-shifted hint before rival team steals points.',
    howToSolve: ['Test likely small shifts first.', 'Check letter frequency and known words.', 'Validate by reversing shift against original context.'],
    resources: [{ label: 'Cryptii Caesar cipher', href: 'https://cryptii.com/pipes/caesar-cipher' }]
  },
  'cipher-hard': {
    realisticExample: 'Advanced challenge asks why one-time pads are special compared to simple ciphers.',
    howToSolve: ['Focus on key properties: random, equal length, never reused.', 'Distinguish theoretical security from practical key management.', 'Explain why reuse breaks secrecy.'],
    resources: [{ label: 'Khan Academy: One-time pad', href: 'https://www.khanacademy.org/computing/computer-science/cryptography' }]
  },
  'final-easy': {
    realisticExample: 'Your team wants one tool to solve everything, but incidents keep bypassing single defenses.',
    howToSolve: ['Apply layered controls (MFA, filtering, segmentation, backups).', 'Assume one control can fail.', 'Build overlap and monitoring between layers.'],
    resources: [{ label: 'CISA: Defense in depth', href: 'https://www.cisa.gov/resources-tools/resources/defense-depth' }]
  },
  'final-medium': {
    realisticExample: 'A class account is hijacked right before grade lock-in and panic spreads.',
    howToSolve: ['Contain affected accounts/systems first.', 'Preserve evidence and logs.', 'Then eradicate and recover with communications plan.'],
    resources: [{ label: 'CISA Incident Response', href: 'https://www.cisa.gov/incident-response' }]
  },
  'final-hard': {
    realisticExample: 'Shared Wi-Fi and known devices are trusted by default, leading to quiet misuse.',
    howToSolve: ['Continuously verify identity/device context.', 'Use least privilege and short-lived trust.', 'Require re-authentication for sensitive actions.'],
    resources: [{ label: 'NIST CSF 2.0', href: 'https://www.nist.gov/cyberframework' }]
  }
};

interface PuzzleData {
  phishing: {
    emails: {
      id: number;
      sender: string;
      subject: string;
      content: string;
      header: string;
      isPhish: boolean;
    }[];
  };
  osint: {
    petName: string;
    carYear: string;
    answer: string;
    locationImage: string;
    locationAnswer: string;
    profiles: {
      social: { user: string; platform: string; content: string }[];
      archive: { user: string; platform: string; content: string }[];
      records: { user: string; platform: string; content: string }[];
    };
  };
  network: {
    suspiciousIp: string;
    logs: { time: string; src: string; dst: string; port: number; info: string; suspicious: boolean }[];
  };
  cipher: {
    word: string;
    encrypted: string;
  };
  finalCode: string;
}

const generatePuzzleData = (): PuzzleData => {
  // 3. Network Setup (needed for phishing headers)
  const suspiciousIp = `45.132.8.${1 + Math.floor(Math.random() * 254)}`;
  const otherIps = ["192.168.1.1", "192.168.1.5", "10.0.99.2", "10.0.99.14", "192.168.1.12", "172.16.0.4"];
  const ports = [21, 22, 23, 25, 80, 110, 443, 3306, 8080];
  const scanPorts = [...ports].sort(() => 0.5 - Math.random()).slice(0, 4);

  // 1. Phishing
  const phishingPool = [
    { sender: "South Gallia HS Support <admin@southgallia-hs.net>", subject: "Security Alert: Account Sync Required", content: "Unusual login detected. Please click here to verify your credentials: https://verify.southgallia-hs-edu.com/auth", header: `Received: from relay-dns-mx.net (${suspiciousIp})\nSPF: fail\nDKIM: none\nX-Mailer: PHP/PHPMailer`, isPhish: true },
    { sender: "Official Microsoft <no-reply@security-msft-validate.com>", subject: "Office 365 Password Expiry", content: "Your school Office 365 password expires in 2 hours. Use the link below to extend it bypass security lockout.", header: `Received: from azure-west-3.com (${suspiciousIp})\nSPF: softfail\nDKIM: none`, isPhish: true },
    { sender: "Scholarship Foundation <info@scholarships-edu.org>", subject: "New Award Opportunity", content: "You've been selected for a community scholarship. Download the application ZIP to begin.", header: `Received: from smtp-bulk-send.com (${suspiciousIp})\nSPF: none\nDKIM: fail`, isPhish: true },
    { sender: "IT Department <helpdesk@southgallia-sec-portal.com>", subject: "URGENT: VPN Configuration Reset", content: "Action required to maintain network access. Download the new client: https://dl.southgallia-sec-portal.com/setup.exe", header: `Received: from secure-relay.io (${suspiciousIp})\nSPF: none\nDKIM: fail`, isPhish: true },
    { sender: "Student Services <noreply@sg-edu-verify.org>", subject: "Dorm Keycard Update", content: "Your keycard access expires tonight. Provide your SSN to update the security bypass.", header: `Received: from mail-phish.biz (${suspiciousIp})\nSPF: fail`, isPhish: true }
  ];

  const legitPool = [
    { sender: "Principal Davis <davis@southgalliahs.edu>", subject: "Career Fair Schedule Correction", content: "Please review the attached spreadsheet for today's Career Fair. It contains the final booth arrangements for South Gallia HS.", header: "Received: from mail-server.southgalliahs.edu (192.168.1.10)\nSPF: pass\nDKIM: pass\nX-Mailer: Outlook 16.0", isPhish: false },
    { sender: "Library Services <noreply@lib.southgallia.edu>", subject: "Overdue Book Notice", content: "Your copy of 'Digital Fortress' is overdue. Return it within 48 hours to avoid a $5 hold fee.", header: "Received: from lib-svc.southgalliahs.edu (192.168.1.45)\nSPF: pass\nDKIM: pass", isPhish: false },
    { sender: "Athletic Dept <rebel-sports@southgalliahs.edu>", subject: "Game Day Schedule Change", content: "The varsity soccer match has been moved to 4 PM due to weather concerns.", header: "Received: from mail-server.southgalliahs.edu (192.168.1.10)\nSPF: pass", isPhish: false },
    { sender: "Cafeteria <lunch@southgalliahs.edu>", subject: "New Menu Options", content: "Check out the new healthy options starting next Monday. Survey inside.", header: "Received: from mail-server.southgalliahs.edu (192.168.1.10)\nSPF: pass", isPhish: false },
    { sender: "South Gallia HS <info@southgalliahs.edu>", subject: "Parent-Teacher Conference", content: "Signups are now open for the year-end reviews. Please check the portal.", header: "Received: from mail-server.southgalliahs.edu (192.168.1.10)\nSPF: pass", isPhish: false }
  ];

  const selectedPhish = [...phishingPool].sort(() => 0.5 - Math.random()).slice(0, 2);
  const selectedLegit = [...legitPool].sort(() => 0.5 - Math.random()).slice(0, 3);
  const finalEmails = [...selectedPhish, ...selectedLegit]
    .sort(() => 0.5 - Math.random())
    .map((e, idx) => ({ ...e, id: idx + 1 }));

  // 2. OSINT
  const pets = ["Sparky", "Rex", "Luna", "Felix", "Cooper", "Milo", "Bella"];
  const petName = pets[Math.floor(Math.random() * pets.length)];
  const carYear = (2015 + Math.floor(Math.random() * 8)).toString();
  const petAge = 3 + Math.floor(Math.random() * 5);
  const user = Math.random() > 0.5 ? "PhantomHax" : "GhostLine";
  
  // OSINT IMAGE (Target: Hocking College Campus)
  // Using the campus image requested by the user.
  const osintImage = "https://blog.hocking.edu/hubfs/Images/Campus/IMG-21-2.jpg";
  const osintLocationAnswer = "nelsonville";

  const osintProfile = {
    petName, carYear,
    answer: (petName + carYear).toLowerCase(),
    locationImage: osintImage,
    locationAnswer: osintLocationAnswer,
    profiles: {
      social: [
        { user, platform: "CHIRP-SOC", content: `Got my ${carYear} Charger! Best gift ever for my birthday block.` },
        { user, platform: "CHIRP-SOC", content: `${petName} is ${petAge} years old today. Cats > People.` },
      ],
      archive: [
        { user: "SysAdmin", platform: "FORUM-ARC", content: `South Gallia Science Fair ${carYear}: Record attendance. Winner: [REDACTED]` },
        { user: "Alumni-02", platform: "FORUM-ARC", content: "Remember that guy who used his cat's name for everything? Wonder where he is now." }
      ],
      records: [
        { user: "SYSTEM", platform: "REGISTRY", content: `VEHICLE-ID: CHRG-${carYear}-BLK | OWNER: P. WALSH | STATUS: ACTIVE` },
        { user: "SYSTEM", platform: "REGISTRY", content: `PET-LICENSE: FELINE-0019 | NAME: ${petName.toUpperCase()} | PRIMARY: P. WALSH` }
      ]
    }
  };

  // 3. logs
  const logs = [
    { time: "16:20:01", src: otherIps[0], dst: "MAIN", port: 80, info: "HTTP GET /", suspicious: false },
    { time: "16:20:05", src: otherIps[1], dst: "MAIN", port: 443, info: "SSL HANDSHAKE", suspicious: false },
    { time: "16:21:08", src: otherIps[2], dst: "MGMT-SVR", port: 23, info: "TELNET CONNECT", suspicious: false },
    { time: "16:21:12", src: suspiciousIp, dst: "MAIN", port: scanPorts[0], info: "PROBE ATTEMPT", suspicious: true },
    { time: "16:21:13", src: suspiciousIp, dst: "MAIN", port: scanPorts[1], info: "SERVICE SCAN", suspicious: true },
    { time: "16:21:14", src: suspiciousIp, dst: "MAIN", port: scanPorts[2], info: "ANOMALOUS SEQUENCE", suspicious: true },
    { time: "16:21:15", src: suspiciousIp, dst: "MAIN", port: scanPorts[3], info: "SYN FLOOD", suspicious: true },
    { time: "16:22:10", src: otherIps[3], dst: "STUDENT-DB", port: 3306, info: "SQL QUERY", suspicious: false },
    { time: "16:22:40", src: otherIps[4], dst: "MAIN", port: 443, info: "SSL STABLE", suspicious: false }
  ].sort(() => 0.5 - Math.random());

  // 4. Cipher
  const cipherWords = ["FIREWALL", "ENCRYPT", "SHIELD", "PROTOCOL", "DEFENSE", "MALWARE", "NETWORK", "GATEWAY"];
  const cipherWord = cipherWords[Math.floor(Math.random() * cipherWords.length)];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const encrypted = cipherWord.split('').map(char => alphabet[(alphabet.indexOf(char) + 13) % 26]).join('');

  // 5. Final Code (Using sector flags for consistency with instructions)
  const finalCode = "PHS01OSN02NET03CRY04";

  return {
    phishing: { emails: finalEmails },
    osint: osintProfile,
    network: { suspiciousIp, logs },
    cipher: { word: cipherWord, encrypted },
    finalCode
  };
};

interface TerminalMessage {
  text: string;
  type: 'info' | 'error' | 'success' | 'warning';
  timestamp: string;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  time: number;
  integrity: number;
  date: string;
}

// --- Components ---

const CRTEffects = () => (
  <>
    <div className="crt-overlay" />
  </>
);

const CRTOverlay = () => null; // Replaced by CRTEffects below

const MatrixBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-5">
    <div className="absolute inset-0 bg-[#050505]" />
    <div className="flex justify-around w-full h-full text-[#22c55e] font-mono text-sm leading-none opacity-20">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="flex flex-col animate-matrix" style={{ animationDelay: `${Math.random() * 5}s`, animationDuration: `${10 + Math.random() * 20}s` }}>
          {Array.from({ length: 50 }).map((_, j) => (
            <span key={j}>{Math.random() > 0.5 ? '1' : '0'}</span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// --- Sound Manager (Web Audio API) ---
const playSound = (type: 'intro' | 'correct' | 'error' | 'click' | 'victory' | 'beeping') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  switch (type) {
    case 'intro':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(40, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      osc.start(now);
      osc.stop(now + 2);
      break;
    case 'correct':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'error':
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'click':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    case 'victory':
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + (i * 0.1));
        g.gain.setValueAtTime(0.1, now + (i * 0.1));
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + (i * 0.1));
        o.stop(now + 0.6);
      });
      break;
    case 'beeping':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
  }
};

const STAGE_HINTS: Record<string, string[]> = {
  phishing: [
    "NORAD ALERT: Inspect sender origins. Authentic school communications utilize the .edu TLD.",
    "INTEL: Verify character placement. 'southgallia-hs' is a known spoofing variant."
  ],
  osint: [
    "RECON: Analyze social archives. Personal variables often populate legacy credential strings.",
    "GEO-INT: Correlate visual landmarks with regional datasets. Target is within the Hocking Valley parameters."
  ],
  network: [
    "WOPR LOGS: Detect port-hopping signatures. A single external IP is scanning internal 10.0.x.x sectors.",
    "BRIDGE FOUND: Isolate the source IP performing the sequential sweep."
  ],
  cipher: [
    "DECRYPTION: Standard ROT13 algorithm detected. A=N, B=O, C=P.",
    "FRAGMENT: Shift characters forward by 13 positions to reveal the control word."
  ],
  final: [
    "MASTER OVERRIDE: Assemble all captured sector flags into a single string.",
    "INTEL: Review terminal history for the fragments recovered at each breach."
  ]
};

const STAGE_CONFIG: Record<string, { difficulty: 'EASY' | 'MEDIUM' | 'HARD'; points: number }> = {
  phishing: { difficulty: 'MEDIUM', points: 200 },
  osint:    { difficulty: 'HARD',   points: 300 },
  network:  { difficulty: 'MEDIUM', points: 200 },
  cipher:   { difficulty: 'EASY',   points: 100 },
  final:    { difficulty: 'HARD',   points: 400 },
};

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY:   'border-emerald-400/50 text-emerald-400',
  MEDIUM: 'border-amber-400/50 text-amber-400',
  HARD:   'border-red-400/50 text-red-400',
};

const STAGE_SOLVER_LINKS: Partial<Record<GameStage, { title: string; links: { label: string; href: string }[] }>> = {
  phishing: {
    title: 'How to Solve: Phishing',
    links: [
      { label: 'CISA Phishing Guidance', href: 'https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks' },
      { label: 'FTC: How to Recognize Phishing', href: 'https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams' },
      { label: 'Google Phishing Quiz', href: 'https://phishingquiz.withgoogle.com/' }
    ]
  },
  osint: {
    title: 'How to Solve: OSINT',
    links: [
      { label: 'OSINT Framework', href: 'https://osintframework.com/' },
      { label: 'Bellingcat Toolkit', href: 'https://www.bellingcat.com/resources/how-tos/' },
      { label: 'SANS OSINT Basics', href: 'https://www.sans.org/blog/what-is-open-source-intelligence/' }
    ]
  },
  network: {
    title: 'How to Solve: Network',
    links: [
      { label: 'Wireshark Display Filters', href: 'https://wiki.wireshark.org/DisplayFilters' },
      { label: 'CISA Network Security', href: 'https://www.cisa.gov/topics/cybersecurity-best-practices' },
      { label: 'Cloudflare Port Scanning', href: 'https://www.cloudflare.com/learning/security/glossary/what-is-port-scanning/' }
    ]
  },
  cipher: {
    title: 'How to Solve: Ciphers',
    links: [
      { label: 'CyberChef ROT13', href: 'https://gchq.github.io/CyberChef/#recipe=ROT13(true,true,false,13)' },
      { label: 'ROT13.com', href: 'https://rot13.com/' },
      { label: 'dCode ROT Cipher', href: 'https://www.dcode.fr/rot-cipher' }
    ]
  },
  final: {
    title: 'How to Solve: Final',
    links: [
      { label: 'NIST CSF 2.0 Overview', href: 'https://www.nist.gov/cyberframework' },
      { label: 'CISA Defense in Depth', href: 'https://www.cisa.gov/resources-tools/resources/defense-depth' },
      { label: 'CISA Incident Response', href: 'https://www.cisa.gov/incident-response' }
    ]
  }
};

const SolveLinksPanel = ({ stage }: { stage: GameStage }) => {
  const resources = STAGE_SOLVER_LINKS[stage];
  if (!resources) return null;

  return (
    <div className="bg-black border-4 border-[#22c55e]/30 rounded-lg p-4 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
      <div className="flex items-center justify-between mb-3 border-b border-[#22c55e]/20 pb-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#22c55e]">{resources.title}</h3>
        <BookOpen size={14} className="text-[#22c55e]/70" />
      </div>
      <div className="space-y-2">
        {resources.links.map((resource) => (
          <a
            key={resource.href}
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 border border-[#22c55e]/20 text-[10px] text-[#e5e7eb]/85 hover:text-black hover:bg-[#22c55e] transition-all font-mono"
          >
            {resource.label}
          </a>
        ))}
      </div>
      <p className="mt-3 text-[9px] text-[#22c55e]/60 font-mono">
        Use only challenge data in external tools.
      </p>
    </div>
  );
};

const STAGE_EDUCATION = {
  phishing: {
    title: "SECTOR 01: Social Engineering",
    concept: "Phishing is the #1 way attackers gain initial access. It relies on human psychology rather than software bugs.",
    fastFact: "Over 3.4 billion spam emails are sent every day, and 90% of data breaches start with a phishing email.",
    keyPoints: [
      "Targeted Deception: Typosquatting (e.g., 'southgallia-hs.net') is designed to fool the eyes of busy users.",
      "Pressure Points: Attackers leverage fear or FOMO to force rapid, unverified clicks.",
      "Verification Fail: SPF/DKIM flags are early indicators of unauthorized origin."
    ],
    proTip: "In a real CTF, always check the 'From' address and link target (hover) to find the flag.",
    careerInfo: {
      job: "Cyber Analyst",
      salary: "$65k-$85k (OH)",
      hocking: "Hocking College prepares you to defend against real-world social engineering tactics."
    }
  },
  osint: {
    title: "SECTOR 02: Intelligence Recon",
    concept: "OSINT (Open Source Intelligence) uses public records to bypass security barriers without writing a line of code.",
    fastFact: "81% of users recycle passwords. Attackers leverage OSINT to build 'dictionary' attacks specifically for you.",
    keyPoints: [
      "Public Persistence: Social media is a permanent record of potential security identifiers.",
      "Pattern Matching: Hackers correlate car registrations with pet names to guess secure strings.",
      "Visual Forensics: Geolocation identifies a target's physical environment from harmless background details."
    ],
    proTip: "Security Professionals use OSINT to find 'vulnerabilities' in their own digital footprint.",
    careerInfo: {
      job: "Forensics Specialist",
      salary: "$75k-$110k (OH)",
      hocking: "Prepare for high-stakes digital defense in the Hocking Valley region."
    }
  },
  network: {
    title: "SECTOR 03: Perimeter Scout",
    concept: "Network reconnaissance is the tactical scanning of an environment to map 'open' entry points.",
    fastFact: "An unprotected server on the clear web is scanned by an automated adversary within 5 minutes of activation.",
    keyPoints: [
      "Tactical Addressing: WAN vs LAN segmentation prevents attackers from seeing into internal high-value targets.",
      "Port Logic: Doors like 80 (Web) and 22 (SSH) are the frontline of every digital conflict.",
      "Scan Detection: Identifying automated probes is step one in defensive incident response."
    ],
    proTip: "Firewalls are your first line of defense—they act as the NORAD of your network.",
    careerInfo: {
      job: "Network Guardian",
      salary: "$90k-$130k (OH)",
      hocking: "Get hands-on experience in Hocking's dedicated Network Security Labs."
    }
  },
  cipher: {
    title: "SECTOR 04: Cryptographic Breach",
    concept: "Cryptography is the armor of data. Ciphers transform intelligence into unreadable ciphertext.",
    fastFact: "The movie 'WarGames' featured simple backdoors, but modern security uses 256-bit encryption that takes lifetimes to crack.",
    keyPoints: [
      "Legacy Methods: Shifting ciphers like ROT13 are easy to break but introduce the logic of data masking.",
      "The Key is Life: In encryption, the algorithm is often public; the security is stored in the uniqueness of the key.",
      "Integrity: Encryption ensures that even if a sector is breached, the data remains unusable to the adversary."
    ],
    proTip: "Never build your own crypto—use standard, validated libraries like AES or RSA.",
    careerInfo: {
      job: "Crypto-Engineer",
      salary: "$110k+ (OH)",
      hocking: "Understand the mathematical foundations of security through Hocking curriculum."
    }
  },
  final: {
    title: "DEFCON 1: Global Defense",
    concept: "Security isn't a single wall; it's a series of layers. If the firewall fails, the encryption should still protect you.",
    fastFact: "Global cybercrime costs are projected to hit $10.5 trillion by 2025—exceeding the cost of many physical wars.",
    keyPoints: [
      "Layered Security: Firewalls, MFA, and Encryption work together to build 'Defense in Depth'.",
      "Proactive Intel: Incident response is not about reacting; it's about predicting the adversary's next moves.",
      "Zero Trust: Modern security assumes a breach will happen and requires every user to verify their identity constantly."
    ],
    proTip: "The only winning move is to be prepared. Start your training early.",
    careerInfo: {
      job: "CISO / Security Director",
      salary: "$180k+ (OH)",
      hocking: "Take your first step toward high-level security leadership at Hocking College."
    }
  }
};

const EducationalPanel = ({ stage, isOpen, onClose }: { stage: GameStage, isOpen: boolean, onClose: () => void }) => {
  const info = STAGE_EDUCATION[stage as keyof typeof STAGE_EDUCATION];
  if (!info) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 20 }}
          className="fixed top-24 right-10 bottom-24 w-84 bg-black border-4 border-[#22c55e]/50 backdrop-blur-xl z-[2000] rounded-lg p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col font-mono crt-flicker"
        >
          <div className="flex items-center justify-between mb-6 border-b-2 border-[#22c55e]/40 pb-4">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-[#22c55e] terminal-text" />
              <h3 className="text-sm font-black uppercase tracking-widest text-[#22c55e] terminal-text">INTEL_REPOSITORY</h3>
            </div>
            <button onClick={onClose} className="text-[#22c55e]/40 hover:text-white transition-all">
              <XCircle size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black text-[#22c55e]/60 tracking-tighter">Subject:</p>
              <h4 className="text-sm font-black text-white uppercase leading-tight">{info.title}</h4>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black text-[#22c55e]/60 tracking-tighter">The Concept:</p>
              <p className="text-[11px] text-white/70 leading-relaxed italic border-l-2 border-[#22c55e]/20 pl-4">
                {info.concept}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black text-[#22c55e]/60 tracking-tighter">Fast Fact:</p>
              <p className="text-[10px] text-[#22c55e] leading-relaxed bg-[#22c55e]/10 p-2 rounded border border-[#22c55e]/20">
                {info.fastFact}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase font-black text-[#22c55e]/60 tracking-tighter">Hocking College Pipeline:</p>
              <div className="bg-[#22c55e]/10 border-2 border-[#22c55e]/40 rounded-lg p-4 space-y-4 shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <GraduationCap size={40} className="text-[#22c55e]" />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] text-white/40 uppercase tracking-widest">Degree Program</p>
                  <p className="text-xs font-black text-white uppercase">Cybersecurity & Network Systems</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[7px] text-white/40 uppercase mb-0.5">Role (OH)</p>
                    <p className="text-[10px] font-bold text-white">{info.careerInfo?.job}</p>
                  </div>
                  <div>
                    <p className="text-[7px] text-white/40 uppercase mb-0.5">Salary (EST)</p>
                    <p className="text-[10px] font-bold text-[#22c55e]">{info.careerInfo?.salary}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#22c55e]/20">
                  <p className="text-[10px] text-[#22c55e] leading-relaxed font-bold">
                    {info.careerInfo?.hocking}
                  </p>
                  <p className="text-[8px] text-white/30 mt-2 uppercase tracking-tighter">
                    Apply now at hocking.edu // 2-year Associate Degree
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] uppercase font-black text-[#22c55e]/60 tracking-tighter">Field Intel:</p>
              {info.keyPoints.map((point, i) => (
                <div key={i} className="flex gap-3 items-start group">
                  <div className="mt-1 w-1.5 h-1.5 bg-[#22c55e] shrink-0" />
                  <p className="text-[10px] text-white/60 leading-normal group-hover:text-white transition-colors">
                    {point}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black text-[#22c55e]/60 tracking-tighter">Pro Tip:</p>
              <p className="text-[10px] text-white/80 leading-relaxed font-bold border-t border-[#22c55e]/10 pt-2">
                💡 {info.proTip}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#22c55e]/20">
            <p className="text-[8px] text-[#22c55e]/40 leading-tight font-black uppercase tracking-widest text-center">
              Mission Data Repository // SECURE
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Terminal = ({ messages, onCommand }: { messages: TerminalMessage[], onCommand: (cmd: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCommand(input.trim().toLowerCase());
    setInput("");
    playSound('click');
  };

  return (
    <div className="bg-black/90 border-2 border-[#22c55e]/30 rounded p-3 font-mono text-[11px] h-full overflow-hidden flex flex-col shadow-[inset_0_0_20px_#22c55e11] crt-flicker">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#22c55e]/20 text-[#22c55e] opacity-80 terminal-text">
        <TerminalIcon size={12} />
        <span className="text-[10px] uppercase tracking-widest font-black">WOPR_SYSTEM_CONSOLE v4.2.0</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 scrollbar-hide mb-2">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-2 leading-tight",
            msg.type === 'error' ? "text-[#ef4444]" : 
            msg.type === 'success' ? "text-[#22c55e]" : 
            msg.type === 'warning' ? "text-amber-400" : "text-[#22c55e]"
          )}>
            <span className="opacity-40 shrink-0">[{msg.timestamp}]</span>
            <span className="break-all">{msg.text}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-white/40 italic">Waiting for uplink...</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[#22c55e]/10 pt-2">
        <span className="text-[#22c55e]">root@ir-analyst:~$</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[#22c55e] placeholder:text-[#22c55e]/20"
          placeholder="ENTER COMMAND..."
          autoFocus
        />
      </form>
    </div>
  );
};

const HintButton = ({ onHint, hintsUsed }: { onHint: () => void, hintsUsed: number }) => (
  <button 
    onClick={onHint}
    disabled={hintsUsed >= 2}
    className={cn(
      "px-3 py-1 border text-[9px] font-bold uppercase tracking-widest transition-all",
      hintsUsed >= 2 
        ? "border-white/10 text-white/10" 
        : "border-amber-400/30 text-amber-400 bg-amber-400/5 hover:bg-amber-400/20"
    )}
  >
    {hintsUsed >= 2 ? "NO HINTS LEFT" : `REQUEST HINT (${2 - hintsUsed})`}
  </button>
);

const CyberIntelButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="px-3 py-1 border border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/5 text-[9px] font-black uppercase tracking-widest hover:bg-[#22c55e]/20 transition-all flex items-center gap-2"
  >
    <BookOpen size={10} />
    Cyber Intel
  </button>
);

const TimerDisplay = ({ timeLeft, practiceMode = false }: { timeLeft: number, practiceMode?: boolean }) => {
  if (practiceMode) {
    return (
      <div className="flex flex-col items-end">
        <div className="text-2xl font-black text-emerald-400">PRACTICE</div>
        <div className="text-[10px] uppercase tracking-widest text-emerald-400/80">NO COUNTDOWN</div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className="flex flex-col items-end">
      <div className={cn(
        "text-3xl font-black tabular-nums transition-colors duration-500",
        timeLeft < 60 ? "text-[#ef4444] animate-pulse" : "text-[#ef4444]"
      )}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-[#ef4444] opacity-80 decoration-red-500/50">TIME TO LOCKOUT</div>
    </div>
  );
};

const GlobalProgressTracker = ({ currentStage }: { currentStage: GameStage }) => {
  const steps: GameStage[] = ['phishing', 'osint', 'network', 'cipher', 'final'];
  const currentIndex = steps.indexOf(currentStage);

  return (
    <div className="w-full h-8 bg-black border-x-4 border-b-4 border-[#22c55e]/40 rounded-b-lg px-4 flex items-center justify-between font-mono crt-flicker">
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-black text-[#22c55e]/40 uppercase tracking-widest">DEPLOYMENT_SAT-COMM_UPLINK:</span>
        <div className="flex gap-1">
          {steps.map((s, i) => (
            <div key={s} className={cn(
              "w-8 h-1 transition-all duration-500",
              i < currentIndex ? "bg-[#22c55e]" : 
              i === currentIndex ? "bg-[#22c55e] animate-pulse shadow-glow" : 
              "bg-[#22c55e]/10"
            )} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 text-[8px] font-black uppercase italic">
        <span className="text-white/60 tracking-widest">{currentStage.toUpperCase()}</span>
        <span className="text-amber-500 animate-pulse">!! SECTOR_UNSECURED !!</span>
        <span className="text-[#22c55e]/40">V_04.8.2</span>
      </div>
    </div>
  );
};

const MissionSummary = ({ stage, hintsUsed, integrity }: { stage: GameStage, hintsUsed: number, integrity: number }) => {
  return (
    <div className="bg-black/90 border-2 border-[#22c55e]/30 rounded p-4 shadow-[inset_0_0_20px_#22c55e11] crt-flicker">
      <div className="flex items-center gap-2 mb-3 border-b border-[#22c55e]/20 pb-2">
        <ShieldAlert size={14} className="text-[#22c55e] terminal-text" />
        <h3 className="text-[10px] uppercase opacity-80 font-black tracking-widest terminal-text">MISSION_TELEMETRY</h3>
      </div>
      <div className="space-y-3 font-mono">
        <div className="flex justify-between items-center text-[9px]">
          <span className="opacity-40 uppercase">THREAT_LEVEL:</span>
          <span className="text-[#ef4444] font-black">DEFCON 2</span>
        </div>
        <div className="flex justify-between items-center text-[9px]">
          <span className="opacity-40 uppercase">SEC_SUBSYSTEMS:</span>
          <span className="text-[#22c55e] font-black">NOMINAL</span>
        </div>
        <div className="flex justify-between items-center text-[9px]">
          <span className="opacity-40 uppercase">INTEL_ERRORS:</span>
          <span className={hintsUsed > 0 ? "text-amber-500" : "text-[#22c55e]/40"}>{hintsUsed}</span>
        </div>
        <div className="h-px bg-[#22c55e]/10 my-2" />
        <div className="flex flex-col gap-1">
          <span className="text-[7px] opacity-40 uppercase">CURRENT_LOCATION_FIX:</span>
          <span className="text-[9px] font-black text-white px-2 py-1 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded tracking-widest">
            {stage === 'phishing' ? "PACKET_RELAY_B" : 
             stage === 'osint' ? "LOCAL_REGISTRY_SRCH" :
             stage === 'network' ? "WAN_SCAN_CLUSTER" :
             stage === 'cipher' ? "ENCR_PROTOCOL_HUB" : "MASTER_CON_OVERRIDE"}
          </span>
        </div>
      </div>
    </div>
  );
};

const ProgressMap = ({ currentStage }: { currentStage: GameStage }) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const stages: { id: GameStage; label: string; desc: string }[] = [
    { id: 'phishing', label: 'PHISH', desc: 'Social Engineering Defense' },
    { id: 'osint', label: 'OSINT', desc: 'Reconnaissance Analysis' },
    { id: 'network', label: 'NET', desc: 'Inclusion/Exclusion PCAP' },
    { id: 'cipher', label: 'CIPH', desc: 'Cryptographic Breach' },
    { id: 'final', label: 'CODE', desc: 'Primary Override sequence' }
  ];

  const getStageIndex = (s: GameStage) => stages.findIndex(item => item.id === s);
  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="bg-black/90 border-2 border-[#22c55e]/30 rounded p-4 shadow-[inset_0_0_20px_#22c55e11] crt-flicker">
      <div className="flex items-center justify-between border-b border-[#22c55e]/20 pb-2 mb-3">
        <h3 className="text-[10px] uppercase opacity-80 font-black tracking-widest terminal-text">MISSION_FLOW_MAP</h3>
        <div className="flex gap-1">
          {stages.map((_, i) => (
            <div key={i} className={cn("w-1 h-1 rounded-full", i <= currentIndex ? "bg-[#22c55e]" : "bg-[#22c55e]/20")} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {stages.map((s, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div 
              key={s.id} 
              onMouseEnter={() => setHoveredStage(s.desc)}
              onMouseLeave={() => setHoveredStage(null)}
              className={cn(
                "group relative border-l-4 py-2 px-3 flex items-center justify-between text-[10px] font-black tracking-tighter transition-all duration-300",
                isDone ? "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]/40" : 
                isCurrent ? "border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e] shadow-[inset_0_0_10px_#22c55e22] animate-pulse" : 
                "border-white/10 text-white/10 opacity-30 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="opacity-40">0{i+1}</span>
                <span>{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {isDone && <CheckCircle2 size={10} />}
                {isCurrent && <Activity size={10} className="animate-spin-slow" />}
              </div>
              
              {/* Tooltip on hover */}
              {isCurrent && (
                <div className="absolute left-full ml-2 top-0 bg-black border border-[#22c55e]/50 p-2 text-[8px] whitespace-nowrap z-[100] hidden group-hover:block terminal-text shadow-glow">
                  CURRENT_OBJECTIVE: {s.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-[8px] text-[#22c55e]/40 font-mono italic">
        {hoveredStage || "Hover operational nodes for intel..."}
      </div>
    </div>
  );
};

const NetworkVitals = ({ integrity }: { integrity: number }) => {
  const [packets, setPackets] = useState<number[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPackets(prev => {
        const next = [...prev, Math.random() * 40];
        if (next.length > 20) return next.slice(1);
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black/90 border-2 border-[#22c55e]/30 rounded p-4 shadow-[inset_0_0_20px_#22c55e11] crt-flicker">
      <h3 className="text-[10px] uppercase border-b border-[#22c55e]/20 pb-2 mb-3 opacity-80 font-black tracking-widest terminal-text">TACTICAL_VITAL_SIGNS</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1 text-[9px] font-black">
            <span className="opacity-60">CORPUS_INTEGRITY</span>
            <span className={integrity < 50 ? "text-[#ef4444]" : "text-[#22c55e]"}>{integrity}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 border border-white/10 p-0.5">
            <div 
              className={cn("h-full transition-all duration-1000", integrity < 50 ? "bg-[#ef4444]" : "bg-[#22c55e]")} 
              style={{ width: `${integrity}%` }}
            />
          </div>
        </div>

        <div className="h-20 flex items-end gap-0.5 border-b border-[#22c55e]/20 pb-1 relative overflow-hidden group cursor-crosshair">
          <div className="absolute top-0 right-0 p-1 opacity-20 flex items-center gap-1">
             <Radio size={8} className="animate-pulse" />
             <span className="text-[6px] font-black">TRAFFIC_SNIFFER</span>
          </div>
          {packets.map((h, i) => (
            <motion.div 
              key={i} 
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              className="flex-1 bg-[#22c55e]/40 group-hover:bg-[#22c55e]/60 transition-colors" 
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[8px] font-black uppercase">
          <button 
            onClick={() => setPackets([])}
            className="p-2 border border-[#22c55e]/10 bg-[#22c55e]/5 hover:bg-[#22c55e]/20 transition-all text-left"
          >
            <div className="opacity-40 mb-1">RESET_SNIFFA</div>
            <div className="text-[#22c55e]">PURGE_BUF</div>
          </button>
          <div className="p-2 border border-[#22c55e]/10 bg-[#22c55e]/10">
            <div className="opacity-40 mb-1">AUTO_RESOLVE</div>
            <div className="text-amber-500 animate-pulse">ACTIVE</div>
          </div>
        </div>
      </div>
        <div className="p-2 bg-[#22c55e]/10 border border-[#22c55e]/30 font-mono text-[7px] text-[#22c55e]/70 leading-tight">
          <div className="flex justify-between"><span>PKT_RCV:</span><span>{Math.floor(Math.random() * 999)}</span></div>
          <div className="flex justify-between"><span>CPU_SEC:</span><span>0.00{Math.floor(Math.random() * 9)}s</span></div>
          <div className="flex justify-between text-[#ef4444] animate-pulse"><span>ERR_LOG:</span><span>RETRY_TIMEOUT</span></div>
        </div>
      </div>
  );
};

const DecryptionRig = ({ hintsCount, stage }: { hintsCount: number, stage: GameStage }) => {
  return (
    <div className="bg-black/90 border-2 border-[#22c55e]/30 rounded p-4 flex flex-col shadow-[inset_0_0_20px_#22c55e11] crt-flicker">
      <div className="flex items-center justify-between border-b border-[#22c55e]/20 pb-2 mb-3">
        <h3 className="text-[10px] uppercase opacity-80 font-black tracking-widest terminal-text">FRAGMENT_ASSEMBLER</h3>
        <span className="text-[10px] text-[#22c55e] font-black">{hintsCount}/4</span>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-10 h-10 border-2 flex items-center justify-center transition-all duration-500",
                i < hintsCount 
                  ? "border-[#22c55e] bg-[#22c55e]/10 shadow-glow" 
                  : "border-white/10 bg-white/5 opacity-20"
              )}
            >
              {i < hintsCount ? (
                <div className="text-[#22c55e] font-black text-lg animate-pulse">{String.fromCharCode(65 + i)}</div>
              ) : (
                <Lock size={14} className="text-white/20" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-[8px] font-black uppercase">
            <span className="opacity-40">PROCESSING_UNIT</span>
            <span className={stage === 'cipher' ? "text-[#22c55e] animate-pulse" : "opacity-20"}>
              {stage === 'cipher' ? "COMPUTING_HASHES" : "WAITING_FOR_DATA"}
            </span>
          </div>
          <div className="w-full h-1 bg-white/5 overflow-hidden">
            <motion.div 
              animate={stage === 'cipher' ? { x: ["-100%", "100%"] } : {}}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="h-full w-1/2 bg-[#22c55e]"
            />
          </div>
        </div>

        <div className="mt-4 p-2 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded text-center">
          <p className="text-[8px] text-[#22c55e] font-black uppercase tracking-tighter italic">
            {stage === 'final' ? "!! SEQUENCE_READY_FOR_ENGAGEMENT !!" : "RECOVER SECTOR FRAGMENTS TO PROCEED"}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Game Stages ---

const LeaderboardTicker = ({ entries }: { entries: LeaderboardEntry[] }) => (
  <div className="w-full bg-[#22c55e]/5 border-b border-[#22c55e]/20 py-1.5 overflow-hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] relative z-50">
    <div className="flex animate-marquee min-w-max">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-12 px-6 items-center shrink-0">
          <span className="text-[#22c55e]/40 font-black">TOP OPERATIONAL RECORDS //</span>
          {entries.sort((a, b) => b.score - a.score).slice(0, 5).map((entry, j) => (
            <div key={j} className="flex gap-3 items-center">
              <span className="text-[#22c55e] font-bold">{entry.name}</span>
              <span className="text-white/40">[{entry.score}]</span>
              <span className="text-[#22c55e]/20">/</span>
            </div>
          ))}
          {entries.length === 0 && <span className="text-white/20 italic">DATABASE EMPTY - NO RECORDS FOUND</span>}
        </div>
      ))}
    </div>
  </div>
);

const MissionBoard = ({
  completed,
  onSelect,
  stagePoints
}: {
  completed: Record<string, boolean>;
  onSelect: (q: QuestionItem) => void;
  stagePoints: number;
}) => {
  const solved = Object.keys(completed).length;
  const totalQuestions = Object.values(QUESTION_BANK).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">Mission Board: Pick Any Category + Difficulty</span>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase text-white/60 tracking-widest">Solved {solved}/{totalQuestions}</span>
          <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">Points: {stagePoints}</span>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4 scrollbar-hide">
        {(Object.keys(QUESTION_BANK) as Category[]).map((category) => (
          <div key={category} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h3 className="text-xs text-[#22c55e] font-black uppercase tracking-[0.2em]">{CATEGORY_LABELS[category]}</h3>
            <div className="space-y-2">
              {QUESTION_BANK[category].map((question) => {
                const done = !!completed[question.id];
                return (
                  <button
                    key={question.id}
                    onClick={() => !done && onSelect(question)}
                    disabled={done}
                    className={cn(
                      'w-full text-left p-3 border rounded transition-all',
                      done
                        ? 'border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]/40 cursor-not-allowed'
                        : 'border-white/10 bg-black/30 hover:border-[#22c55e]/40 hover:bg-[#22c55e]/10 text-white'
                    )}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest">{question.difficulty} // {question.points} pts</span>
                      <span className={cn('text-[9px] px-2 py-0.5 border rounded uppercase font-black', BOARD_DIFFICULTY_BADGE[question.difficulty])}>
                        {done ? 'Completed' : 'Available'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuestionMockScreenshot = ({ question, overrideSrc, overrideLabel }: { question: QuestionItem; overrideSrc?: string; overrideLabel?: string }) => {
  const baseUrl = import.meta.env.BASE_URL;
  const screenshotByQuestionId: Record<string, { src: string; label: string }> = {
    'phishing-easy': { src: `${baseUrl}mockshots/questions/phishing-easy-discord.svg`, label: 'Discord Link Drop Evidence' },
    'phishing-medium': { src: `${baseUrl}mockshots/questions/phishing-medium-dm.svg`, label: 'Urgent DM Verification Evidence' },
    'phishing-hard': { src: `${baseUrl}mockshots/questions/phishing-hard-email-auth.svg`, label: 'Email Auth Header Evidence' },

    'osint-easy': { src: `${baseUrl}mockshots/questions/osint-easy-social-feed.svg`, label: 'Public Social Feed Evidence' },
    'osint-medium': { src: `${baseUrl}mockshots/questions/osint-medium-password-hints.svg`, label: 'Password Clue Correlation Evidence' },
    'osint-hard': { src: `${baseUrl}mockshots/questions/osint-hard-photo-metadata.svg`, label: 'Reverse Image Evidence' },

    'network-easy': { src: `${baseUrl}mockshots/questions/network-easy-portscan.svg`, label: 'Sequential Port Scan Evidence' },
    'network-medium': { src: `${baseUrl}mockshots/questions/network-medium-segmentation.svg`, label: 'Segmentation Control Evidence' },
    'network-hard': { src: `${baseUrl}mockshots/questions/network-hard-beaconing.svg`, label: 'Periodic Beacon Timeline Evidence' },

    'cipher-easy': { src: `${baseUrl}mockshots/questions/cipher-easy-rot13.svg`, label: 'ROT13 Shift Evidence' },
    'cipher-medium': { src: `${baseUrl}mockshots/questions/cipher-medium-caesar.svg`, label: 'Caesar Shift Evidence' },
    'cipher-hard': { src: `${baseUrl}mockshots/questions/cipher-hard-otp.svg`, label: 'One-Time Pad Evidence' },

    'final-easy': { src: `${baseUrl}mockshots/questions/final-easy-defense-layers.svg`, label: 'Defense in Depth Evidence' },
    'final-medium': { src: `${baseUrl}mockshots/questions/final-medium-incident-timeline.svg`, label: 'Containment First Evidence' },
    'final-hard': { src: `${baseUrl}mockshots/questions/final-hard-zero-trust.svg`, label: 'Zero Trust Policy Evidence' }
  };

  const shot = screenshotByQuestionId[question.id];
  const resolvedSrc = overrideSrc || shot?.src;
  const resolvedLabel = overrideLabel || shot?.label;

  if (!resolvedSrc || !resolvedLabel) return null;

  return (
    <div className="border border-[#22c55e]/30 bg-black/40 rounded-md overflow-hidden mb-3">
      <div className="px-3 py-1.5 bg-black text-[9px] text-[#22c55e]/80 uppercase tracking-widest font-black">Evidence // {resolvedLabel}</div>
      <img
        src={resolvedSrc}
        alt={`${resolvedLabel} for ${question.category} challenge`}
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  );
};

const QuestionStage = ({
  question,
  selectedChoice,
  onChoice,
  onSubmit,
  osintHardImageSrc,
  osintHardGuess,
  onOsintHardGuessChange,
  onSubmitOsintHard,
  onBack,
  onHint,
  hintsUsed,
  onEduToggle
}: {
  question: QuestionItem;
  selectedChoice: number | null;
  onChoice: (index: number) => void;
  onSubmit: () => void;
  osintHardImageSrc?: string;
  osintHardGuess: string;
  onOsintHardGuessChange: (value: string) => void;
  onSubmitOsintHard: () => void;
  onBack: () => void;
  onHint: () => void;
  hintsUsed: number;
  onEduToggle: () => void;
}) => {
  const support = QUESTION_SUPPORT[question.id];
  const isOsintReverseImage = question.id === 'osint-hard';

  return (
  <div className="w-full h-full flex flex-col">
    <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">{CATEGORY_LABELS[question.category]} // {question.difficulty}</span>
        <HintButton onHint={onHint} hintsUsed={hintsUsed} />
        <CyberIntelButton onClick={onEduToggle} />
      </div>
      <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">{question.points} Points</span>
    </div>

    <div className="flex-1 p-8 flex flex-col justify-center gap-6">
      <div className="bg-black/50 border border-[#22c55e]/30 rounded-lg p-6">
        <p className="text-sm text-white leading-relaxed">{question.prompt}</p>
        {support && (
          <div className="mt-4 border-t border-[#22c55e]/20 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-[#22c55e]/70 font-black mb-1">Evidence</p>
            <QuestionMockScreenshot
              question={question}
              overrideSrc={isOsintReverseImage ? osintHardImageSrc : undefined}
              overrideLabel={isOsintReverseImage ? 'Reverse Image Target' : undefined}
            />
            <p className="text-xs text-[#e5e7eb]/80 leading-relaxed">{support.realisticExample}</p>
          </div>
        )}
      </div>

      {isOsintReverseImage ? (
        <div className="bg-black/40 border border-[#22c55e]/20 rounded-lg p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#22c55e]/70 font-black">Reverse Image Submit</p>
          <input
            type="text"
            value={osintHardGuess}
            onChange={(e) => onOsintHardGuessChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmitOsintHard()}
            placeholder="Enter city or college name..."
            className="w-full bg-black/60 border border-[#22c55e]/30 px-4 py-3 font-mono text-[#22c55e] text-xs outline-none focus:border-[#22c55e] placeholder:text-[#22c55e]/20 uppercase tracking-wider"
          />
          <p className="text-[10px] text-white/50">Accepted examples: Nelsonville, Hocking College</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {question.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => onChoice(idx)}
              className={cn(
                'text-left p-4 border rounded font-mono text-xs transition-all',
                selectedChoice === idx
                  ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                  : 'border-white/10 bg-white/5 text-white/80 hover:border-[#22c55e]/30'
              )}
            >
              {String.fromCharCode(65 + idx)}. {choice}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-3 border border-white/20 text-white/70 text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all">
          Back to Board
        </button>
        <button
          onClick={isOsintReverseImage ? onSubmitOsintHard : onSubmit}
          disabled={isOsintReverseImage ? osintHardGuess.trim().length === 0 : selectedChoice === null}
          className={cn(
            'px-6 py-3 text-[10px] uppercase tracking-widest font-black transition-all',
            (isOsintReverseImage ? osintHardGuess.trim().length === 0 : selectedChoice === null)
              ? 'border border-[#22c55e]/20 text-[#22c55e]/20 cursor-not-allowed'
              : 'bg-[#22c55e] text-black hover:bg-white'
          )}
        >
          {isOsintReverseImage ? 'Submit Location' : 'Submit Answer'}
        </button>
      </div>
    </div>
  </div>
  );
};

const QuestionResourcesPanel = ({ question }: { question: QuestionItem }) => {
  const support = QUESTION_SUPPORT[question.id];
  if (!support) return null;

  return (
    <div className="bg-black border-4 border-[#22c55e]/30 rounded-lg p-4 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
      <div className="flex items-center justify-between mb-3 border-b border-[#22c55e]/20 pb-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#22c55e]">How to Solve</h3>
        <BookOpen size={14} className="text-[#22c55e]/70" />
      </div>
      <div className="space-y-3">
        {support.howToSolve.map((step, i) => (
          <div key={i} className="text-[10px] text-[#e5e7eb]/85 leading-relaxed border border-[#22c55e]/15 bg-[#22c55e]/5 p-2">
            <span className="text-[#22c55e] font-black mr-2">{i + 1}.</span>{step}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {support.resources.map((resource) => (
          <a
            key={resource.href}
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 border border-[#22c55e]/20 text-[10px] text-[#e5e7eb]/85 hover:text-black hover:bg-[#22c55e] transition-all font-mono"
          >
            {resource.label}
          </a>
        ))}
      </div>
    </div>
  );
};

const IntroStage = ({ onStart, onViewLeaderboard }: { onStart: (name: string) => void, onViewLeaderboard: () => void }) => {
  const [name, setName] = useState("");
  const warGamesPrompt = "RIVER PHANTOM IS ERASING SENIOR PASSING RECORDS.";
  const namePrompt = "ENTER YOUR CODENAME:";
  const [typedPrompt, setTypedPrompt] = useState("");
  const [typedNamePrompt, setTypedNamePrompt] = useState("");

  useEffect(() => {
    let promptInterval: NodeJS.Timeout | null = null;
    let nameInterval: NodeJS.Timeout | null = null;

    const promptTimer = setTimeout(() => {
      let promptIndex = 0;
      promptInterval = setInterval(() => {
        promptIndex += 1;
        setTypedPrompt(warGamesPrompt.slice(0, promptIndex));

        if (promptIndex >= warGamesPrompt.length && promptInterval) {
          clearInterval(promptInterval);

          const nameTimer = setTimeout(() => {
            let nameIndex = 0;
            nameInterval = setInterval(() => {
              nameIndex += 1;
              setTypedNamePrompt(namePrompt.slice(0, nameIndex));
              if (nameIndex >= namePrompt.length && nameInterval) {
                clearInterval(nameInterval);
              }
            }, 45);
          }, 250);

          return () => clearTimeout(nameTimer);
        }
      }, 70);
    }, 700);

    return () => {
      clearTimeout(promptTimer);
      if (promptInterval) clearInterval(promptInterval);
      if (nameInterval) clearInterval(nameInterval);
    };
  }, []);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl w-full text-center space-y-12 p-12 bg-black border-4 border-[#22c55e]/30 rounded-lg shadow-[0_0_100px_rgba(34,197,94,0.05)] relative overflow-hidden font-mono crt-flicker"
    >
      <div className="absolute top-4 left-4 flex gap-2 opacity-50 terminal-text">
        <Monitor size={14} className="text-[#22c55e]" />
        <span className="text-[10px] uppercase font-black tracking-widest">BLACKOUT RANKED // [740-OPS-01]</span>
      </div>

      <div className="space-y-8 pt-8">
        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl font-black text-[#22c55e] tracking-tighter uppercase italic terminal-text"
          >
            BLACKOUT RANKED
          </motion.h1>
          <div className="h-1 shadow-glow bg-[#22c55e]/50 w-64 mx-auto" />
          <p className="text-xs text-[#22c55e]/60 font-black tracking-[0.8em] uppercase terminal-text">South Gallia Cyber Season Finals</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#22c55e] text-2xl font-black tracking-widest terminal-text py-4 min-h-[3rem]"
        >
          {typedPrompt}
          <span className="animate-pulse">{typedPrompt.length < warGamesPrompt.length ? '█' : ''}</span>
        </motion.div>
      </div>

      <div className="space-y-8 max-w-sm mx-auto w-full pt-4">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-[#22c55e]/80 uppercase tracking-widest text-center terminal-text">ENTER CODENAME TO DEFEND YOUR CLASS</p>
          <div className="relative group text-left">
            <div className="absolute -inset-0.5 bg-[#22c55e] opacity-20 blur group-focus-within:opacity-40 transition-all"></div>
            <div className="relative w-full bg-black border-2 border-[#22c55e]/40 px-4 py-4 font-mono space-y-3">
              <div className="text-[#22c55e]/85 text-xs uppercase tracking-[0.2em] min-h-[1rem]">
                {typedNamePrompt}
                <span className="animate-pulse">{typedNamePrompt.length < namePrompt.length ? '█' : ''}</span>
              </div>
              <div className="flex items-center gap-2 border-t border-[#22c55e]/20 pt-3">
                <span className="text-[#22c55e] font-black">&gt;</span>
                <input 
                  type="text"
                  maxLength={24}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && onStart(name)}
                  className="flex-1 bg-transparent text-[#22c55e] font-mono outline-none uppercase text-lg tracking-[0.2em]"
                />
                <span className="text-[#22c55e] animate-pulse">█</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <button 
            onClick={() => onStart(name)}
            disabled={!name.trim()}
            className={cn(
              "group relative w-full px-10 py-6 font-black uppercase tracking-[0.3em] transition-all duration-500 overflow-hidden text-xl border-4",
              name.trim() 
                ? "bg-[#22c55e] text-black border-[#22c55e] hover:bg-black hover:text-[#22c55e] cursor-pointer shadow-[0_0_50px_#22c55e88]"
                : "border-[#22c55e]/10 text-[#22c55e]/10 cursor-not-allowed"
            )}
          >
            INITIATE SIMULATION
          </button>

          <div className="flex justify-between items-center px-4">
            <button 
              onClick={onViewLeaderboard}
              className="text-[10px] uppercase tracking-[0.4em] font-black text-[#22c55e]/40 hover:text-[#22c55e] transition-all flex items-center gap-3 group"
            >
              <History size={14} /> 
              ARCHIVES
            </button>
            <div className="h-px flex-1 bg-[#22c55e]/10 mx-6" />
            <span className="text-[10px] font-black text-[#22c55e]/20 tracking-tighter">SEC_LVL_4</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-40">
        <Radio size={12} className="text-[#00FF41] animate-pulse" />
        <span className="text-[8px] font-black tracking-widest uppercase">CONNECTION SECURE // SOUTH GALLIA CTF</span>
      </div>
    </motion.div>
  );
};

const PhishingStage = ({ data, onSuccess, onFail, onHint, hintsUsed, onEduToggle }: { data: PuzzleData['phishing'], onSuccess: () => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number, onEduToggle: () => void }) => {
  const [correctlyAnalyzed, setCorrectlyAnalyzed] = useState<Set<number>>(new Set());
  const [activeHeader, setActiveHeader] = useState<number | null>(null);

  const emails = data.emails;
  const analyzedCount = correctlyAnalyzed.size;

  const handleAction = (emailId: number, markedAsPhish: boolean) => {
    const email = emails.find(e => e.id === emailId);
    if (!email || correctlyAnalyzed.has(emailId)) return;

    if (email.isPhish === markedAsPhish) {
      setCorrectlyAnalyzed(prev => {
        const next = new Set(prev);
        next.add(emailId);
        if (next.size >= 5) {
          onSuccess();
        } else {
          playSound('correct');
        }
        return next;
      });
    } else {
      onFail(markedAsPhish ? "Analyzing legitimate traffic. Latency increased!" : "Malicious packet bypassed perimeter defense!", 30);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">SECTOR BREACH: Packet Filtering ({analyzedCount}/5)</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
          <CyberIntelButton onClick={onEduToggle} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] py-0.5 px-2 font-black rounded uppercase tracking-tighter border", DIFFICULTY_BADGE['MEDIUM'])}>MEDIUM · 200 PTS</span>
          <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: PHS01</span>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans scrollbar-hide">
        {emails.map((email) => (
          <div key={email.id} className={cn(
            "bg-white/5 border border-white/10 rounded-lg p-5 group hover:border-[#22c55e]/30 transition-all relative overflow-hidden",
            correctlyAnalyzed.has(email.id) && "border-[#22c55e]/50 bg-[#22c55e]/10"
          )}>
            <div className="border-b border-white/10 pb-2 mb-3 flex justify-between items-start">
              <div>
                <p className="text-[9px] uppercase opacity-40 font-mono">From:</p>
                <p className="text-xs font-bold text-[#e5e7eb]">{email.sender}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase opacity-40 font-mono">Subject:</p>
                <p className="text-xs font-bold text-[#e5e7eb]">{email.subject}</p>
              </div>
            </div>
            
            <div className="relative">
              <p className={cn("text-xs text-[#e5e7eb]/70 leading-relaxed mb-6 italic transition-opacity", activeHeader === email.id && "opacity-10")}>
                {email.content}
              </p>
              
              <AnimatePresence>
                {activeHeader === email.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-0 bg-black/80 p-2 rounded border border-[#22c55e]/30 font-mono text-[9px] text-[#22c55e]/80 whitespace-pre overflow-hidden"
                  >
                    {email.header}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => handleAction(email.id, true)}
                disabled={correctlyAnalyzed.has(email.id)}
                className="flex-1 py-2 border border-[#22c55e]/50 bg-[#22c55e]/5 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#22c55e] hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Quarantine
              </button>
              <button 
                onClick={() => handleAction(email.id, false)}
                disabled={correctlyAnalyzed.has(email.id)}
                className="flex-1 py-2 border border-white/10 bg-white/5 text-white/30 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all font-mono disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Safe Passage
              </button>
              <button 
                onMouseEnter={() => setActiveHeader(email.id)}
                onMouseLeave={() => setActiveHeader(null)}
                className="w-10 flex items-center justify-center border border-white/10 bg-white/5 text-white/30 hover:text-[#22c55e] hover:border-[#22c55e]/30 transition-all"
                title="View Source"
              >
                <TerminalIcon size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OSINTStage = ({ data, onSuccess, onFail, onHint, hintsUsed, onEduToggle }: { data: PuzzleData['osint'], onSuccess: () => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number, onEduToggle: () => void }) => {
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [activeTab, setActiveTab] = useState<'social' | 'archive' | 'records'>('social');
  const [currentStep, setCurrentStep] = useState<'recovery' | 'geolocation'>('recovery');
  const [imageError, setImageError] = useState(false);
  
  const profiles = data.profiles;

  const handlePasswordSubmit = () => {
    if (password.toLowerCase() === data.answer) {
      playSound('correct');
      setCurrentStep('geolocation');
    } else {
      onFail("Cognitive analysis mismatch. target trace lost.");
    }
  };

  const handleLocationSubmit = () => {
    const val = location.toLowerCase();
    if (val.includes("nelsonville") || val.includes("hocking")) {
      onSuccess();
    } else {
      onFail("Coordinate mismatch. Target building not identified.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">
            SECTOR BREACH: {currentStep === 'recovery' ? "Metadata Reconstruction" : "Visual Geolocation"}
          </span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
          <CyberIntelButton onClick={onEduToggle} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] py-0.5 px-2 font-black rounded uppercase tracking-tighter border", DIFFICULTY_BADGE['HARD'])}>HARD · 300 PTS</span>
          <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: OSN02</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 'recovery' ? (
          <motion.div 
            key="recovery"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 p-4 grid grid-cols-12 gap-4 h-full overflow-hidden"
          >
            {/* Sidebar Nav */}
            <div className="col-span-3 flex flex-col gap-2">
              {Object.keys(profiles).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "py-3 px-4 border text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between",
                    activeTab === tab ? "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]" : "border-white/10 text-white/40 hover:bg-white/5"
                  )}
                >
                  {tab}
                  {activeTab === tab && <Activity size={12} className="animate-pulse" />}
                </button>
              ))}
              <div className="flex-1 mt-4 border border-white/5 rounded p-3 bg-black/20">
                <h4 className="text-[8px] uppercase text-[#22c55e]/40 font-black mb-2">Subject Dossier</h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[7px] text-white/20 uppercase">Subject</p>
                    <p className="text-[10px] text-white/60">PHANTOM_HAX</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="col-span-9 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    {profiles[activeTab].map((p, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-lg hover:border-[#22c55e]/20 transition-all group">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                          <span className="text-[9px] font-black text-[#22c55e]/80">@{p.user} // {p.platform}</span>
                          <span className="text-[8px] text-white/20">LOG_{1000 + i}</span>
                        </div>
                        <p className="text-xs text-white/80 italic leading-relaxed">"{p.content}"</p>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 p-4 rounded-lg flex items-center gap-4">
                <div className="flex-1 relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#22c55e]/40" />
                  <input 
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="RECONSTRUCTED PASS KEY..."
                    className="w-full bg-black/40 border border-[#22c55e]/30 pl-10 pr-4 py-3 font-mono text-[#22c55e] text-xs outline-none focus:border-[#22c55e] placeholder:text-[#22c55e]/10 uppercase tracking-widest"
                  />
                </div>
                <button 
                  onClick={handlePasswordSubmit}
                  className="px-8 py-3 bg-[#22c55e] text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-[0_0_20px_#22c55e44]"
                >
                  Verify
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="geolocation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-6 flex flex-col items-center justify-center space-y-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-sm font-black text-[#22c55e] uppercase tracking-widest">Visual Reconnaissance Recovered</h3>
              <p className="text-[10px] text-[#22c55e] font-black uppercase tracking-tighter bg-[#22c55e]/10 py-1 px-2 inline-block rounded mb-2">TARGET: IDENTIFY THE CITY OR COLLEGE SHOWN BELOW</p>
              <p className="text-[10px] text-white/40 uppercase italic font-mono px-8">Use visual cues or search tools to pinpoint this exact location based on landmarks.</p>
            </div>

            <div className="relative group max-w-lg w-full">
              <div className="absolute -inset-1 bg-[#22c55e]/30 blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative rounded border-2 border-[#22c55e]/40 w-full aspect-video overflow-hidden bg-black flex items-center justify-center">
                {!imageError ? (
                  <img 
                    src={data.locationImage} 
                    alt="OSINT Challenge" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-500 grayscale group-hover:grayscale-0"
                    onLoad={() => console.log("Intel image uplink established.")}
                    onError={() => {
                      console.error("Intel link severed. Initiating vector reconstruction.");
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div className="w-full h-full p-4 flex flex-col items-center justify-center space-y-4 font-mono border-2 border-[#22c55e]/30 bg-[#22c55e]/5">
                    <div className="w-full h-full border border-[#22c55e]/20 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <motion.div 
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.6, 1, 0.6] 
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="relative w-64 h-40 border-2 border-[#22c55e]/60 flex flex-col items-center justify-center space-y-4 bg-black"
                      >
                        <div className="text-[10px] font-black text-[#22c55e] animate-pulse uppercase tracking-[0.3em]">
                          SATELLITE_UPLINK_LOST
                        </div>
                        <button 
                          onClick={() => setImageError(false)}
                          className="px-4 py-2 border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e] text-[8px] font-black hover:bg-[#22c55e] hover:text-black transition-all uppercase tracking-widest z-50"
                        >
                          Reconnect Signal
                        </button>
                      </motion.div>
                      <div className="absolute bottom-4 left-0 right-0 py-2 bg-black border-y-2 border-[#22c55e]/40 text-[#22c55e] text-[8px] text-center font-black animate-pulse tracking-widest px-4">
                        FALLBACK_MODE: MANUALLY_IDENTIFY_LOCATION // SIGNAL_RECOVERY_FAILURE
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 border border-[#22c55e]/30 font-mono text-[8px] text-[#22c55e] terminal-text">
                RECON_ARRAY_V1.4 // LOCAL_UPLINK
              </div>
            </div>

            <div className="w-full max-w-sm space-y-4">
              <div className="relative">
                <TerminalIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#22c55e]/40" />
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit()}
                  placeholder="CITY OR COLLEGE NAME..."
                  className="w-full bg-black/40 border-2 border-[#22c55e]/30 p-4 pl-10 font-mono text-[#22c55e] text-center focus:outline-none focus:border-[#22c55e] placeholder:text-[#22c55e]/20 uppercase tracking-widest text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setCurrentStep('recovery')}
                  className="py-3 border border-[#22c55e]/30 text-[#22c55e]/60 text-[10px] font-black uppercase hover:bg-white/5"
                >
                  Back to Posts
                </button>
                <button 
                  onClick={handleLocationSubmit}
                  className="py-3 bg-[#22c55e] text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-[0_0_20px_#22c55e44]"
                >
                  Verify Geo-Intel
                </button>
              </div>
              <p className="text-[9px] text-[#22c55e] italic text-center font-mono font-bold">
                INTEL: The target area is known for its historic central hub and local industrial heritage.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CipherStage = ({ data, onSuccess, onFail, onHint, hintsUsed, onEduToggle }: { data: PuzzleData['cipher'], onSuccess: () => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number, onEduToggle: () => void }) => {
  const [answer, setAnswer] = useState("");
  const encryptedString = data.encrypted;
  
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const rot13 = (char: string) => {
    const idx = alphabet.indexOf(char.toUpperCase());
    if (idx === -1) return char;
    return alphabet[(idx + 13) % 26];
  };

  const handleSubmit = () => {
    if (answer.toUpperCase() === data.word) {
      onSuccess();
    } else {
      onFail("Decryption sequence rejected. Data corruption detected.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">SECTOR BREACH: Cryptographic Override</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
          <CyberIntelButton onClick={onEduToggle} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] py-0.5 px-2 font-black rounded uppercase tracking-tighter border", DIFFICULTY_BADGE['EASY'])}>EASY · 100 PTS</span>
          <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: CRY04</span>
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-8 overflow-hidden">
        <div className="text-center space-y-4">
          <div className="text-[10px] font-mono text-[#22c55e]/40 uppercase tracking-[0.4em]">Intercepted Ciphertext</div>
          <div className="text-6xl font-black text-[#22c55e] tracking-[0.3em] animate-pulse drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            {encryptedString}
          </div>
        </div>

        {/* Decoder Tool */}
        <div className="w-full max-w-2xl bg-black/40 border border-[#22c55e]/20 p-4 rounded-lg">
          <h4 className="text-[8px] uppercase text-[#22c55e]/40 font-black mb-3">ROT13 Translation Matrix</h4>
          <div className="grid grid-cols-13 gap-1 font-mono text-[9px] text-center">
            {alphabet.map((char) => (
              <div key={char} className="flex flex-col gap-1">
                <span className="text-white/40">{char}</span>
                <span className="text-[#22c55e] font-bold">↓</span>
                <span className="text-[#22c55e] bg-[#22c55e]/10 py-1 rounded">{rot13(char)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-2xl bg-black/30 border border-[#22c55e]/20 p-4 rounded-lg text-left space-y-4">
          <h4 className="text-[8px] uppercase text-[#22c55e]/40 font-black tracking-widest">Cipher Decode Resources</h4>

          <div className="space-y-1">
            <p className="text-[8px] text-[#22c55e]/60 uppercase font-black tracking-widest">All-in-One</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://gchq.github.io/CyberChef/" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">CyberChef</a>
              <a href="https://www.dcode.fr/en" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">dCode (200+ ciphers)</a>
              <a href="https://cryptii.com/" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Cryptii</a>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] text-[#22c55e]/60 uppercase font-black tracking-widest">ROT / Caesar / Shift</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://rot13.com/" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">ROT13.com</a>
              <a href="https://www.dcode.fr/caesar-cipher" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Caesar Cipher (dCode)</a>
              <a href="https://gchq.github.io/CyberChef/#recipe=ROT13(true,true,false,13)" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">CyberChef ROT13</a>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] text-[#22c55e]/60 uppercase font-black tracking-widest">Vigenère / Keyword</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://www.dcode.fr/vigenere-cipher" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Vigenère (dCode)</a>
              <a href="https://www.guballa.de/vigenere-solver" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Vigenère Solver</a>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] text-[#22c55e]/60 uppercase font-black tracking-widest">Base64 / Hex / Binary</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://www.base64decode.org/" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Base64 Decode</a>
              <a href="https://www.rapidtables.com/convert/number/hex-to-ascii.html" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Hex to ASCII</a>
              <a href="https://www.rapidtables.com/convert/number/binary-to-ascii.html" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Binary to ASCII</a>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] text-[#22c55e]/60 uppercase font-black tracking-widest">Morse / Substitution / Atbash</p>
            <div className="flex flex-wrap gap-2">
              <a href="https://morsecode.world/international/translator.html" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Morse Translator</a>
              <a href="https://www.dcode.fr/substitution-cipher" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Substitution (dCode)</a>
              <a href="https://www.dcode.fr/atbash-cipher" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-2 border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-black uppercase tracking-[0.15em] hover:bg-[#22c55e] hover:text-black transition-all">Atbash (dCode)</a>
            </div>
          </div>

          <p className="text-[9px] text-[#e5e7eb]/70 font-mono border-t border-[#22c55e]/10 pt-3">
            Use only puzzle text in external tools. Do not paste passwords, student data, or private information.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="relative">
            <RefreshCw size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#22c55e]/40 animate-spin-slow" />
            <input 
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="DECODED KEYWORD..."
              className="w-full bg-black/60 border-2 border-[#22c55e]/40 p-5 pl-10 font-mono text-[#22c55e] text-center focus:outline-none focus:border-[#22c55e] placeholder:text-[#22c55e]/20 uppercase tracking-[0.4em] text-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
              autoFocus
            />
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full py-4 border-2 border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e] font-black uppercase tracking-[0.3em] hover:bg-[#22c55e] hover:text-black transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]"
          >
            Execute Decryption
          </button>
        </div>
      </div>
    </div>
  );
};

const NetworkStage = ({ data, onSuccess, onFail, onHint, hintsUsed, onEduToggle }: { data: PuzzleData['network'], onSuccess: () => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number, onEduToggle: () => void }) => {
  const logs = data.logs;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">SECTOR BREACH: Threat Hunting (PCAP)</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
          <CyberIntelButton onClick={onEduToggle} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] py-0.5 px-2 font-black rounded uppercase tracking-tighter border", DIFFICULTY_BADGE['MEDIUM'])}>MEDIUM · 200 PTS</span>
          <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: NET03</span>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="bg-[#101010]/80 backdrop-blur-md border border-[#22c55e]/20 rounded-lg overflow-hidden flex-1 flex flex-col font-mono text-[10px]">
          <div className="bg-[#22c55e]/10 p-3 flex justify-between uppercase font-black tracking-widest text-[#22c55e]/80 border-b border-[#22c55e]/20">
            <span className="w-16">Timestamp</span>
            <span className="w-32">Source IP</span>
            <span className="w-16 text-center">Port</span>
            <span className="flex-1 text-right">Activity</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#22c55e]/10 scrollbar-hide">
            {logs.map((log, i) => (
              <button
                key={i}
                onClick={() => log.suspicious ? onSuccess() : onFail("Monitoring benign node. Alert threshold raised!")}
                className="w-full flex items-center justify-between p-3 hover:bg-[#22c55e]/10 text-[#22c55e]/60 text-left transition-colors font-bold uppercase"
              >
                <span className="w-16 opacity-40">{log.time}</span>
                <span className={cn("w-32", log.suspicious ? "text-white underline decoration-[#22c55e]/30" : "text-white/60")}>{log.src}</span>
                <span className="w-16 text-center font-black">{log.port}</span>
                <span className="flex-1 text-right truncate italic opacity-80">{log.info}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-[#22c55e]/60 font-mono italic">
          CRITICAL: IDENTIFY THE EXTERNAL IP (WAN) TARGETING MULTIPLE CRITICAL INFRASTRUCTURE PORTS.
        </p>
      </div>
    </div>
  );
};

const FinalStage = ({ data, onSuccess, onFail, onHint, hintsUsed, hints, onEduToggle }: { data: string, onSuccess: () => void, onFail: (msg: string, penalty?: number) => void, onHint: () => void, hintsUsed: number, hints: string[], onEduToggle: () => void }) => {
  const [code, setCode] = useState("");
  
  const handleSubmit = () => {
    if (code.toUpperCase() === data.toUpperCase()) {
      onSuccess();
    } else {
      onFail("Master sequence code mismatch. Core dump triggered!", 50);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-[#22c55e]/10 border-b border-[#22c55e]/40 px-4 py-2 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[#22c55e]">Objective: Shutdown Command</span>
          <HintButton onHint={onHint} hintsUsed={hintsUsed} />
          <CyberIntelButton onClick={onEduToggle} />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[9px] py-0.5 px-2 font-black rounded uppercase tracking-tighter border", DIFFICULTY_BADGE['HARD'])}>HARD · 400 PTS</span>
          <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FINAL STAGE</span>
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-12">
        <div className="w-full max-w-sm bg-[#22c55e]/5 p-8 border-2 border-dashed border-[#22c55e]/30 rounded-2xl text-center space-y-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#22c55e]/40">Security Fragment Status</p>
          <div className="space-y-4">
            <p className="text-[8px] uppercase text-[#22c55e]/60 font-black tracking-widest text-center">Fragments Recovered:</p>
            <div className="flex justify-center flex-wrap gap-3">
              {hints.map((h, i) => (
                <div key={i} className="px-3 h-12 border-2 border-[#22c55e] flex items-center justify-center font-black text-[#22c55e] text-xs bg-[#22c55e]/10 shadow-[0_0_10px_rgba(34,197,94,0.2)] uppercase tracking-wider">
                  {h}
                </div>
              ))}
              {Array.from({ length: 4 - hints.length }).map((_, i) => (
                <div key={i} className="w-12 h-12 border border-white/10 flex items-center justify-center font-black text-white/10 text-xs bg-black/40 italic">
                  ?
                </div>
              ))}
            </div>
            <p className="text-[8px] text-white/30 italic text-center font-mono py-2 border-t border-[#22c55e]/10">
              Combine these fragments with your operational intelligence to deduce the command.
            </p>
          </div>
          <p className="text-[9px] text-[#22c55e]/60 font-mono italic px-4 leading-relaxed">
            SYSTEM INSTRUCTION: Assemble decrypted bytes into the final override string. 
            The full sequence represents your operational designation as the ultimate South Gallia __ __ __ __ __ __ __.
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <input 
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="OVERRIDE CODE..."
            className="w-full bg-black/60 border-2 border-[#22c55e] p-6 font-mono text-[#22c55e] text-center focus:outline-none placeholder:text-[#22c55e]/10 uppercase tracking-[1em] text-3xl shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            autoFocus
          />
          <button 
            onClick={handleSubmit}
            className="w-full py-5 bg-[#22c55e] text-black font-black uppercase tracking-[0.4em] hover:bg-white transition-all text-sm shadow-[0_0_40px_rgba(34,197,94,0.4)]"
          >
            ENGAGE EMERGENCY PURGE
          </button>
        </div>
      </div>
    </div>
  );
};

const Leaderboard = ({ entries }: { entries: LeaderboardEntry[] }) => (
  <div className="w-full max-w-md mx-auto bg-black/40 border border-[#22c55e]/20 rounded-lg p-4 font-mono text-[10px]">
    <div className="flex justify-between border-b border-[#22c55e]/20 pb-2 mb-2 text-[#22c55e] font-black uppercase tracking-widest">
      <span className="w-8">Rank</span>
      <span className="flex-1 px-4">Codename</span>
      <span className="w-16 text-right">Score</span>
    </div>
    <div className="space-y-1">
      {entries.sort((a, b) => b.score - a.score).slice(0, 5).map((entry, i) => (
        <div key={i} className={cn(
          "flex justify-between py-1 transition-colors",
          i === 0 ? "text-[#22c55e] font-bold" : "text-[#22c55e]/60"
        )}>
          <span className="w-8">#{i + 1}</span>
          <span className="flex-1 px-4 truncate uppercase">{entry.name}</span>
          <span className="w-16 text-right tabular-nums">{entry.score}</span>
        </div>
      ))}
      {entries.length === 0 && <p className="text-center py-4 opacity-30 italic">No historical data found.</p>}
    </div>
  </div>
);

const VictoryScreen = ({ onRestart, timeRemaining, dbIntegrity, operativeName, onSaveLeaderboard, stagePoints }: { onRestart: () => void, timeRemaining: number, dbIntegrity: number, operativeName: string, onSaveLeaderboard: (entry: LeaderboardEntry) => void, stagePoints: number }) => {
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [reelSourceIndex, setReelSourceIndex] = useState(0);
  const hockingProgramUrl = 'https://www.hocking.edu/cybersecurity';
  const baseUrl = import.meta.env.BASE_URL;
  const reelSources = [
    `${baseUrl}media/hocking-cyber-reel.mp4`,
    '/media/hocking-cyber-reel.mp4'
  ];
  const hockingReelVideoUrl = reelSources[reelSourceIndex];

  useEffect(() => {
    const saved = localStorage.getItem('cyber-guard-leaderboard');
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse leaderboard", e);
      }
    }
  }, []);

  const totalScore = Math.floor(stagePoints + (PRACTICE_MODE ? 0 : (timeRemaining * 10)) + (dbIntegrity * 50));

  const handleSave = () => {
    const newEntry: LeaderboardEntry = {
      name: operativeName,
      score: totalScore,
      time: timeRemaining,
      integrity: dbIntegrity,
      date: new Date().toISOString()
    };
    onSaveLeaderboard(newEntry);
    setSubmitted(true);
    // Refresh local state to show updated leaderboard
    const saved = localStorage.getItem('cyber-guard-leaderboard');
    if (saved) setLeaderboard(JSON.parse(saved));
    playSound('correct');
  };

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="max-w-3xl w-full text-center space-y-8 p-12 bg-black border-4 border-[#00FF41] rounded-lg shadow-[0_0_100px_rgba(0,255,65,0.2)] font-mono"
    >
      <div className="relative">
        <Trophy size={80} className="text-[#00FF41] mx-auto drop-shadow-[0_0_20px_#00FF41]" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-[#00FF41] blur-3xl rounded-full"
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[#00FF41]/40 text-[10px] tracking-[0.5em] font-black uppercase">Operation: Secure Graduation</p>
          <h2 className="text-5xl font-black text-[#00FF41] uppercase tracking-tighter italic">MISSION ACCOMPLISHED</h2>
        </div>
        <div className="h-0.5 w-full bg-[#00FF41]/20" />
        <p className="text-[#00FF41]/80 max-w-md mx-auto text-sm leading-relaxed">
          The threat has been neutralized. Operational integrity stands at <span className="text-white font-bold">{dbIntegrity}%</span>.
          Congratulations, Operative <span className="text-white font-black">{operativeName}</span>.
        </p>
        <p className="text-[#00FF41]/70 max-w-xl mx-auto text-xs leading-relaxed uppercase tracking-widest">
          Senior passing records restored. Class advancement and graduation clearance are back online.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 py-8 border-y border-[#00FF41]/20 max-w-xl mx-auto">
        <div className="space-y-1">
          <div className="text-[9px] uppercase text-[#00FF41]/40 tracking-[0.3em] font-black">Stage Points</div>
          <div className="text-2xl font-black text-[#00FF41]">{stagePoints}</div>
          <div className="text-[8px] text-[#00FF41]/30 font-mono">/ 1200 max</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] uppercase text-[#00FF41]/40 tracking-[0.3em] font-black">Mode</div>
          <div className="text-2xl font-black text-[#00FF41]">{PRACTICE_MODE ? 'Practice' : `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`}</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] uppercase text-[#00FF41]/40 tracking-[0.3em] font-black">Final Score</div>
          <div className="text-2xl font-black text-[#00FF41]">{totalScore}</div>
        </div>
      </div>

      <div className={cn("mx-auto space-y-6", submitted ? "max-w-5xl w-full" : "max-w-md")}>
        {!submitted ? (
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-[#00FF41] text-black font-black uppercase tracking-[0.4em] hover:bg-white transition-all text-sm shadow-[0_0_30px_#00FF41]"
          >
            Archive to OPS LOG
          </button>
        ) : (
          <div className="space-y-6 w-full">
            <div className="p-4 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded">
              <p className="text-[10px] text-[#00FF41] font-black tracking-widest uppercase">Record Synchronized</p>
            </div>
            <Leaderboard entries={leaderboard} />

            <div className="grid lg:grid-cols-2 gap-4 items-start">
              <div className="text-left p-5 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded space-y-3">
                <h3 className="text-xs text-[#00FF41] font-black tracking-[0.2em] uppercase">Cybersecurity Reel</h3>
                <div className="border border-[#00FF41]/40 rounded overflow-hidden p-2 bg-black/40">
                  <video
                    src={hockingReelVideoUrl}
                    controls
                    preload="metadata"
                    playsInline
                    onError={() => {
                      if (reelSourceIndex < reelSources.length - 1) {
                        setReelSourceIndex(prev => prev + 1);
                      }
                    }}
                    className="w-full max-w-[380px] mx-auto rounded"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-[10px] text-[#e5e7eb]/70 leading-relaxed">
                  The embedded reel loads from the local project video asset.
                </p>
                <p className="text-[11px] text-[#e5e7eb]/85 leading-relaxed">
                  Hocking College Cybersecurity Program students train through real-world scenarios to build skills they can apply in internships and entry-level roles.
                </p>
              </div>

              <div className="text-left p-5 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded space-y-3">
                <h3 className="text-xs text-[#00FF41] font-black tracking-[0.2em] uppercase">Hocking Cybersecurity Program Outcomes</h3>
                <ul className="space-y-2 text-[11px] text-[#e5e7eb]/85 leading-relaxed">
                  <li>AI and cloud technologies are integrated throughout the program alongside core cybersecurity and network defense training.</li>
                  <li>Hocking students compete in the National Cyber League (NCL) hacking competition and ranked in the <span className="text-white font-bold">top 10% nationally</span> in autumn and <span className="text-white font-bold">top 8% nationally</span> in spring.</li>
                  <li>Hocking is a <span className="text-white font-bold">Cisco Networking Academy</span>, <span className="text-white font-bold">EC-Council institution</span>, <span className="text-white font-bold">AWS member institution</span>, and <span className="text-white font-bold">CompTIA Academic Partner</span>.</li>
                  <li>Students have opportunities to earn microcredentials during classes while building hands-on skills in security operations, infrastructure, and incident response.</li>
                  <li>Coursework supports preparation for credentials, microcredentials, and certifications from <span className="text-white font-bold">CompTIA</span>, <span className="text-white font-bold">Cisco</span>, <span className="text-white font-bold">AWS</span>, <span className="text-white font-bold">IBM</span>, <span className="text-white font-bold">NVIDIA</span>, and <span className="text-white font-bold">Microsoft</span>.</li>
                  <li>Students create a portfolio of technical projects and evidence of competency they can present to employers.</li>
                  <li>Graduates are prepared for entry-level roles in SOC operations, network security, and cyber support pathways.</li>
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={hockingProgramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 border border-[#00FF41]/60 text-[#00FF41] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#00FF41] hover:text-black transition-all"
                  >
                    View Hocking Program
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={onRestart}
          className="text-[10px] uppercase tracking-[0.5em] font-black text-[#00FF41]/40 hover:text-white transition-all block w-full text-center pt-4"
        >
          {'>'} RETURN TO COMMAND CENTER
        </button>
      </div>
    </motion.div>
  );
};

const GameOverScreen = ({ onRestart, reason }: { onRestart: () => void, reason: string }) => (
  <motion.div 
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="max-w-2xl w-full text-center space-y-12 p-16 bg-[#151515]/95 backdrop-blur-3xl border-2 border-[#ef4444] rounded-3xl shadow-[0_0_100px_rgba(239,68,68,0.2)]"
  >
    <XCircle size={120} className="text-[#ef4444] mx-auto drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />

    <div className="space-y-6">
      <h2 className="text-6xl font-black text-[#ef4444] uppercase italic tracking-tighter">System Offline</h2>
      <p className="font-mono text-[#ef4444]/80 max-w-sm mx-auto leading-relaxed">
        {reason || "The system clock hit zero. The hacker has successfully deleted the graduation records."}
      </p>
    </div>

    <button 
      onClick={onRestart}
      className="flex items-center gap-3 mx-auto px-12 py-5 bg-[#ef4444] text-white font-black uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] group"
    >
      <RefreshCw size={24} className="group-hover:-rotate-180 transition-transform duration-500" /> System Reboot
    </button>
  </motion.div>
);

const TopNav = ({
  onHome,
  onLeaderboard,
  hockingProgramUrl,
  hockingVideoUrl
}: {
  onHome: () => void;
  onLeaderboard: () => void;
  hockingProgramUrl: string;
  hockingVideoUrl: string;
}) => (
  <div className="relative z-20 max-w-7xl mx-auto w-full px-6 pt-4">
    <nav className="flex flex-wrap items-center justify-between gap-3 bg-black/90 border border-[#22c55e]/30 rounded-lg px-4 py-3 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
      <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[#22c55e]">BLACKOUT RANKED INDEX</div>
      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black">
        <button onClick={onHome} className="px-3 py-2 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-all">Home</button>
        <button onClick={onLeaderboard} className="px-3 py-2 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-all">Leaderboard</button>
        <a href={hockingVideoUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-all">Video</a>
        <a href={hockingProgramUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-all">Hocking Cyber Program</a>
      </div>
    </nav>
  </div>
);

export default function App() {
  const hockingProgramUrl = 'https://www.hocking.edu/cybersecurity';
  const baseUrl = import.meta.env.BASE_URL;
  const hockingReelVideoUrl = `${baseUrl}media/hocking-cyber-reel.mp4`;
  const [stage, setStage] = useState<GameStage>('intro');
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");
  const [dbIntegrity, setDbIntegrity] = useState(100);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [operativeName, setOperativeName] = useState("");
  const [isGlitching, setIsGlitching] = useState(false);
  const [showEdu, setShowEdu] = useState(false);
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [stagePoints, setStagePoints] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, boolean>>({});
  const [osintHardGuess, setOsintHardGuess] = useState('');
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerGlitch = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 500);
  };

  const isMainUIActive = stage !== 'intro' && stage !== 'victory' && stage !== 'game-over';

  useEffect(() => {
    if (isMainUIActive) {
      const tauntInterval = setInterval(() => {
        if (Math.random() > 0.6) {
          const taunts = [
            "RIVER PHANTOM: 'I already rewrote your finals scores.'",
            "RIVER PHANTOM: 'Clock is ticking. Graduation list is almost gone.'",
            "RIVER PHANTOM: 'Your class chat leaks more than your firewall.'",
            "RIVER PHANTOM: 'Keep stalling and nobody walks at graduation.'",
            "RIVER PHANTOM: 'Nice defense... for last season.'",
            "RIVER PHANTOM: 'Passing records purge at 100 percent.'"
          ];
          addMessage(taunts[Math.floor(Math.random() * taunts.length)], 'error');
          triggerGlitch();
        }
      }, 15000);
      return () => clearInterval(tauntInterval);
    }
  }, [isMainUIActive]);

  useEffect(() => {
    const saved = localStorage.getItem('cyber-guard-leaderboard');
    if (saved) {
      try {
        setLeaderboardData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load leaderboard data", e);
      }
    }
  }, []);

  const saveLeaderboardEntry = (entry: LeaderboardEntry) => {
    const updated = [...leaderboardData, entry];
    localStorage.setItem('cyber-guard-leaderboard', JSON.stringify(updated));
    setLeaderboardData(updated);
  };

  const addMessage = (text: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, { text, type, timestamp }]);
  };

  const handleCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    addMessage(`> ${command}`, 'info');

    if (command === 'help') {
      addMessage("Available commands: HELP, SCAN, STATUS, HINT, DECODE, LEADERBOARD, WHOIS, TRACE", 'info');
      addMessage("HELP: List all available system commands.", 'info');
      addMessage("SCAN: Run deep network packet analysis.", 'info');
      addMessage("STATUS: Retrieve current mission telemetry.", 'info');
      addMessage("HINT: Request tactical intelligence for current stage.", 'info');
      addMessage("WHOIS [IP]: Perform lookup on suspicious source.", 'info');
      addMessage("TRACE [IP]: Attempt to track packet origin.", 'info');
    } else if (command === 'scan') {
      addMessage("Initializing deep packet inspection...", 'warning');
      setTimeout(() => addMessage("Tracing malicious IP hops...", 'warning'), 1000);
      setTimeout(() => {
        if (stage === 'network' && puzzleData) {
          addMessage(`ANOMALY DETECTED: Source ${puzzleData.network.suspiciousIp} showing high-frequency probe bursts.`, 'error');
          triggerGlitch();
        } else {
          addMessage("No active threats detected in current segment.", 'success');
        }
      }, 2000);
    } else if (command === 'status') {
      addMessage(`MISSION STAGE: ${stage.toUpperCase()}`, 'info');
      addMessage(`TIME REMAINING: ${timeLeft}s`, timeLeft < 60 ? 'error' : 'info');
      addMessage(`DB INTEGRITY: ${dbIntegrity}%`, dbIntegrity < 50 ? 'error' : 'success');
    } else if (command === 'hint') {
      provideHint();
    } else if (command === 'leaderboard') {
      if (leaderboardData.length === 0) {
        addMessage("No historical records found in database.", 'warning');
      } else {
        addMessage("Top performance records:", 'success');
        leaderboardData
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .forEach((entry, i) => {
            addMessage(`#${i+1} [${entry.name}] - SCORE: ${entry.score}`, 'info');
          });
      }
    } else if (command.startsWith('whois')) {
      const target = command.split(' ')[1];
      if (!target) {
        addMessage("Usage: WHOIS [IP_ADDRESS]", 'error');
      } else {
        addMessage(`Querying global WHOIS registries for ${target}...`, 'info');
        setTimeout(() => {
          if (puzzleData && target === puzzleData.network.suspiciousIp) {
            addMessage("ORG: Eastern Digital Assets [UNVERIFIED]", 'warning');
            addMessage("LOC: Unknown / Proxy Node", 'warning');
            addMessage("STATUS: Known malicious beacon", 'error');
            triggerGlitch();
          } else {
            addMessage("ORG: Generic ISP Cluster", 'info');
            addMessage("LOC: Global Content Network", 'info');
          }
        }, 1500);
      }
    } else if (command.startsWith('trace')) {
      const target = command.split(' ')[1];
      if (!target) {
        addMessage("Usage: TRACE [IP_ADDRESS]", 'error');
      } else {
        addMessage(`Tracing hops to ${target}...`, 'info');
        let hop = 1;
        const interval = setInterval(() => {
          addMessage(`HOP ${hop}: 10.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)} - Latency: ${2+hop}ms`, 'info');
          hop++;
          if (hop > 4) {
            clearInterval(interval);
            addMessage("Trace timed out at edge router.", 'error');
            addMessage("RIVER PHANTOM: 'You cannot trace what you cannot defend.'", 'error');
            triggerGlitch();
          }
        }, 400);
      }
    } else if (command === 'decode') {
      if (stage === 'cipher') {
        addMessage("Buffer: HVFDSH", 'info');
        addMessage("Frequency analysis: High delta at shift -3.", 'warning');
      } else {
        addMessage("No encrypted buffer found in current memory space.", 'error');
      }
    } else {
      addMessage(`Unknown command: ${command}. Type HELP for options.`, 'error');
    }
  };

  const provideHint = () => {
    if (activeQuestion && hintsUsedCount < 2) {
      addMessage(`INTEL REQUESTED: ${activeQuestion.hint}`, 'warning');
      setHintsUsedCount(prev => prev + 1);
      playSound('click');
      return;
    }

    const currentHints = STAGE_HINTS[stage];
    if (currentHints && hintsUsedCount < 2) {
      addMessage(`INTEL REQUESTED: ${currentHints[hintsUsedCount]}`, 'warning');
      setHintsUsedCount(prev => prev + 1);
      playSound('click');
    } else if (hintsUsedCount >= 2) {
      addMessage("Maximum hint requests exceeded for this sector.", 'error');
      playSound('error');
    } else {
      addMessage("Intel unavailable for current operational state.", 'error');
    }
  };

  const startGame = (name: string) => {
    const data = generatePuzzleData();
    setPuzzleData(data);
    setOperativeName(name.toUpperCase());
    setStage('board');
    setTimeLeft(900); // 15 minutes
    setDbIntegrity(100);
    setHints([]);
    setHintsUsedCount(0);
    setStagePoints(0);
    setActiveQuestion(null);
    setSelectedChoice(null);
    setCompletedQuestions({});
    setOsintHardGuess('');
    setMessages([{ text: "BLACKOUT RANKED boot sequence engaged...", type: 'info', timestamp: 'SYSTEM' }]);
    addMessage(`OPERATIVE IDENTIFIED: ${name.toUpperCase()}`, 'success');
    addMessage("ALERT: Rival faction RIVER PHANTOM breached South Gallia systems.", 'error');
    addMessage("OBJECTIVE: Defend attendance, grades, and senior clearance before lockout.", 'warning');
    addMessage("TACTICAL MODE: Choose any category and any difficulty.", 'info');
    addMessage("Complete all 15 challenge boxes to secure class records.", 'info');
    addMessage("Type 'HELP' in the system console for available sub-routines.", 'info');
    playSound('intro');
  };

  const restartGame = () => {
    setStage('intro');
    setOperativeName("");
    setTimeLeft(900);
    setDbIntegrity(100);
    setHints([]);
    setHintsUsedCount(0);
    setMessages([]);
    setStagePoints(0);
    setActiveQuestion(null);
    setSelectedChoice(null);
    setCompletedQuestions({});
    setOsintHardGuess('');
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    playSound('click');
  };

  const navigateHome = () => {
    setShowLeaderboard(false);
    setStage('intro');
    playSound('click');
  };

  const navigateLeaderboard = () => {
    setShowLeaderboard(true);
    setStage('intro');
    playSound('click');
  };

  const totalQuestions = Object.values(QUESTION_BANK).reduce((acc, list) => acc + list.length, 0);

  const selectQuestion = (question: QuestionItem) => {
    setActiveQuestion(question);
    setSelectedChoice(null);
    setOsintHardGuess('');
    setHintsUsedCount(0);
    setShowEdu(false);
    setStage(question.category);
    addMessage(`QUESTION_SELECTED: ${CATEGORY_LABELS[question.category]} // ${question.difficulty.toUpperCase()} (${question.points} PTS)`, 'info');
  };

  const completeQuestion = (question: QuestionItem) => {
    if (!completedQuestions[question.id]) {
      setStagePoints(prev => prev + question.points);
      setCompletedQuestions(prev => ({ ...prev, [question.id]: true }));
    }
    addMessage(`CORRECT: +${question.points} points awarded.`, 'success');
    playSound('correct');
    const solvedAfter = Object.keys(completedQuestions).length + (completedQuestions[question.id] ? 0 : 1);
    setActiveQuestion(null);
    setSelectedChoice(null);
    setOsintHardGuess('');
    setStage('board');
    if (solvedAfter >= totalQuestions) {
      setStage('victory');
      playSound('victory');
    }
  };

  const submitQuestionAnswer = () => {
    if (!activeQuestion || selectedChoice === null) return;

    if (selectedChoice === activeQuestion.answerIndex) {
      completeQuestion(activeQuestion);
      return;
    }

    const penalty = activeQuestion.difficulty === 'easy' ? 10 : activeQuestion.difficulty === 'medium' ? 25 : 40;
    handleStageFail('Incorrect answer. Defensive posture weakened.', penalty);
  };

  const submitOsintHardAnswer = () => {
    if (!activeQuestion || activeQuestion.id !== 'osint-hard') return;

    const guess = osintHardGuess.trim().toLowerCase();
    const expected = puzzleData?.osint.locationAnswer?.toLowerCase() || 'nelsonville';
    if (guess.includes(expected) || guess.includes('hocking')) {
      completeQuestion(activeQuestion);
      return;
    }

    handleStageFail('Reverse image geolocation mismatch. Re-check landmarks and search results.', 30);
  };

  useEffect(() => {
    if (PRACTICE_MODE) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    if (stage !== 'intro' && stage !== 'victory' && stage !== 'game-over') {
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStage('game-over');
            setGameOverReason("Time expired. River Phantom wiped passing records before year-end clearance.");
            return 0;
          }
          if (prev < 30 && prev % 2 === 0) {
            playSound('beeping');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [stage]);

  const handleStageSuccess = (nextStage: GameStage, message: string, hint: string | null = null) => {
    const completedStage = stage as string;
    if (STAGE_CONFIG[completedStage]) {
      setStagePoints(prev => prev + STAGE_CONFIG[completedStage].points);
    }
    if (hint) setHints(prev => [...prev, hint]);
    addMessage(message, 'success');
    playSound('correct');
    setHintsUsedCount(0);
    setStage(nextStage);
    if (nextStage === 'victory') playSound('victory');
  };

  const handleStageFail = (message: string, penalty: number = 30) => {
    addMessage(message, 'error');
    playSound('error');
    triggerGlitch();
    if (!PRACTICE_MODE) {
      setTimeLeft(prev => Math.max(0, prev - penalty));
      addMessage(`Time penalty: -${penalty}s applied.`, 'error');
    } else {
      addMessage('Practice mode active: no time penalty applied.', 'warning');
    }
    setDbIntegrity(prev => Math.max(0, prev - 15));
    addMessage(`Database integrity compromised.`, 'warning');
  };

  return (
    <div className={cn(
      "relative min-h-screen bg-[#050505] text-[#22c55e] flex flex-col font-mono selection:bg-[#22c55e] selection:text-black overflow-hidden border-4 border-[#1a1a1a] transition-all",
      isGlitching && "glitch-effect brightness-150 contrast-150 saturate-200"
    )}>
      <CRTEffects />
      <EducationalPanel stage={stage} isOpen={showEdu} onClose={() => setShowEdu(false)} />
      <LeaderboardTicker entries={leaderboardData} />
      <TopNav onHome={navigateHome} onLeaderboard={navigateLeaderboard} hockingProgramUrl={hockingProgramUrl} hockingVideoUrl={hockingReelVideoUrl} />
      <div className="flex-1 flex flex-col p-6 min-h-0">
      <MatrixBackground />



      {isMainUIActive ? (
        <div className="relative z-10 flex flex-col h-full gap-4 max-w-7xl mx-auto w-full flex-1 min-h-0">
          {/* Header */}
          <header className="flex justify-between items-center bg-black border-4 border-[#22c55e]/40 p-5 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.1)] crt-flicker">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 border-2 border-[#22c55e] flex items-center justify-center animate-pulse glow-border">
                <Cpu size={32} className="terminal-text" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic terminal-text">BLACKOUT RANKED // CLASS DEFENSE OPS</h1>
                <p className="text-[10px] text-[#22c55e]/60 uppercase tracking-[0.4em] font-bold">OPERATIVE: {operativeName || "GUEST"} // SCORE: {stagePoints}</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right hidden md:block">
                <p className="text-[8px] text-[#22c55e]/40 uppercase tracking-widest mb-1">SYSTEM_UPTIME</p>
                <p className="text-xs font-mono font-bold">45:12:09:02</p>
              </div>
              <TimerDisplay timeLeft={timeLeft} practiceMode={PRACTICE_MODE} />
            </div>
          </header>
          <GlobalProgressTracker currentStage={stage} />

          <div className="flex-1 grid grid-cols-12 gap-4 h-full overflow-hidden min-h-0">
            {/* Left Sidebar */}
            <aside className="col-span-3 flex flex-col gap-4 overflow-hidden">
              <MissionSummary stage={stage} hintsUsed={hintsUsedCount} integrity={dbIntegrity} />
              <div className="flex-1 min-h-0">
                <Terminal messages={messages} onCommand={handleCommand} />
              </div>
              <ProgressMap currentStage={stage} />
            </aside>

            {/* Stage Content */}
            <main className="col-span-6 bg-black border-4 border-[#22c55e]/40 rounded-lg relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.1)] crt-flicker">
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {stage === 'board' && (
                    <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <MissionBoard completed={completedQuestions} onSelect={selectQuestion} stagePoints={stagePoints} />
                    </motion.div>
                  )}

                  {activeQuestion && ['phishing', 'osint', 'network', 'cipher', 'final'].includes(stage) && (
                    <motion.div key={activeQuestion.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <QuestionStage
                        question={activeQuestion}
                        selectedChoice={selectedChoice}
                        onChoice={setSelectedChoice}
                        onSubmit={submitQuestionAnswer}
                        osintHardImageSrc={activeQuestion.id === 'osint-hard' ? puzzleData?.osint.locationImage : undefined}
                        osintHardGuess={osintHardGuess}
                        onOsintHardGuessChange={setOsintHardGuess}
                        onSubmitOsintHard={submitOsintHardAnswer}
                        onBack={() => {
                          setActiveQuestion(null);
                          setSelectedChoice(null);
                          setOsintHardGuess('');
                          setStage('board');
                        }}
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                        onEduToggle={() => setShowEdu(true)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Layout Footer Overlay for Stage hints */}
              <div className="p-5 border-t border-[#22c55e]/20 bg-black/40 backdrop-blur-md">
                <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                  <span className="text-[#22c55e] mr-2 font-black tracking-widest uppercase">Intel Brief:</span> 
                  {stage === 'board' && "RIVER PHANTOM is racing to delete year-end passing records. Pick your lanes and lock systems down."}
                  {activeQuestion && `Question active: ${activeQuestion.prompt}`}
                </p>
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="col-span-3 flex flex-col gap-4 overflow-hidden">
              <NetworkVitals integrity={dbIntegrity} />
              {activeQuestion ? <QuestionResourcesPanel question={activeQuestion} /> : <SolveLinksPanel stage={stage} />}
              <DecryptionRig hintsCount={hints.length} stage={stage} />
            </aside>
          </div>

          <footer className="mt-auto border-t border-[#22c55e]/20 pt-4 flex justify-between items-center text-[10px] opacity-40 uppercase tracking-[0.4em] font-mono">
            <span>Session: SCHOOL-IR-CENTRAL-09</span>
            <span>Firmware: v4.0.1 ALPHA (BUILD 822)</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
              <span>Data-link: Optimized</span>
            </div>
          </footer>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {stage === 'intro' && (
              <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center w-full max-w-7xl mx-auto h-full">
                {!showLeaderboard ? (
                  <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
                    <IntroStage 
                      onStart={startGame} 
                      onViewLeaderboard={() => {
                        setShowLeaderboard(true);
                        playSound('click');
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="leaderboard-view"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    tabIndex={0}
                    className="max-w-2xl w-full text-center space-y-8 p-12 bg-[#151515]/95 backdrop-blur-3xl border-2 border-[#22c55e] rounded-3xl shadow-[0_0_100px_rgba(34,197,94,0.2)]"
                  >
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black text-[#22c55e] uppercase italic tracking-tighter flex items-center justify-center gap-4">
                        <Activity size={32} /> Hall of Legends
                      </h2>
                      <p className="text-[10px] text-[#22c55e]/40 font-mono tracking-widest">ENCRYPTED DATABASE RECORD ACCESS ONLY</p>
                    </div>

                    <Leaderboard entries={leaderboardData} />

                    <button 
                      onClick={() => setShowLeaderboard(false)}
                      className="px-10 py-4 bg-[#22c55e]/10 border border-[#22c55e] text-[#22c55e] font-black uppercase text-xs tracking-widest hover:bg-[#22c55e] hover:text-black transition-all"
                    >
                      Return to Terminal
                    </button>
                  </motion.div>
                )}
              </div>
            )}
            {stage === 'victory' && (
              <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
                <VictoryScreen onRestart={restartGame} timeRemaining={timeLeft} dbIntegrity={dbIntegrity} operativeName={operativeName} onSaveLeaderboard={saveLeaderboardEntry} stagePoints={stagePoints} />
              </motion.div>
            )}
            {stage === 'game-over' && (
              <motion.div key="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex justify-center">
                <GameOverScreen onRestart={restartGame} reason={gameOverReason} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      </div>
    </div>
  );
}
