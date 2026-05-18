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
type GameStage = 'intro' | 'phishing' | 'osint' | 'network' | 'cipher' | 'final' | 'victory' | 'game-over';

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
    <div className="crt-scanline" />
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

const TimerDisplay = ({ timeLeft }: { timeLeft: number }) => {
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
    <div className="flex animate-marquee hover:pause min-w-full">
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

const IntroStage = ({ onStart, onViewLeaderboard }: { onStart: (name: string) => void, onViewLeaderboard: () => void }) => {
  const [name, setName] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPrompt(true), 1500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl w-full text-center space-y-12 p-12 bg-black border-4 border-[#22c55e]/30 rounded-lg shadow-[0_0_100px_rgba(34,197,94,0.05)] relative overflow-hidden font-mono crt-flicker"
    >
      <div className="absolute top-4 left-4 flex gap-2 opacity-50 terminal-text">
        <Monitor size={14} className="text-[#22c55e]" />
        <span className="text-[10px] uppercase font-black tracking-widest">WOPR TERMINAL // [NORAD-LOG-83]</span>
      </div>

      <div className="space-y-8 pt-8">
        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl font-black text-[#22c55e] tracking-tighter uppercase italic terminal-text"
          >
            WAR-REBEL
          </motion.h1>
          <div className="h-1 shadow-glow bg-[#22c55e]/50 w-64 mx-auto" />
          <p className="text-xs text-[#22c55e]/60 font-black tracking-[0.8em] uppercase terminal-text">Global Defense Simulation</p>
        </div>
        
        <AnimatePresence>
          {showPrompt && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#22c55e] text-2xl font-black tracking-widest terminal-text animate-pulse py-4"
            >
              SHALL WE PLAY A GAME?
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-8 max-w-sm mx-auto w-full pt-4">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-[#22c55e]/80 uppercase tracking-widest text-center terminal-text">AUTHORIZED ACCESS ONLY</p>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-[#22c55e] opacity-20 blur group-focus-within:opacity-40 transition-all"></div>
            <input 
              type="text"
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && onStart(name)}
              placeholder="LOGON ID"
              className="relative w-full bg-black border-2 border-[#22c55e]/40 px-6 py-5 text-[#22c55e] font-mono outline-none focus:border-[#22c55e] focus:bg-[#22c55e]/10 uppercase text-xl transition-all tracking-[0.4em] text-center"
            />
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
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: PHS01</span>
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
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: OSN02</span>
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
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: CRY04</span>
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
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FLAG: NET03</span>
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
        <span className="text-[10px] py-0.5 px-2 bg-[#22c55e] text-black font-black rounded uppercase tracking-tighter">FINAL STAGE</span>
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

const VictoryScreen = ({ onRestart, timeRemaining, dbIntegrity, operativeName, onSaveLeaderboard }: { onRestart: () => void, timeRemaining: number, dbIntegrity: number, operativeName: string, onSaveLeaderboard: (entry: LeaderboardEntry) => void }) => {
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const hockingProgramUrl = 'https://www.hocking.edu/cybersecurity';
  const hockingReelVideoUrl = '/media/hocking-cyber-reel.mp4';
  const hockingReelDirectUrl = 'https://www.facebook.com/reel/965681956111870/';
  const hockingYouTubeChannelUrl = 'https://www.youtube.com/c/HockingCollege-Ohio';
  const nclUrl = 'https://nationalcyberleague.org';

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

  const totalScore = Math.floor((timeRemaining * 10) + (dbIntegrity * 50));

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
      </div>

      <div className="grid grid-cols-2 gap-8 py-8 border-y border-[#00FF41]/20 max-w-lg mx-auto">
        <div className="space-y-1">
          <div className="text-[10px] uppercase text-[#00FF41]/40 tracking-[0.3em] font-black">Temporal Surplus</div>
          <div className="text-3xl font-black text-[#00FF41]">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] uppercase text-[#00FF41]/40 tracking-[0.3em] font-black">Combat Efficiency</div>
          <div className="text-3xl font-black text-[#00FF41]">{totalScore}</div>
        </div>
      </div>

      <div className={cn("mx-auto space-y-6", submitted ? "max-w-5xl w-full" : "max-w-md")}>
        {!submitted ? (
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-[#00FF41] text-black font-black uppercase tracking-[0.4em] hover:bg-white transition-all text-sm shadow-[0_0_30px_#00FF41]"
          >
            Archive to NORAD TAPE
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
                    className="w-full max-w-[380px] mx-auto rounded"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-[10px] text-[#e5e7eb]/70 leading-relaxed">
                  If video playback is blocked, use an external source below.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={hockingReelDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 border border-[#00FF41]/60 text-[#00FF41] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#00FF41] hover:text-black transition-all"
                  >
                    Open Reel on Facebook
                  </a>
                  <a
                    href={hockingYouTubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 border border-[#00FF41]/60 text-[#00FF41] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#00FF41] hover:text-black transition-all"
                  >
                    Open Hocking YouTube
                  </a>
                </div>
              </div>

              <div className="text-left p-5 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded space-y-3">
                <h3 className="text-xs text-[#00FF41] font-black tracking-[0.2em] uppercase">Hocking + NCL Facts</h3>
                <ul className="space-y-2 text-[11px] text-[#e5e7eb]/85 leading-relaxed">
                  <li>Hocking College's Cybersecurity and Network Systems program emphasizes hands-on labs in network defense, traffic analysis, and secure system operations.</li>
                  <li>Hocking students placed in the <span className="text-white font-bold">top 10% nationally</span> in Autumn 2025 and <span className="text-white font-bold">top 8% nationally</span> in Spring 2026 in National Cyber League competition.</li>
                  <li>Students are equipped to contribute in industry after their first semester while continuing to deepen skills through advanced labs and competitions.</li>
                  <li>Learners can prepare for <span className="text-white font-bold">A+</span>, <span className="text-white font-bold">Net+</span>, <span className="text-white font-bold">Sec+</span>, <span className="text-white font-bold">PCEP</span>, and emerging <span className="text-white font-bold">AI credentials</span>.</li>
                  <li>From the beginning, students build a professional skills profile and project evidence they can present to employers when they are workforce-ready.</li>
                  <li>Typical cybersecurity salaries in Ohio often range from <span className="text-white font-bold">$70,000 to $110,000+</span>, depending on role, certifications, and experience.</li>
                  <li>The National Cyber League (NCL) is a major U.S. collegiate cybersecurity competition where students build practical skills in forensics, OSINT, web app security, and incident response.</li>
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
                  <a
                    href={nclUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 border border-[#00FF41]/60 text-[#00FF41] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#00FF41] hover:text-black transition-all"
                  >
                    Explore NCL
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

export default function App() {
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
            "PHANTOM: 'You are analyzing old data, Operative.'",
            "PHANTOM: 'The firewall is melting.'",
            "PHANTOM: 'Do you really think Sparky is the only secret?'",
            "PHANTOM: 'Your latency is growing...'",
            "PHANTOM: 'I see your keystrokes.'",
            "PHANTOM: 'Accessing Student Records... 78% complete.'"
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
            addMessage("PHANTOM: 'You can't trace what you can't see, Analyst.'", 'error');
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
    setStage('phishing');
    setTimeLeft(900); // 15 minutes
    setDbIntegrity(100);
    setHints([]);
    setHintsUsedCount(0);
    setMessages([{ text: "Initializing defensive protocols...", type: 'info', timestamp: 'SYSTEM' }]);
    addMessage(`OPERATIVE IDENTIFIED: ${name.toUpperCase()}`, 'success');
    addMessage("Analyzing network traffic...", 'warning');
    addMessage("Alert: Massive Phishing attack detected.", 'error');
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
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    playSound('click');
  };

  useEffect(() => {
    if (stage !== 'intro' && stage !== 'victory' && stage !== 'game-over') {
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStage('game-over');
            setGameOverReason("Time expired. System compromise complete.");
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
    setTimeLeft(prev => Math.max(0, prev - penalty));
    setDbIntegrity(prev => Math.max(0, prev - 15));
    addMessage(`Time penalty: -${penalty}s applied.`, 'error');
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
      <div className="flex-1 flex flex-col p-6 min-h-0">
      <MatrixBackground />

      {/* Retro Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02))', backgroundSize: '100% 4px, 3px 100%' }}>
      </div>

      {isMainUIActive ? (
        <div className="relative z-10 flex flex-col h-full gap-4 max-w-7xl mx-auto w-full flex-1 min-h-0">
          {/* Header */}
          <header className="flex justify-between items-center bg-black border-4 border-[#22c55e]/40 p-5 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.1)] crt-flicker">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 border-2 border-[#22c55e] flex items-center justify-center animate-pulse glow-border">
                <Cpu size={32} className="terminal-text" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase italic terminal-text">NORAD_COMMAND // DEFCON_SIM</h1>
                <p className="text-[10px] text-[#22c55e]/60 uppercase tracking-[0.4em] font-bold">OPERATIVE: {operativeName || "GUEST"} // SECURE_LINE_01</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right hidden md:block">
                <p className="text-[8px] text-[#22c55e]/40 uppercase tracking-widest mb-1">SYSTEM_UPTIME</p>
                <p className="text-xs font-mono font-bold">45:12:09:02</p>
              </div>
              <TimerDisplay timeLeft={timeLeft} />
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
                  {stage === 'phishing' && puzzleData && (
                    <motion.div key="phishing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <PhishingStage 
                        data={puzzleData.phishing}
                        onSuccess={() => handleStageSuccess('osint', "Traffic filter applied. Origin identified.", "PHS01")} 
                        onFail={(msg, penalty) => handleStageFail(msg, penalty)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                        onEduToggle={() => setShowEdu(true)}
                      />
                    </motion.div>
                  )}

                  {stage === 'osint' && puzzleData && (
                    <motion.div key="osint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <OSINTStage 
                        data={puzzleData.osint}
                        onSuccess={() => handleStageSuccess('network', "Attacker profile compromised. Local data recovered.", "OSN02")} 
                        onFail={(msg) => handleStageFail(msg)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                        onEduToggle={() => setShowEdu(true)}
                      />
                    </motion.div>
                  )}

                  {stage === 'network' && puzzleData && (
                    <motion.div key="network" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <NetworkStage 
                        data={puzzleData.network}
                        onSuccess={() => handleStageSuccess('cipher', "Command hub isolated. Intercepting encrypted streams...", "NET03")} 
                        onFail={(msg) => handleStageFail(msg)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                        onEduToggle={() => setShowEdu(true)}
                      />
                    </motion.div>
                  )}

                  {stage === 'cipher' && puzzleData && (
                    <motion.div key="cipher" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <CipherStage 
                        data={puzzleData.cipher}
                        onSuccess={() => handleStageSuccess('final', "Encrypted protocols bypassed. Override window open.", "CRY04")} 
                        onFail={(msg) => handleStageFail(msg)} 
                        onHint={provideHint}
                        hintsUsed={hintsUsedCount}
                        onEduToggle={() => setShowEdu(true)}
                      />
                    </motion.div>
                  )}

                  {stage === 'final' && puzzleData && (
                    <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <FinalStage 
                        data={puzzleData.finalCode}
                        hints={hints}
                        onSuccess={() => setStage('victory')} 
                        onFail={(msg, penalty) => handleStageFail(msg, penalty)} 
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
                  {stage === 'phishing' && "Review the 'From' domain suffix. Open 'CYBER INTEL' for packet analysis basics."}
                  {stage === 'osint' && "Cross-reference target profile posts. Open 'CYBER INTEL' to learn about OSINT profiling."}
                  {stage === 'network' && "Identify the external WAN source. Open 'CYBER INTEL' for network defense training."}
                  {stage === 'cipher' && "Analyze the intercepted block. Open 'CYBER INTEL' to understand ROT13 rotation."}
                  {stage === 'final' && "Concatenate fragments. Open 'CYBER INTEL' to review 'Defense in Depth' principles."}
                </p>
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="col-span-3 flex flex-col gap-4 overflow-hidden">
              <NetworkVitals integrity={dbIntegrity} />
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
                <VictoryScreen onRestart={restartGame} timeRemaining={timeLeft} dbIntegrity={dbIntegrity} operativeName={operativeName} onSaveLeaderboard={saveLeaderboardEntry} />
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
