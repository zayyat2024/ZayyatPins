import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  Newspaper, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { ExamInfo, ExamType, ResultCheckParams, ResultResponse } from './types';
import { getStudyAdvice } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_EXAMS: ExamInfo[] = [
  {
    id: "waec",
    name: "WAEC",
    fullName: "West African Examinations Council",
    description: "The premier examination body in West Africa, providing quality and reliable educational assessment.",
    color: "blue",
    officialUrl: "https://www.waecdirect.org",
    pinPrice: 3600
  },
  {
    id: "neco",
    name: "NECO",
    fullName: "National Examinations Council",
    description: "Nigeria's national examination body for secondary school students.",
    color: "green",
    officialUrl: "https://result.neco.gov.ng",
    pinPrice: 2400
  },
  {
    id: "nabteb",
    name: "NABTEB",
    fullName: "National Business and Technical Examinations Board",
    description: "Focused on craft and technical level examinations in Nigeria.",
    color: "orange",
    officialUrl: "https://eworld.nabteb.gov.ng",
    pinPrice: 1000
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'checker' | 'buy' | 'prep' | 'docs'>('home');
  const [exams, setExams] = useState<ExamInfo[]>(DEFAULT_EXAMS);
  const [examsLoading, setExamsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [paystackKey, setPaystackKey] = useState<string>("");

  useEffect(() => {
    setExamsLoading(true);
    
    // Fetch config
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.paystackPublicKey) {
          setPaystackKey(data.paystackPublicKey);
        }
      })
      .catch(err => console.error("Failed to fetch config:", err));

    fetch('/api/exams/info')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setExams(data);
        }
        setExamsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch exams:", err);
        setExamsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => { setActiveTab('home'); setSelectedExam(null); }}
            >
              <div className="bg-emerald-600 p-2 rounded-lg">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-emerald-900">zayyatpins.com</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')}>Home</NavButton>
              <NavButton active={activeTab === 'checker'} onClick={() => setActiveTab('checker')}>Checker</NavButton>
              <NavButton active={activeTab === 'buy'} onClick={() => setActiveTab('buy')}>Buy Pins</NavButton>
              <NavButton active={activeTab === 'prep'} onClick={() => setActiveTab('prep')}>AI Prep</NavButton>
              <NavButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')}>API Docs</NavButton>
            </div>

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-neutral-200 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                <MobileNavButton active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }}>Home</MobileNavButton>
                <MobileNavButton active={activeTab === 'checker'} onClick={() => { setActiveTab('checker'); setIsMenuOpen(false); }}>Result Checker</MobileNavButton>
                <MobileNavButton active={activeTab === 'buy'} onClick={() => { setActiveTab('buy'); setIsMenuOpen(false); }}>Buy Pins</MobileNavButton>
                <MobileNavButton active={activeTab === 'prep'} onClick={() => { setActiveTab('prep'); setIsMenuOpen(false); }}>AI Study Prep</MobileNavButton>
                <MobileNavButton active={activeTab === 'docs'} onClick={() => { setActiveTab('docs'); setIsMenuOpen(false); }}>API Docs</MobileNavButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeSection key="home" exams={exams} onSelectExam={(id) => { setSelectedExam(id); setActiveTab('checker'); }} onBuyPin={(id) => { setSelectedExam(id); setActiveTab('buy'); }} loading={examsLoading} />}
          {activeTab === 'checker' && <CheckerSection key="checker" initialExam={selectedExam} exams={exams} />}
          {activeTab === 'buy' && <BuySection key="buy" initialExam={selectedExam} exams={exams} loading={examsLoading} paystackKey={paystackKey} />}
          {activeTab === 'prep' && <PrepSection key="prep" />}
          {activeTab === 'docs' && <DocsSection key="docs" />}
        </AnimatePresence>
      </main>

      <footer className="bg-neutral-900 text-neutral-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-emerald-500 w-6 h-6" />
                <span className="font-serif text-xl font-bold text-white">zayyatpins.com</span>
              </div>
              <p className="text-sm">Empowering Nigerian students with easy access to examination resources and AI-driven learning tools.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">WAEC Official Portal</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">NECO Official Portal</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">NABTEB Official Portal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <p className="text-sm mb-4">Need help with your results? Contact the respective examination body directly.</p>
              <div className="flex gap-4">
                {/* Social icons could go here */}
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-xs space-y-2">
            <p>© {new Date().getFullYear()} zayyatpins.com. Not affiliated with WAEC, NECO, or NABTEB.</p>
            <p className="text-neutral-500">Developed by Zayyat Ibrahim (+2347033807736)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-sm font-medium transition-colors relative py-2",
        active ? "text-emerald-600" : "text-neutral-600 hover:text-emerald-500"
      )}
    >
      {children}
      {active && (
        <motion.div 
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
        />
      )}
    </button>
  );
}

function MobileNavButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "block w-full text-left px-3 py-2 rounded-md text-base font-medium",
        active ? "bg-emerald-50 text-emerald-700" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      )}
    >
      {children}
    </button>
  );
}

function HomeSection({ exams, onSelectExam, onBuyPin, loading }: { exams: ExamInfo[], onSelectExam: (id: ExamType) => void, onBuyPin: (id: ExamType) => void, loading: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 leading-tight">
          Your Gateway to <span className="text-emerald-600">Academic Success</span>
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Buy WAEC, NECO, and NABTEB pins instantly. Check results and get AI-powered study assistance.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button 
            onClick={() => onSelectExam('waec')}
            className="bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            Check Results
          </button>
          <button 
            onClick={() => onBuyPin('waec')}
            className="bg-neutral-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-neutral-800 transition-all shadow-lg"
          >
            Buy Exam Pins
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <motion.div 
            key={exam.id}
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm flex flex-col h-full"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
              exam.id === 'waec' ? "bg-blue-100 text-blue-600" : 
              exam.id === 'neco' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
            )}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">{exam.name}</h3>
            <p className="text-neutral-500 text-sm mb-6 flex-grow">{exam.description}</p>
            <div className="space-y-3">
              <button 
                onClick={() => onSelectExam(exam.id)}
                className="w-full py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                Check Result <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onBuyPin(exam.id)}
                className="w-full py-2 rounded-lg border border-emerald-600 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                Buy {exam.name} Pin (₦{exam.pinPrice})
              </button>
            </div>
          </motion.div>
        ))}
      </section>
    )}
      {/* Rest of HomeSection... */}
    </motion.div>
  );
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

function BuySection({ initialExam, exams, loading: examsLoading, paystackKey }: { initialExam: ExamType | null, exams: ExamInfo[], loading: boolean, paystackKey: string }) {
  const [examType, setExamType] = useState<ExamType>(initialExam || (exams.length > 0 ? exams[0].id : 'waec'));
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [customPaystackKey, setCustomPaystackKey] = useState<string>("");
  const [naijaApiKey, setNaijaApiKey] = useState<string>("_lWUc2TxNWFwAT2e5cNZafb_CiGxcMEM0N2D-ToksoihXftgF_ey6Kvb2wmxXqGrWyaJyIPTN-29knjtdTOUmHtHGqTiCG3AsV2P_1771713315");
  const [naijaBaseUrl, setNaijaBaseUrl] = useState<string>("https://www.naijaresultpins.com/api/v1/exam-card/buy");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Update examType if initialExam changes or exams load
  useEffect(() => {
    if (initialExam) {
      setExamType(initialExam);
    } else if (exams.length > 0 && !examType) {
      setExamType(exams[0].id);
    }
  }, [initialExam, exams]);

  // Sync custom key with server key initially
  useEffect(() => {
    if (paystackKey && !customPaystackKey) {
      setCustomPaystackKey(paystackKey);
    }
  }, [paystackKey]);

  const selectedExamInfo = exams.find(e => e.id === examType);
  const totalAmount = (selectedExamInfo?.pinPrice || 0) * quantity;

  const handleVerify = async (reference: string) => {
    try {
      const verifyRes = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          examType,
          quantity,
          email,
          naijaApiKey,
          naijaBaseUrl
        })
      });
      const data = await verifyRes.json();
      if (verifyRes.ok) {
        setPurchaseResult(data);
      } else {
        setError(data.error || "Verification failed. Please contact support with reference: " + reference);
      }
    } catch (err) {
      setError("Connection error during verification. Reference: " + reference);
    } finally {
      setLoading(false);
    }
  };

  const checkBalance = async () => {
    setCheckingBalance(true);
    setError(null);
    try {
      const res = await fetch('/api/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naijaApiKey, naijaBaseUrl })
      });
      const data = await res.json();
      if (res.ok) {
        // Deep search for balance-like fields with priority
        const findBalance = (obj: any, depth = 0): string | null => {
          if (!obj || typeof obj !== 'object' || depth > 5) return null;
          
          const priorityKeys = [
            'wallet_balance', 'walletBalance', 'available_balance', 
            'availableBalance', 'user_balance', 'current_balance'
          ];
          const generalKeys = ['balance', 'wallet', 'amount'];
          
          // 1. Check current level for priority keys
          for (const key of priorityKeys) {
            if (obj[key] !== undefined && obj[key] !== null) return String(obj[key]);
          }
          
          // 2. Check current level for general keys
          for (const key of generalKeys) {
            if (key === 'amount' && (obj.total_amount !== undefined || obj.transaction_amount !== undefined)) continue;
            if (obj[key] !== undefined && obj[key] !== null) return String(obj[key]);
          }

          // 3. Recursively check ALL keys (handles cases like "0": { ... })
          for (const key in obj) {
            if (key === '_foundBalance') continue;
            const found = findBalance(obj[key], depth + 1);
            if (found) return found;
          }
          
          return null;
        };

        const foundBalance = findBalance(data);
        
        // Also find user name
        const findUser = (obj: any, depth = 0): string | null => {
          if (!obj || typeof obj !== 'object' || depth > 5) return null;
          const nameKeys = ['firstname', 'lastname', 'name', 'username', 'full_name'];
          
          let nameParts = [];
          if (obj.firstname) nameParts.push(obj.firstname);
          if (obj.lastname) nameParts.push(obj.lastname);
          if (nameParts.length > 0) return nameParts.join(' ');
          
          for (const key of nameKeys) {
            if (obj[key] && typeof obj[key] === 'string') return obj[key];
          }
          
          for (const key in obj) {
            const found = findUser(obj[key], depth + 1);
            if (found) return found;
          }
          return null;
        };

        const foundUser = findUser(data);
        setBalance({ ...data, _foundBalance: foundBalance, _foundUser: foundUser });
      } else {
        const errorMsg = data.error || data.message || "Unknown error";
        setError("Balance check failed: " + errorMsg);
        console.error("Balance check failed details:", data);
      }
    } catch (err) {
      setError("Connection error checking balance");
    } finally {
      setCheckingBalance(false);
    }
  };

  const handlePaystackPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (examsLoading) {
      setError("Please wait while exam data is loading...");
      return;
    }

    if (!selectedExamInfo) {
      setError("Please select a valid exam body");
      return;
    }

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!window.PaystackPop) {
      setError("Payment system is still loading. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);

    if (totalAmount <= 0) {
      setError("Invalid amount. Please select an exam and quantity.");
      setLoading(false);
      return;
    }

    const publicKey = customPaystackKey || paystackKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey || publicKey.includes("placeholder")) {
      setError("Paystack Public Key is missing or invalid. Please configure PAYSTACK_PUBLIC_KEY in your settings.");
      setLoading(false);
      return;
    }

    console.log("Initializing Paystack with key:", publicKey ? "User Key" : "Placeholder");
    console.log("Amount (kobo):", Math.round(totalAmount * 100));

    try {
      const handler = window.PaystackPop.setup({
        key: publicKey || "pk_test_placeholder",
        email: email,
        amount: Math.round(totalAmount * 100),
        currency: "NGN",
        ref: 'NRE_' + Math.floor((Math.random() * 1000000000) + 1),
        callback: function(response: any) {
          console.log("Payment successful, reference:", response.reference);
          handleVerify(response.reference);
        },
        onClose: function() {
          setLoading(false);
          setError("Payment window closed");
        }
      });

      handler.openIframe();
    } catch (err: any) {
      setLoading(false);
      setError("Could not initialize payment: " + err.message);
    }
  };

  if (examsLoading && exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading exam data...</p>
      </div>
    );
  }

  if (purchaseResult) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Purchase Successful!</h2>
            <p className="text-neutral-500">Transaction ID: {purchaseResult.transactionId}</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold border-b pb-2">Your Pins</h3>
            {purchaseResult.pins.map((p: any, i: number) => (
              <div key={i} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-bold">{p.examType} PIN</p>
                  <p className="font-mono text-lg font-bold">{p.pin}</p>
                  {p.serial && <p className="text-xs text-neutral-500">Serial: {p.serial}</p>}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(p.pin);
                    // Could add a toast here
                  }}
                  className="text-emerald-600 text-xs font-bold hover:underline"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setPurchaseResult(null)}
            className="w-full mt-8 bg-neutral-900 text-white py-3 rounded-xl font-bold"
          >
            Buy More
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold">Buy Exam Pins</h2>
        <p className="text-neutral-500">Get your WAEC, NECO, or NABTEB pins instantly via email.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <form onSubmit={handlePaystackPayment} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Select Exam Body</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white font-semibold"
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
            >
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.name.toUpperCase()} - ₦{exam.pinPrice.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Quantity</label>
              <input 
                type="number" 
                min="1" 
                max="10"
                className="w-full px-4 py-2 rounded-xl border border-neutral-200"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Price Per Unit</label>
              <div className="px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-200 font-bold">
                ₦{selectedExamInfo?.pinPrice.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Paystack Public Key (Optional Override)</label>
            <input 
              type="password" 
              placeholder="pk_test_..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200"
              value={customPaystackKey}
              onChange={(e) => setCustomPaystackKey(e.target.value)}
            />
            <p className="text-[10px] text-neutral-400">Defaulting to system key if available.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Naija Pins API Key (Optional Override)</label>
            <input 
              type="password" 
              placeholder="jsVRSp..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200"
              value={naijaApiKey}
              onChange={(e) => setNaijaApiKey(e.target.value)}
            />
            <p className="text-[10px] text-neutral-400">Defaulting to system key if available.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Naija Pins API Base URL</label>
            <input 
              type="text" 
              placeholder="https://www.naijaresultpins.com/api/v1/exam-card/buy"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-xs"
              value={naijaBaseUrl}
              onChange={(e) => setNaijaBaseUrl(e.target.value)}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-neutral-400">The endpoint for PIN purchases.</p>
              <button 
                type="button"
                onClick={checkBalance}
                disabled={checkingBalance}
                className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
              >
                {checkingBalance ? <Loader2 className="w-2 h-2 animate-spin" /> : <RefreshCw className="w-2 h-2" />}
                Check API Balance
              </button>
            </div>
            {balance && (
              <div className="mt-2 p-2 bg-neutral-50 rounded border border-neutral-100 text-[10px]">
                <p className="font-bold text-neutral-700">
                  Wallet Balance: ₦{balance._foundBalance || "0"}
                </p>
                <p className="text-neutral-500">User: {balance._foundUser || "Connected"}</p>
                <div className="mt-2 pt-2 border-t border-neutral-200/50">
                  <details className="group">
                    <summary className="text-[7px] text-neutral-400 cursor-pointer hover:text-neutral-600 flex items-center gap-1">
                      <ChevronRight className="w-2 h-2 group-open:rotate-90 transition-transform" />
                      View Debug Info (Raw API Response)
                    </summary>
                    <div className="mt-1 relative">
                      <pre className="text-[6px] bg-neutral-100 p-2 rounded overflow-auto max-h-32 font-mono">
                        {JSON.stringify(balance, null, 2)}
                      </pre>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(balance, null, 2));
                          alert("Debug info copied to clipboard!");
                        }}
                        className="absolute top-1 right-1 bg-white/80 px-1 py-0.5 rounded text-[6px] border border-neutral-200 hover:bg-white"
                      >
                        Copy
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-emerald-800">Total Amount</span>
            <span className="text-xl font-bold text-emerald-900">₦{totalAmount.toLocaleString()}</span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay with Paystack (₦${totalAmount.toLocaleString()})`}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function DocsSection() {
  const apiDocs = `
# Developer API Documentation

Integrate zayyatpins.com services into your own application. We provide endpoints for result checking and PIN vending.

## 1. Top Nigerian API Providers
For production use, we recommend these reliable providers for Exam Pins:

- **VTpass API**: [vtpass.com/documentation](https://www.vtpass.com/documentation)
- **ClubKonnect API**: [clubkonnect.com/api](https://www.clubkonnect.com/api)
- **Monnify (Aggregators)**: [monnify.com](https://monnify.com)

## 2. Our Internal API (Demo)

### GET /api/exams/info
Returns current prices and metadata for all supported exam bodies.

### POST /api/purchase-pins
Purchase exam pins programmatically.

**Request Body:**
\`\`\`json
{
  "examType": "waec",
  "quantity": 1,
  "email": "dev@example.com"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "transactionId": "TXN_123456",
  "pins": [
    { "pin": "123456789012", "serial": "WRC12345", "examType": "waec" }
  ]
}
\`\`\`

### POST /api/check-result
Check results for a candidate.

**Request Body:**
\`\`\`json
{
  "examType": "waec",
  "examNumber": "4123456789",
  "examYear": "2024",
  "pin": "1234567890",
  "serial": "WRC12345"
}
\`\`\`
  `;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-sm prose prose-emerald max-w-none">
        <Markdown>{apiDocs}</Markdown>
      </div>
    </motion.div>
  );
}

function CheckerSection({ initialExam, exams }: { initialExam: ExamType | null, exams: ExamInfo[] }) {
  const [examType, setExamType] = useState<ExamType>(initialExam || 'waec');
  const [formData, setFormData] = useState({
    examNumber: '',
    examYear: '2024',
    pin: '',
    serial: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/check-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, examType })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        <button 
          onClick={() => setResult(null)}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Checker
        </button>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden">
          <div className="bg-emerald-600 p-8 text-white text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Result Successfully Retrieved</h2>
            <p className="opacity-90">{examType.toUpperCase()} {result.candidate.examYear} Examination</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-neutral-100">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Candidate Name</p>
                <p className="font-bold text-lg">{result.candidate.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Examination Number</p>
                <p className="font-bold text-lg">{result.candidate.examNumber}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">School / Center</p>
                <p className="font-medium">{result.candidate.school}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Subject Grades
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.results.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-sm font-medium text-neutral-700">{item.subject}</span>
                    <span className={cn(
                      "font-bold px-3 py-1 rounded-lg text-sm",
                      item.grade.startsWith('A') || item.grade.startsWith('B') || item.grade.startsWith('C') 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {item.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-center gap-4">
              <button className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-neutral-800 transition-colors">
                Print Result
              </button>
              <button className="border border-neutral-200 px-6 py-2 rounded-lg font-semibold hover:bg-neutral-50 transition-colors">
                Download PDF
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-neutral-400 italic">
          Disclaimer: This is a simulated result for demonstration purposes. Please use official portals for valid certification.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold mb-2">Result Checker</h2>
        <p className="text-neutral-500">Enter your details below to retrieve your examination results.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex gap-2 mb-8 p-1 bg-neutral-100 rounded-xl">
          {['waec', 'neco', 'nabteb'].map((type) => (
            <button
              key={type}
              onClick={() => setExamType(type as ExamType)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                examType === type ? "bg-white text-emerald-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Examination Number</label>
              <input 
                required
                type="text" 
                placeholder="e.g. 4123456789"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.examNumber}
                onChange={(e) => setFormData({...formData, examNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700">Examination Year</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={formData.examYear}
                onChange={(e) => setFormData({...formData, examYear: e.target.value})}
              >
                {[2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Scratch Card PIN</label>
            <input 
              required
              type="password" 
              placeholder="Enter your 10 or 12 digit PIN"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={formData.pin}
              onChange={(e) => setFormData({...formData, pin: e.target.value})}
            />
            <p className="text-[10px] text-neutral-400">Tip: Use "1234567890" for a successful demo check.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Serial Number</label>
            <input 
              required
              type="text" 
              placeholder="e.g. WRC123456789"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={formData.serial}
              onChange={(e) => setFormData({...formData, serial: e.target.value})}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Check Result"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function PrepSection() {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);

  const handleGetAdvice = async () => {
    if (!subject || !topic) return;
    setLoading(true);
    try {
      const text = await getStudyAdvice(subject, topic);
      setAdvice(text || "No advice found.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-bold">
          <Sparkles className="w-4 h-4" /> AI Study Assistant
        </div>
        <h2 className="text-4xl font-serif font-bold">Master Your Exams</h2>
        <p className="text-neutral-600 max-w-xl mx-auto">Tell us what you're studying, and our AI will generate a personalized study guide for your WAEC/NECO exams.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Subject</label>
            <input 
              type="text" 
              placeholder="e.g. Mathematics, Physics, Economics"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700">Specific Topic</label>
            <input 
              type="text" 
              placeholder="e.g. Calculus, Wave Motion, Demand and Supply"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={handleGetAdvice}
          disabled={loading || !subject || !topic}
          className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Study Guide"}
        </button>
      </div>

      {advice && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm"
        >
          <div className="prose prose-emerald max-w-none">
            <Markdown>{advice}</Markdown>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function NewsSection() {
  const news = [
    {
      title: "WAEC 2024 Results Released",
      date: "Feb 15, 2024",
      category: "WAEC",
      summary: "The West African Examinations Council has officially released the results for the 2024 WASSCE. Candidates can now check their results online."
    },
    {
      title: "NECO Registration Deadline Extended",
      date: "Feb 10, 2024",
      category: "NECO",
      summary: "The National Examinations Council has announced a two-week extension for the registration of the 2024 Senior School Certificate Examination."
    },
    {
      title: "NABTEB Introduces New Technical Subjects",
      date: "Jan 28, 2024",
      category: "NABTEB",
      summary: "In a bid to align with global trends, NABTEB has introduced new subjects in Renewable Energy and Data Science for the upcoming exams."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold">Latest Updates</h2>
          <p className="text-neutral-500">Stay informed about exam dates, deadlines, and news.</p>
        </div>
        <button className="text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
          View all news <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-neutral-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                {item.category}
              </span>
              <span className="text-xs text-neutral-400">{item.date}</span>
            </div>
            <h3 className="font-bold text-lg mb-2 leading-tight">{item.title}</h3>
            <p className="text-neutral-500 text-sm mb-4 line-clamp-3">{item.summary}</p>
            <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Read more</button>
          </div>
        ))}
      </div>

      <div className="bg-neutral-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <Newspaper className="w-8 h-8 text-neutral-900" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Subscribe to Exam Alerts</h4>
            <p className="text-neutral-500 text-sm">Get instant notifications about your exam results and deadlines.</p>
          </div>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="flex-grow md:w-64 px-4 py-3 rounded-xl border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            Join
          </button>
        </div>
      </div>
    </motion.div>
  );
}
