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
      <d
