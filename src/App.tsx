import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  Home,
  LayoutDashboard,
  LockKeyhole,
  Medal,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Send,
  Settings2,
  Shield,
  Sparkles,
  Square,
  Star,
  Target,
  Timer,
  Trash2,
  Trophy,
  UserRound,
  Users,
  Video,
  Volume2,
  X,
  Zap,
  KeyRound,
  Mail,
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocalDb, type Campus, type Workout, type Challenge, type Profile, type Log, type ChatMessage } from './lib/localStorageDb';

type Tab = 'home' | 'workouts' | 'leaderboard' | 'chat' | 'profile' | 'admin';

const navigation: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'leaderboard', label: 'Rankings', icon: Trophy },
  { id: 'chat', label: 'Campus chat', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * Universal Data API Request handler
 * Direct LocalDb handler to ensure 100% offline & local functionality without server fetch errors.
 */
async function request<T = any>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const cleanPath = path.split('?')[0];
  const method = (options.method || 'GET').toUpperCase();
  const bodyData = options.body ? JSON.parse(options.body as string) : {};

  if (cleanPath === 'campuses') {
    if (method === 'POST') return LocalDb.addCampus(bodyData.name, bodyData.location) as unknown as T;
    if (method === 'DELETE') return LocalDb.deleteCampus(bodyData.id) as unknown as T;
    return LocalDb.getCampuses() as unknown as T;
  }

  if (cleanPath === 'workouts') {
    if (method === 'POST') return LocalDb.addWorkout(bodyData) as unknown as T;
    if (method === 'DELETE') return LocalDb.deleteWorkout(bodyData.id) as unknown as T;
    return LocalDb.getWorkouts() as unknown as T;
  }

  if (cleanPath === 'challenges') {
    if (method === 'POST') return LocalDb.addChallenge(bodyData) as unknown as T;
    if (method === 'DELETE') return LocalDb.deleteChallenge(bodyData.id) as unknown as T;
    return LocalDb.getChallenges() as unknown as T;
  }

  if (cleanPath === 'profiles') {
    if (method === 'POST' || method === 'PUT') {
      const userId = token || 'demo_user_active';
      return LocalDb.saveProfile(userId, bodyData.display_name, Number(bodyData.campus_id)) as unknown as T;
    }
    return LocalDb.getProfiles() as unknown as T;
  }

  if (cleanPath === 'activity') {
    const userId = token || 'demo_user_active';
    if (method === 'POST') {
      const xp = bodyData.type === 'workout' ? 50 : 30;
      return LocalDb.addLog(userId, bodyData.type, bodyData.workout_id || null, bodyData.steps || 0, xp) as unknown as T;
    }
    return LocalDb.getLogs(userId) as unknown as T;
  }

  if (cleanPath === 'messages') {
    if (method === 'POST') {
      const userId = token || 'demo_user_active';
      const userProfile = LocalDb.getProfileByUserId(userId) || LocalDb.getProfiles()[0];
      return LocalDb.addMessage(userId, userProfile?.display_name || 'Student', userProfile?.campus_id || 1, bodyData.body) as unknown as T;
    }
    if (method === 'DELETE') {
      LocalDb.deleteMessage(bodyData.id);
      return { success: true } as unknown as T;
    }
    const params = new URLSearchParams(path.split('?')[1] || '');
    const cid = params.get('campus_id');
    return LocalDb.getMessages(cid ? Number(cid) : undefined) as unknown as T;
  }

  return [] as unknown as T;
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark">
        <Activity size={21} strokeWidth={3} />
      </span>
      <span>
        FIT<span className="brand-accent">CAMPUS</span>
        <i>.</i>
      </span>
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [message, onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="toast">
      <span className="toast-icon">
        <Check size={16} />
      </span>
      {message}
      <button onClick={onClose} aria-label="Dismiss">
        <X size={16} />
      </button>
    </motion.div>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const slides = [
    {
      eyebrow: 'MOVE DIFFERENT',
      title: (
        <>
          Your campus.<br />
          <em>Your comeback.</em>
        </>
      ),
      copy: 'The fitness space made for student life. Move more, feel better, and make every day count.',
      icon: <Zap size={38} />,
      number: '01',
    },
    {
      eyebrow: 'FIND YOUR PEOPLE',
      title: (
        <>
          Better together.<br />
          <em>Stronger every day.</em>
        </>
      ),
      copy: 'Take on challenges, climb your campus leaderboard, and cheer each other on.',
      icon: <Users size={38} />,
      number: '02',
    },
    {
      eyebrow: 'MAKE IT YOURS',
      title: (
        <>
          Small steps.<br />
          <em>Big energy.</em>
        </>
      ),
      copy: 'Log workouts, track your steps, and turn your effort into XP worth celebrating.',
      icon: <Trophy size={38} />,
      number: '03',
    },
  ];
  const s = slides[page];
  return (
    <div className="intro-shell">
      <div className="intro-nav">
        <Brand light />
        <button className="intro-skip" onClick={onDone}>
          Skip intro <ArrowRight size={16} />
        </button>
      </div>
      <div className="intro-grid">
        <div className="intro-copy" key={page}>
          <span className="eyebrow light">
            <span className="eyebrow-line" />
            {s.eyebrow}
          </span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {s.title}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            {s.copy}
          </motion.p>
          <div className="intro-controls">
            <button className="primary-btn intro-next" onClick={() => (page === 2 ? onDone() : setPage(page + 1))}>
              {page === 2 ? 'Get started' : 'Explore the app'} <ArrowRight size={19} />
            </button>
            <div className="intro-dots">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setPage(i)} className={i === page ? 'active' : ''} aria-label={`Go to slide ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="intro-art">
          <div className="intro-orb orb-one" />
          <div className="intro-orb orb-two" />
          <div className="intro-floating float-one">
            <Flame size={18} /> +120 XP <span>today</span>
          </div>
          <div className="intro-big-circle">
            <div className="intro-icon">{s.icon}</div>
            <span className="intro-art-word">
              MOVE<br />
              MORE<span>.</span>
            </span>
          </div>
          <div className="intro-floating float-two">
            <span className="mini-avatar">FC</span> You got this! <Sparkles size={17} />
          </div>
          <span className="intro-number">{s.number} / 03</span>
        </div>
      </div>
      <div className="intro-bottom">
        BUILT FOR THE WAY STUDENTS MOVE <span>✳</span> CAMPUS LIFE, LEVELLED UP
      </div>
    </div>
  );
}

function AuthScreen({ campuses }: { campuses: Campus[] }) {
  const { signUp: authSignUp, signInWithPassword, signInWithGoogleAuth, sendForgotPasswordCode, resetPasswordWithCode } = useAuth();
  const [signUp, setSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCodeInput, setForgotCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (signUp) {
        await authSignUp(email, password);
        setSuccessMsg('Account created successfully! Welcome to FIT CAMPUS.');
      } else {
        await signInWithPassword(email, password);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotMsg('');
    if (!forgotEmail.includes('@')) {
      setForgotMsg('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await sendForgotPasswordCode(forgotEmail);
      setGeneratedCode(res.code);
      setForgotStep(2);
      setForgotMsg(`Verification code sent to ${forgotEmail}! (Demo Code: ${res.code})`);
    } catch (err) {
      setForgotMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotMsg('');
    if (newPasswordInput.length < 6) {
      setForgotMsg('New password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await resetPasswordWithCode(forgotEmail, forgotCodeInput, newPasswordInput);
      setShowForgotModal(false);
      setSuccessMsg('Password reset successful! You are now logged in.');
    } catch (err) {
      setForgotMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@fitcampus.app');
    setPassword('password123');
    setBusy(true);
    try {
      await signInWithPassword('demo@fitcampus.app', 'password123');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Brand light />
        <div className="auth-visual-content">
          <span className="eyebrow light">THE CAMPUS FITNESS CLUB</span>
          <h1>
            Good energy<br />
            looks good<br />
            <em>on you.</em>
          </h1>
          <p>Find your rhythm. Fuel your goals. Do it together.</p>
          <div className="auth-proof">
            <div className="avatar-stack">
              <b>JL</b>
              <b>AM</b>
              <b>SK</b>
            </div>
            <span>Join the movement on campus</span>
          </div>
        </div>
        <div className="visual-doodle">
          <Activity size={145} strokeWidth={1} />
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-card">
          <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>
          <h2>{signUp ? 'Join the movement.' : 'Welcome back.'}</h2>
          <p>{signUp ? 'A stronger you is one sign-up away.' : 'Pick up right where you left off.'}</p>

          <form onSubmit={submit}>
            <label>
              Email address
              <input type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Password</span>
                {!signUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep(1);
                      setForgotMsg('');
                      setShowForgotModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: '#F43F5E', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </label>

            {error && <div className="form-error">{error}</div>}
            {successMsg && <div className="form-success">{successMsg}</div>}

            <button className="primary-btn auth-submit" disabled={busy}>
              {busy ? 'Please wait...' : signUp ? 'Create my account' : 'Sign in'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <button
            className="google-btn"
            onClick={async () => {
              try {
                setError('');
                await signInWithGoogleAuth();
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <span className="google-g">G</span> Google Sign-In
          </button>

          <div className="auth-switch">
            {signUp ? 'Already have an account?' : 'New around here?'} <button onClick={() => { setSignUp(!signUp); setError(''); setSuccessMsg(''); }}>{signUp ? 'Sign in' : 'Create an account'}</button>
          </div>

          <div className="demo-note" onClick={handleDemoLogin} style={{ cursor: 'pointer' }}>
            Try 1-Click Demo: <strong>demo@fitcampus.app</strong> / <strong>password123</strong>
          </div>
        </div>

        <div className="auth-footer">
          Made for students, by the movement. {campuses.length > 0 && `• ${campuses.length} campuses and counting`}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <div className="modal-head" style={{ marginBottom: '16px' }}>
              <div>
                <span className="eyebrow">ACCOUNT RECOVERY</span>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Reset Password</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowForgotModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                  Enter your email address and we will send you a 6-digit verification code to reset your password.
                </p>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>
                  Registered Email
                  <input
                    type="email"
                    required
                    placeholder="you@university.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: '#0F172A', border: '1px solid #334155', color: '#fff', fontSize: '13px', marginTop: '4px' }}
                  />
                </label>

                {forgotMsg && <div className={forgotMsg.includes('sent') ? 'form-success' : 'form-error'} style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px' }}>{forgotMsg}</div>}

                <button className="primary-btn" disabled={busy} style={{ width: '100%', marginTop: '6px' }}>
                  {busy ? 'Sending code...' : 'Send Verification Code'} <Mail size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '12px', fontSize: '12px', color: '#E2E8F0' }}>
                  <span style={{ fontWeight: 700, color: '#F43F5E', display: 'block', marginBottom: '2px' }}>✉️ Code Sent to {forgotEmail}</span>
                  Demo OTP Code: <b style={{ letterSpacing: '2px', color: '#FACC15', fontSize: '14px' }}>{generatedCode}</b>
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>
                  Enter 6-Digit Code
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 482910"
                    value={forgotCodeInput}
                    onChange={(e) => setForgotCodeInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: '#0F172A', border: '1px solid #334155', color: '#fff', fontSize: '15px', letterSpacing: '3px', fontWeight: 'bold', marginTop: '4px' }}
                  />
                </label>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#CBD5E1' }}>
                  Set New Password
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="New password (min 6 characters)"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: '#0F172A', border: '1px solid #334155', color: '#fff', fontSize: '13px', marginTop: '4px' }}
                  />
                </label>

                {forgotMsg && <div className="form-error" style={{ fontSize: '12px', padding: '8px 12px', borderRadius: '8px' }}>{forgotMsg}</div>}

                <button className="primary-btn" disabled={busy} style={{ width: '100%', marginTop: '6px' }}>
                  {busy ? 'Resetting password...' : 'Reset Password & Sign In'} <KeyRound size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}
                >
                  ← Resend code / Change email
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Setup({ campuses, onSave, loading }: { campuses: Campus[]; onSave: (name: string, campus: number) => Promise<void>; loading: boolean }) {
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="setup-page">
      <div className="setup-top">
        <Brand />
        <span>01 / 01 — THE BASICS</span>
      </div>
      <div className="setup-card">
        <div className="setup-icon">
          <Sparkles size={29} />
        </div>
        <span className="eyebrow">LET'S MAKE IT OFFICIAL</span>
        <h1>
          Hey, future<br />
          <em>campus legend.</em>
        </h1>
        <p>Just two quick things, then you're in.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || !campus) {
              setError('Add your name and choose your campus.');
              return;
            }
            setError('');
            try {
              await onSave(name.trim(), Number(campus));
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <label>
            What should we call you?
            <input placeholder="Your name" value={name} maxLength={35} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Your campus
            <select value={campus} onChange={(e) => setCampus(e.target.value)} required>
              <option value="">Select your campus</option>
              {campuses.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name} — {c.location}
                </option>
              ))}
            </select>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn" disabled={loading}>
            {loading ? 'Setting things up...' : "Let's go"}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
      <span className="setup-foot">YOUR JOURNEY, YOUR PACE. LET'S GET MOVING.</span>
    </div>
  );
}

function Ring({ value, label, sub, color = 'coral' }: { value: number; label: string; sub: string; color?: string }) {
  return (
    <div className={`ring ring-${color}`} style={{ '--progress': `${Math.min(value, 100)}%` } as React.CSSProperties}>
      <div>
        <strong>{label}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}

function WorkoutArt({ workout, large = false }: { workout: Workout; large?: boolean }) {
  return (
    <div className={`workout-art art-${workout.accent || 'purple'} ${large ? 'art-large' : ''}`}>
      <div className="art-grid" />
      <div className="art-blob" />
      <Dumbbell size={large ? 82 : 60} strokeWidth={1.25} />
      <span className="art-spark">✳</span>
    </div>
  );
}

function CameraCounter({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('Starting camera…');
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    let mounted = true;
    let prev: number[] | null = null;
    let armed = false;
    let lastRep = 0;

    const analyze = () => {
      const video = videoRef.current,
        canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        frameRef.current = requestAnimationFrame(analyze);
        return;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 40;
      canvas.height = 30;
      ctx.drawImage(video, 0, 0, 40, 30);
      const pixels = ctx.getImageData(0, 0, 40, 30).data;
      const current: number[] = [];
      for (let i = 0; i < pixels.length; i += 16) current.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
      if (prev) {
        let delta = 0;
        for (let i = 0; i < current.length; i++) delta += Math.abs(current[i] - prev[i]);
        const motion = delta / current.length;
        if (motion > 13) {
          armed = true;
          setStatus('Movement detected — keep going!');
        } else if (armed && motion < 6 && Date.now() - lastRep > 900) {
          armed = false;
          lastRep = Date.now();
          setCount((n) => n + 1);
          setStatus('Nice rep! Keep moving.');
        }
      }
      prev = current;
      frameRef.current = requestAnimationFrame(analyze);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => {
              setActive(true);
              setStatus('Move into frame and start your reps');
              frameRef.current = requestAnimationFrame(analyze);
            })
            .catch(() => setCameraError('Could not start camera playback.'));
        }
      })
      .catch(() => setCameraError('Camera access unavailable. Allow camera permission to use the rep counter.'));

    return () => {
      mounted = false;
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">MOTION-ASSISTED TRACKING</span>
            <h2>
              Rep counter <span className="beta">BETA</span>
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="camera-view">
          <video ref={videoRef} playsInline muted autoPlay />
          <canvas ref={canvasRef} hidden />
          {cameraError && (
            <div className="camera-error">
              <Camera size={30} />
              {cameraError}
            </div>
          )}
          <span className="camera-badge">
            <span className={active ? 'live-dot' : ''} />
            {active ? 'LIVE CAMERA' : 'CAMERA OFF'}
          </span>
          <div className="camera-guides">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="camera-stats">
          <div>
            <strong>{count}</strong>
            <span>REPS COUNTED</span>
          </div>
          <p>{status}</p>
          <button className="secondary-btn" onClick={() => setCount(0)}>
            Reset count
          </button>
        </div>
        <p className="camera-disclaimer">
          Experimental motion detection estimates repetitions from camera movement. Keep your whole body in frame for best results.
        </p>
      </div>
    </div>
  );
}

function FitnessApp() {
  const { user, session, loading: authLoading, error: authError, signOut } = useAuth();
  const [introDone, setIntroDone] = useState(() => localStorage.getItem('fc_intro_done') === '1');
  const [tab, setTab] = useState<Tab>('home');

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [stepTracking, setStepTracking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);

  const [draft, setDraft] = useState('');
  const [editName, setEditName] = useState('');
  const [editCampus, setEditCampus] = useState('');

  const [adminName, setAdminName] = useState('');
  const [adminExtra, setAdminExtra] = useState('');
  const [adminKind, setAdminKind] = useState<'campus' | 'workout' | 'challenge'>('campus');
  const [filter, setFilter] = useState('All');

  const motionLast = useRef(0);
  const motionPeak = useRef(false);

  const profile = profiles.find((p) => p.user_id === user?.id) || (user ? LocalDb.getProfileByUserId(user.id) : undefined);
  const campus = campuses.find((c) => c.id === profile?.campus_id) || campuses[0];
  const campusMembers = profiles.filter((p) => p.campus_id === profile?.campus_id).sort((a, b) => b.xp - a.xp);
  const rank = campusMembers.findIndex((p) => p.user_id === user?.id) + 1 || 1;

  const level = Math.floor((profile?.xp || 0) / 500) + 1;
  const levelProgress = ((profile?.xp || 0) % 500) / 5;

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.created_at?.slice(0, 10) === today);
  const todaySteps = todayLogs.reduce((sum, l) => sum + (l.steps || 0), 0);

  const token = user?.id || session?.access_token || 'demo_user_active';

  const loadPublic = async () => {
    try {
      setError('');
      const [c, w, ch, p] = await Promise.all([request('campuses'), request('workouts'), request('challenges'), request('profiles')]);
      setCampuses(c);
      setWorkouts(w);
      setChallenges(ch);
      setProfiles(p);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDataLoading(false);
    }
  };

  const loadPrivate = async () => {
    if (!token) return;
    try {
      const l = await request('activity', {}, token);
      setLogs(l);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadMessages = async () => {
    if (!profile?.campus_id) return;
    try {
      const m = await request(`messages?campus_id=${profile.campus_id}`);
      setMessages(m);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    loadPublic();
  }, []);

  useEffect(() => {
    if (token) loadPrivate();
  }, [token]);

  useEffect(() => {
    if (profile?.campus_id) {
      loadMessages();
      const timer = setInterval(loadMessages, 5000);
      return () => clearInterval(timer);
    }
  }, [profile?.campus_id]);

  useEffect(() => {
    if (!selectedWorkout || !running) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [selectedWorkout, running]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.display_name);
      setEditCampus(String(profile.campus_id));
    }
  }, [profile?.id, profile?.display_name]);

  const [sensorActive, setSensorActive] = useState(false);

  const requestSensorPermission = async () => {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          setSensorActive(true);
          setToast('Phone motion sensor activated! Shake or walk with phone.');
        } else {
          setError('Motion sensor permission was denied in browser settings.');
        }
      } catch (err) {
        setError((err as Error).message);
      }
    } else {
      setSensorActive(true);
      setToast('Phone motion sensor active! Shake or walk with phone.');
    }
  };

  // Auto-start global accelerometer step counter in background
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;

    let motionLast = 0;
    let motionPeak = false;

    const handler = (event: DeviceMotionEvent) => {
      let mag = 0;
      const aGrav = event.accelerationIncludingGravity;
      const aPure = event.acceleration;

      if (aGrav && (aGrav.x !== null || aGrav.y !== null || aGrav.z !== null)) {
        const x = aGrav.x || 0;
        const y = aGrav.y || 0;
        const z = aGrav.z || 0;
        mag = Math.sqrt(x * x + y * y + z * z);

        // Sensitivity: threshold at 10.8 m/s^2 (walking step impact)
        if (mag > 10.8) motionPeak = true;
        if (motionPeak && mag < 9.9 && Date.now() - motionLast > 280) {
          motionLast = Date.now();
          motionPeak = false;

          setSessionSteps((n) => n + 1);
          if (user) {
            LocalDb.addLog(user.id, 'steps', null, 1, 1);
            setLogs(LocalDb.getLogs(user.id));
            setProfiles(LocalDb.getProfiles());
          }
        }
      } else if (aPure && (aPure.x !== null || aPure.y !== null || aPure.z !== null)) {
        const x = aPure.x || 0;
        const y = aPure.y || 0;
        const z = aPure.z || 0;
        mag = Math.sqrt(x * x + y * y + z * z);

        // Sensitivity pure acceleration: peak > 1.5
        if (mag > 1.5) motionPeak = true;
        if (motionPeak && mag < 0.6 && Date.now() - motionLast > 280) {
          motionLast = Date.now();
          motionPeak = false;

          setSessionSteps((n) => n + 1);
          if (user) {
            LocalDb.addLog(user.id, 'steps', null, 1, 1);
            setLogs(LocalDb.getLogs(user.id));
            setProfiles(LocalDb.getProfiles());
          }
        }
      }
    };

    window.addEventListener('devicemotion', handler, true);
    return () => {
      window.removeEventListener('devicemotion', handler, true);
    };
  }, [user]);

  const refresh = async () => {
    await Promise.all([loadPublic(), loadPrivate()]);
  };

  const completeIntro = () => {
    localStorage.setItem('fc_intro_done', '1');
    setIntroDone(true);
  };

  const setup = async (name: string, campusId: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const newProfile = LocalDb.saveProfile(user.id, name, campusId);
      setProfiles(LocalDb.getProfiles());
      setToast('Welcome to the crew! Your journey starts now.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const startWorkout = (w: Workout) => {
    setSelectedWorkout(w);
    setSeconds(0);
    setRunning(false);
  };

  const finishWorkout = async () => {
    if (!selectedWorkout) return;
    setSaving(true);
    try {
      await request('activity', { method: 'POST', body: JSON.stringify({ type: 'workout', workout_id: selectedWorkout.id }) }, token);
      setToast(`Workout complete! +${selectedWorkout.xp} XP earned`);
      setSelectedWorkout(null);
      setRunning(false);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const beginSteps = async () => {
    if (!('DeviceMotionEvent' in window)) {
      setError('Motion sensors are not available on this device. Try a phone with motion support.');
      return;
    }
    try {
      const DeviceMotionWithPermission = DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DeviceMotionWithPermission.requestPermission === 'function') {
        const result = await DeviceMotionWithPermission.requestPermission();
        if (result !== 'granted') throw new Error('Motion permission was denied.');
      }
      setSessionSteps(0);
      setStepTracking(true);
      setToast('Step tracking started. Keep walking!');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const saveSteps = async () => {
    setStepTracking(false);
    if (sessionSteps === 0) {
      setToast('No steps detected this session. Try walking with your phone.');
      return;
    }
    setSaving(true);
    try {
      await request('activity', { method: 'POST', body: JSON.stringify({ type: 'steps', steps: sessionSteps }) }, token);
      setToast(`${sessionSteps} steps saved to your activity!`);
      setSessionSteps(0);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await request('messages', { method: 'POST', body: JSON.stringify({ body: draft.trim() }) }, token);
      setDraft('');
      await loadMessages();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (id: number) => {
    try {
      await request('messages', { method: 'DELETE', body: JSON.stringify({ id }) }, token);
      await loadMessages();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editCampus) {
      setError('Name and campus are required.');
      return;
    }
    setSaving(true);
    try {
      await request('profiles', { method: 'PUT', body: JSON.stringify({ display_name: editName.trim(), campus_id: Number(editCampus) }) }, token);
      setToast('Your profile is up to date!');
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const adminCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminExtra.trim()) {
      setError('Both fields are required.');
      return;
    }
    setSaving(true);
    try {
      const body =
        adminKind === 'campus'
          ? { name: adminName, location: adminExtra }
          : adminKind === 'workout'
          ? { title: adminName, description: adminExtra, category: 'Strength', duration: 20, calories: 180, xp: 100, accent: 'purple' }
          : { title: adminName, description: adminExtra, target: 5, xp: 150, icon: 'zap' };

      await request(`${adminKind === 'campus' ? 'campuses' : adminKind === 'workout' ? 'workouts' : 'challenges'}`, { method: 'POST', body: JSON.stringify(body) }, token);
      setAdminName('');
      setAdminExtra('');
      setToast('New content published!');
      await loadPublic();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const adminDelete = async (kind: 'campus' | 'workout' | 'challenge', id: number) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await request(kind === 'campus' ? 'campuses' : kind === 'workout' ? 'workouts' : 'challenges', { method: 'DELETE', body: JSON.stringify({ id }) }, token);
      setToast('Item deleted.');
      await loadPublic();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (authLoading || dataLoading)
    return (
      <div className="loading-screen">
        <Brand />
        <div className="loading-spinner" />
        <p>Getting your campus ready...</p>
      </div>
    );

  if (!introDone) return <Intro onDone={completeIntro} />;

  if (!user)
    return (
      <>
        <AuthScreen campuses={campuses} />
        {authError && <div className="global-error">{authError}</div>}
      </>
    );

  if (!profile)
    return (
      <>
        <Setup campuses={campuses} onSave={setup} loading={saving} />
        {error && (
          <div className="global-error">
            {error}
            <button onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        )}
      </>
    );

  const switchTab = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="side-section-label">YOUR SPACE</div>
        <nav>
          {navigation.map((item) => (
            <button key={item.id} className={`side-link ${tab === item.id ? 'selected' : ''}`} onClick={() => switchTab(item.id)}>
              <item.icon size={19} />
              <span>{item.label}</span>
              {tab === item.id && <span className="side-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="side-section-label side-section-second">MORE</div>
        <nav>
          {profile.role === 'admin' && (
            <button className={`side-link ${tab === 'admin' ? 'selected' : ''}`} onClick={() => switchTab('admin')}>
              <Shield size={19} /> Admin portal
            </button>
          )}
          <button className="side-link" onClick={() => switchTab('profile')}>
            <Settings2 size={19} /> Settings
          </button>
        </nav>
        <div className="side-bottom">
          <div className="side-promo">
            <div className="side-promo-icon">
              <Zap size={22} />
            </div>
            <strong>Keep the momentum.</strong>
            <span>Every move counts toward something bigger.</span>
            <button onClick={() => switchTab('workouts')}>
              Explore workouts <ArrowRight size={15} />
            </button>
          </div>
          <button className="sidebar-user" onClick={() => switchTab('profile')}>
            <span className="avatar avatar-purple">{initials(profile.display_name)}</span>
            <span>
              <strong>{profile.display_name}</strong>
              <small>
                Level {level} · {campus?.name || 'Campus'}
              </small>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="breadcrumb">
            <span>FIT CAMPUS</span>
            <ChevronRight size={14} />
            <strong>{tab === 'leaderboard' ? 'Leaderboard' : tab === 'chat' ? 'Campus chat' : tab.charAt(0).toUpperCase() + tab.slice(1)}</strong>
          </div>
          <div className="top-actions">
            <span className="campus-pill">
              <span className="campus-pulse" />
              {campus?.name}
            </span>
            <button className="top-avatar" onClick={() => switchTab('profile')} aria-label="Open profile">
              {initials(profile.display_name)}
            </button>
          </div>
        </header>

        <main className="content">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              {tab === 'home' && (
                <>
                  <div className="page-heading home-heading">
                    <div>
                      <span className="eyebrow">
                        YOUR DAILY DOSE OF MOMENTUM <span className="tiny-spark">✳</span>
                      </span>
                      <h1>
                        Hey, {profile.display_name.split(' ')[0]} <span className="wave">✌️</span>
                      </h1>
                      <p>Ready to make today a good one? Let's get moving.</p>
                    </div>
                    <div className="date-chip">
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                      <strong>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                    </div>
                  </div>

                  <div className="hero-banner">
                    <div className="hero-content">
                      <span className="hero-tag">
                        <Sparkles size={14} /> YOUR CAMPUS. YOUR MOVE.
                      </span>
                      <h2>
                        Show up for<br />
                        <em>yourself today.</em>
                      </h2>
                      <p>Big goals start with small moves. Your next one is waiting.</p>
                      <button onClick={() => switchTab('workouts')}>
                        Find a workout <ArrowRight size={17} />
                      </button>
                    </div>
                    <div className="hero-art">
                      <div className="hero-orbit orbit-a" />
                      <div className="hero-orbit orbit-b" />
                      <div className="hero-disc">
                        <span>
                          GO<br />
                          GET<br />
                          IT<span className="hero-dot">.</span>
                        </span>
                      </div>
                      <div className="hero-star">✳</div>
                      <div className="hero-smile">☺</div>
                    </div>
                  </div>

                  <div className="section-row">
                    <div>
                      <span className="eyebrow">THE DAILY CHECK-IN</span>
                      <h2>At a glance</h2>
                    </div>
                    <span className="section-caption">Every little bit adds up.</span>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-header">
                        <span className="stat-icon coral">
                          <Footprints size={20} />
                        </span>
                        <span className="stat-label">TODAY'S STEPS</span>
                      </div>
                      <div className="stat-main">
                        <div>
                          <strong>{todaySteps.toLocaleString()}</strong>
                          <span>/ 8,000 steps</span>
                        </div>
                        <Ring value={todaySteps / 80} label={`${Math.min(100, Math.round(todaySteps / 80))}%`} sub="GOAL" />
                      </div>
                      <div className="stat-bottom">
                        <span>One step at a time</span>
                        <button onClick={() => switchTab('profile')}>
                          Track steps <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-header">
                        <span className="stat-icon lavender">
                          <Flame size={20} />
                        </span>
                        <span className="stat-label">CURRENT STREAK</span>
                      </div>
                      <div className="stat-main">
                        <div>
                          <strong>{profile.streak}</strong>
                          <span>days in a row</span>
                        </div>
                        <span className="stat-illustration">🔥</span>
                      </div>
                      <div className="stat-bottom">
                        <span>Keep the fire going</span>
                        <span className="stat-mini">YOU GOT THIS</span>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-header">
                        <span className="stat-icon mint">
                          <Zap size={20} />
                        </span>
                        <span className="stat-label">YOUR XP</span>
                      </div>
                      <div className="stat-main">
                        <div>
                          <strong>{profile.xp.toLocaleString()}</strong>
                          <span>total points</span>
                        </div>
                        <span className="level-bubble">
                          LVL<br />
                          <b>{level}</b>
                        </span>
                      </div>
                      <div className="xp-bar">
                        <span style={{ width: `${levelProgress}%` }} />
                      </div>
                      <div className="stat-bottom">
                        <span>{500 - (profile.xp % 500)} XP to level {level + 1}</span>
                        <span className="stat-mini">LEVEL UP ↗</span>
                      </div>
                    </div>
                  </div>

                  <div className="home-lower">
                    <div className="daily-panel">
                      <div className="panel-head">
                        <div>
                          <span className="eyebrow">NO PRESSURE, JUST PROGRESS</span>
                          <h2>Move your way</h2>
                        </div>
                        <button className="text-link" onClick={() => switchTab('workouts')}>
                          All workouts <ArrowRight size={16} />
                        </button>
                      </div>
                      <div className="home-workouts">
                        {workouts.slice(0, 2).map((w) => (
                          <button className="home-workout" key={w.id} onClick={() => startWorkout(w)}>
                            <WorkoutArt workout={w} />
                            <span className="home-workout-info">
                              <small>
                                {w.category.toUpperCase()} · {w.duration} MIN
                              </small>
                              <strong>{w.title}</strong>
                              <span>{w.description}</span>
                            </span>
                            <span className="circle-arrow">
                              <ArrowRight size={18} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="challenge-panel">
                      <div className="challenge-panel-top">
                        <span className="eyebrow">CAMPUS CHALLENGE</span>
                        <Trophy size={20} />
                      </div>
                      <h3>{challenges[0]?.title || 'Your next challenge'}</h3>
                      <p>{challenges[0]?.description || 'Make your next move count.'}</p>
                      <div className="challenge-reward">
                        <Zap size={15} /> +{challenges[0]?.xp || 0} XP REWARD
                      </div>
                      <button onClick={() => switchTab('leaderboard')}>
                        See the challenge <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="activity-strip">
                    <div>
                      <span className="activity-strip-icon">
                        <Medal size={22} />
                      </span>
                      <span>
                        <strong>Better together, always.</strong>
                        <small>See where your campus crew stands this week.</small>
                      </span>
                    </div>
                    <button onClick={() => switchTab('leaderboard')}>
                      View leaderboard <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {tab === 'workouts' && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">SWEAT NOW, SHINE LATER</span>
                      <h1>
                        Your move, your way<span className="heading-period">.</span>
                      </h1>
                      <p>Find your flow. Every workout is a win.</p>
                    </div>
                    <span className="heading-icon">
                      <Dumbbell size={28} />
                    </span>
                  </div>

                  <div className="workout-feature">
                    <div>
                      <span className="eyebrow light">TODAY IS A GREAT DAY TO START</span>
                      <h2>
                        Find your<br />
                        feel-good workout.
                      </h2>
                      <p>Quick break between classes? We've got you.</p>
                    </div>
                    <div className="feature-deco">
                      <span>
                        MOVE<br />
                        WITH<br />
                        PURPOSE<span>.</span>
                      </span>
                    </div>
                  </div>

                  <div className="section-row workout-section">
                    <div>
                      <span className="eyebrow">FIND YOUR FIT</span>
                      <h2>Explore workouts</h2>
                    </div>
                    <span className="section-caption">{workouts.length} sessions to choose from</span>
                  </div>

                  <div className="filter-row">
                    {['All', ...new Set(workouts.map((w) => w.category))].map((f) => (
                      <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="workout-grid">
                    {workouts
                      .filter((w) => filter === 'All' || w.category === filter)
                      .map((w) => (
                        <div className="workout-card" key={w.id}>
                          <WorkoutArt workout={w} large />
                          <div className="workout-card-body">
                            <div className="workout-card-meta">
                              <span>{w.category.toUpperCase()}</span>
                              <span>
                                <Clock3 size={13} /> {w.duration} MIN
                              </span>
                            </div>
                            <h3>{w.title}</h3>
                            <p>{w.description}</p>
                            <div className="workout-card-foot">
                              <span>
                                <Flame size={15} /> {w.calories} cal <span className="dot-sep">·</span> <Zap size={14} /> +{w.xp} XP
                              </span>
                              <button onClick={() => startWorkout(w)} aria-label={`Start ${w.title}`}>
                                <ArrowRight size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="camera-promo">
                    <span className="camera-promo-icon">
                      <Camera size={24} />
                    </span>
                    <div>
                      <strong>Try the camera rep counter</strong>
                      <p>Use your camera to estimate reps as you move. No extra equipment needed.</p>
                    </div>
                    <button onClick={() => setShowCamera(true)}>
                      Open camera <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

              {tab === 'leaderboard' && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">THE CAMPUS CREW</span>
                      <h1>
                        Better together<span className="heading-period">.</span>
                      </h1>
                      <p>Good vibes, friendly competition, and a whole lot of movement.</p>
                    </div>
                    <span className="heading-icon">
                      <Trophy size={28} />
                    </span>
                  </div>

                  <div className="leader-banner">
                    <div>
                      <span className="eyebrow light">YOUR CAMPUS LEADERBOARD</span>
                      <h2>
                        Every effort deserves<br />a little hype.
                      </h2>
                      <p>
                        {campus?.name} · {campusMembers.length} movers on the board
                      </p>
                    </div>
                    <Trophy size={130} strokeWidth={1} className="leader-trophy" />
                  </div>

                  <div className="leader-layout">
                    <div className="leader-card">
                      <div className="panel-head">
                        <div>
                          <span className="eyebrow">THE LINEUP</span>
                          <h2>Campus rankings</h2>
                        </div>
                        <span className="leader-count">{campusMembers.length} MEMBERS</span>
                      </div>
                      {campusMembers.length === 0 ? (
                        <div className="empty-state">Be the first to get moving on your campus!</div>
                      ) : (
                        <div className="rank-list">
                          {campusMembers.map((p, i) => (
                            <div className={`rank-row ${p.user_id === user.id ? 'my-rank' : ''}`} key={p.id}>
                              <span className={`rank-num ${i < 3 ? 'top-rank' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                              <span className={`avatar ${['avatar-coral', 'avatar-purple', 'avatar-mint', 'avatar-yellow'][i % 4]}`}>{initials(p.display_name)}</span>
                              <div className="rank-person">
                                <strong>
                                  {p.display_name} {p.user_id === user.id && <span className="you-pill">YOU</span>}
                                </strong>
                                <small>
                                  Level {Math.floor(p.xp / 500) + 1} · {p.streak} day streak
                                </small>
                              </div>
                              <strong className="rank-xp">
                                {p.xp.toLocaleString()} <small>XP</small>
                              </strong>
                              {i === 0 && <span className="rank-crown">✳</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="leader-side">
                      <div className="my-position">
                        <span className="eyebrow light">YOUR SPOTLIGHT</span>
                        <div className="position-number">#{rank || '—'}</div>
                        <h3>You're showing up!</h3>
                        <p>Every move gets you closer to your next level.</p>
                        <div className="position-progress">
                          <span style={{ width: `${levelProgress}%` }} />
                        </div>
                        <small>{500 - ((profile?.xp || 0) % 500)} XP until level {level + 1}</small>
                      </div>

                      <div className="challenge-list">
                        <span className="eyebrow">SOMETHING TO AIM FOR</span>
                        <h3>Campus challenges</h3>
                        {challenges.map((c) => (
                          <div className="challenge-item" key={c.id}>
                            <span>
                              <Target size={19} />
                            </span>
                            <div>
                              <strong>{c.title}</strong>
                              <small>{c.description}</small>
                              <em>
                                +{c.xp} XP · GOAL {c.target}
                              </em>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === 'chat' && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">BETTER TOGETHER</span>
                      <h1>
                        Campus chat<span className="heading-period">.</span>
                      </h1>
                      <p>Check in, share a win, or just say hey to your crew.</p>
                    </div>
                    <span className="heading-icon">
                      <MessageCircle size={28} />
                    </span>
                  </div>

                  <div className="chat-layout">
                    <div className="chat-card">
                      <div className="chat-header">
                        <div className="chat-header-icon">
                          <Users size={22} />
                        </div>
                        <div>
                          <strong>{campus?.name} crew</strong>
                          <span>
                            <span className="online-dot" /> CAMPUS COMMON ROOM
                          </span>
                        </div>
                        <span className="chat-member-count">{campusMembers.length} MEMBERS</span>
                      </div>

                      <div className="chat-messages">
                        <div className="chat-day">CAMPUS CONVERSATION</div>
                        {messages.length === 0 ? (
                          <div className="chat-empty">
                            <MessageCircle size={34} />
                            <strong>It's quiet in here... for now.</strong>
                            <span>Say hello and get the conversation going!</span>
                          </div>
                        ) : (
                          messages.map((m) => (
                            <div className={`chat-message ${m.user_id === user.id ? 'own' : ''}`} key={m.id}>
                              <span className="avatar avatar-purple">{initials(m.display_name)}</span>
                              <div className="message-content">
                                <div>
                                  <strong>{m.display_name}</strong>
                                  <small>{new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small>
                                  {m.user_id === user.id && (
                                    <button onClick={() => deleteMessage(m.id)} aria-label="Delete message">
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                                <p>{m.body}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <form className="chat-compose" onSubmit={sendMessage}>
                        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} placeholder="Share a thought with your campus..." aria-label="Message" />
                        <button disabled={saving || !draft.trim()} aria-label="Send message">
                          <Send size={18} />
                        </button>
                      </form>
                    </div>

                    <div className="chat-side">
                      <span className="chat-side-icon">
                        <Sparkles size={25} />
                      </span>
                      <h3>Good vibes only.</h3>
                      <p>Share wins, find accountability buddies, and make your campus feel a little smaller.</p>
                      <div className="chat-rule">
                        <Check size={16} /> Be kind and supportive
                      </div>
                      <div className="chat-rule">
                        <Check size={16} /> Celebrate every win
                      </div>
                      <div className="chat-rule">
                        <Check size={16} /> Keep it campus-friendly
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === 'profile' && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">THE PERSON BEHIND THE PROGRESS</span>
                      <h1>
                        All about you<span className="heading-period">.</span>
                      </h1>
                      <p>Your journey, your wins, your next chapter.</p>
                    </div>
                    <span className="heading-icon">
                      <UserRound size={28} />
                    </span>
                  </div>

                  <div className="profile-grid">
                    <div className="profile-main">
                      <div className="profile-hero">
                        <span className="profile-hero-shape">✳</span>
                        <span className="avatar profile-avatar">{initials(profile.display_name)}</span>
                        <div>
                          <span className="eyebrow light">THE MAIN CHARACTER</span>
                          <h2>{profile.display_name}</h2>
                          <p>
                            {campus?.name} · Level {level} mover
                          </p>
                        </div>
                        <span className="profile-level">
                          <Zap size={15} /> LEVEL {level}
                        </span>
                      </div>

                      <div className="profile-stats">
                        <div>
                          <strong>{profile.xp.toLocaleString()}</strong>
                          <span>TOTAL XP</span>
                        </div>
                        <div>
                          <strong>{profile.steps.toLocaleString()}</strong>
                          <span>TOTAL STEPS</span>
                        </div>
                        <div>
                          <strong>{profile.streak}</strong>
                          <span>DAY STREAK</span>
                        </div>
                      </div>

                      <div className="white-panel">
                        <div className="panel-head">
                          <div>
                            <span className="eyebrow">KEEP IT CURRENT</span>
                            <h2>Your details</h2>
                          </div>
                          <Settings2 size={20} />
                        </div>
                        <form className="profile-form" onSubmit={saveProfile}>
                          <label>
                            Display name
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} required maxLength={35} />
                          </label>
                          <label>
                            Campus
                            <select value={editCampus} onChange={(e) => setEditCampus(e.target.value)} required>
                              {campuses.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button className="primary-btn" disabled={saving}>
                            Save changes <ArrowRight size={17} />
                          </button>
                        </form>
                      </div>

                      <div className="white-panel activity-panel">
                        <div className="panel-head">
                          <div>
                            <span className="eyebrow">LOOK HOW FAR YOU'VE COME</span>
                            <h2>Recent activity</h2>
                          </div>
                          <Activity size={20} />
                        </div>
                        {logs.length === 0 ? (
                          <div className="empty-state">Your activity will show up here after your first workout or walk.</div>
                        ) : (
                          logs.slice(0, 5).map((l) => (
                            <div className="activity-row" key={l.id}>
                              <span className="activity-row-icon">{l.type === 'workout' ? <Dumbbell size={19} /> : <Footprints size={19} />}</span>
                              <span>
                                <strong>{l.type === 'workout' ? workouts.find((w) => w.id === l.workout_id)?.title || 'Workout completed' : `${l.steps} steps logged`}</strong>
                                <small>{new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                              </span>
                              <b>+{l.xp} XP</b>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="profile-side">
                      <div className="steps-card">
                        <span className="eyebrow light">AUTO-STEP ACCELEROMETER</span>
                        <Footprints size={35} />
                        <h3>Walk it out.</h3>
                        <p>Steps count automatically whenever your phone moves.</p>
                        <div className="steps-session">
                          <strong>{todaySteps.toLocaleString()}</strong>
                          <span>TOTAL STEPS TODAY</span>
                        </div>
                        <button
                          onClick={() => {
                            if (!user) return;
                            LocalDb.addLog(user.id, 'steps', null, 500, 50);
                            setLogs(LocalDb.getLogs(user.id));
                            setProfiles(LocalDb.getProfiles());
                            setToast('+500 steps logged!');
                          }}
                          style={{ background: '#1E293B', border: '1px solid #334155', color: '#FACC15', fontWeight: 700 }}
                        >
                          <Plus size={16} /> Quick Add +500 Steps (Test)
                        </button>
                        <small>🟢 Accelerometer Auto-Tracking Active in background.</small>
                      </div>

                      <div className="white-panel account-panel">
                        <span className="eyebrow">ACCOUNT</span>
                        <h3>Stay in control.</h3>
                        <p>{user.email}</p>
                        {profile.role === 'admin' && (
                          <button onClick={() => switchTab('admin')}>
                            <Shield size={17} /> Open admin portal <ArrowRight size={15} />
                          </button>
                        )}
                        <button onClick={signOut}>
                          <LockKeyhole size={17} /> Sign out <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === 'admin' && profile.role === 'admin' && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">BEHIND THE SCENES</span>
                      <h1>
                        Admin portal<span className="heading-period">.</span>
                      </h1>
                      <p>Keep campus life moving with fresh content.</p>
                    </div>
                    <span className="heading-icon">
                      <Shield size={28} />
                    </span>
                  </div>

                  <div className="admin-summary">
                    <div>
                      <strong>{campuses.length}</strong>
                      <span>CAMPUSES</span>
                    </div>
                    <div>
                      <strong>{workouts.length}</strong>
                      <span>WORKOUTS</span>
                    </div>
                    <div>
                      <strong>{challenges.length}</strong>
                      <span>CHALLENGES</span>
                    </div>
                    <div>
                      <strong>{profiles.length}</strong>
                      <span>MEMBERS</span>
                    </div>
                  </div>

                  <div className="admin-grid">
                    <div className="white-panel">
                      <span className="eyebrow">BUILD THE EXPERIENCE</span>
                      <h2>Add something new</h2>
                      <div className="filter-row">
                        {(['campus', 'workout', 'challenge'] as const).map((kind) => (
                          <button className={adminKind === kind ? 'active' : ''} key={kind} onClick={() => setAdminKind(kind)}>
                            {kind.charAt(0).toUpperCase() + kind.slice(1)}
                          </button>
                        ))}
                      </div>
                      <form className="profile-form" onSubmit={adminCreate}>
                        <label>
                          {adminKind === 'campus' ? 'Campus name' : 'Title'}
                          <input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder={adminKind === 'campus' ? 'e.g. Northside University' : 'e.g. Morning Mobility'} required />
                        </label>
                        <label>
                          {adminKind === 'campus' ? 'Location' : 'Description'}
                          <input value={adminExtra} onChange={(e) => setAdminExtra(e.target.value)} placeholder={adminKind === 'campus' ? 'e.g. Boston, MA' : 'What makes it great?'} required />
                        </label>
                        <button className="primary-btn" disabled={saving}>
                          <Plus size={17} /> Add {adminKind}
                        </button>
                      </form>
                    </div>

                    <div className="white-panel">
                      <span className="eyebrow">MANAGE CONTENT</span>
                      <h2>Published items</h2>
                      <div className="admin-items">
                        {adminKind === 'campus'
                          ? campuses.map((c) => (
                              <div key={c.id}>
                                <span>
                                  <strong>{c.name}</strong>
                                  <small>{c.location}</small>
                                </span>
                                <button onClick={() => adminDelete('campus', c.id)} aria-label={`Delete ${c.name}`}>
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            ))
                          : adminKind === 'workout'
                          ? workouts.map((w) => (
                              <div key={w.id}>
                                <span>
                                  <strong>{w.title}</strong>
                                  <small>
                                    {w.category} · {w.duration} min
                                  </small>
                                </span>
                                <button onClick={() => adminDelete('workout', w.id)} aria-label={`Delete ${w.title}`}>
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            ))
                          : challenges.map((c) => (
                              <div key={c.id}>
                                <span>
                                  <strong>{c.title}</strong>
                                  <small>+{c.xp} XP</small>
                                </span>
                                <button onClick={() => adminDelete('challenge', c.id)} aria-label={`Delete ${c.title}`}>
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="app-footer">
            MADE TO MOVE. MADE FOR CAMPUS. <span>✳</span> FIT CAMPUS © {new Date().getFullYear()}
          </footer>
        </main>
      </div>

      <nav className="bottom-nav">
        {navigation.map((item) => (
          <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => switchTab(item.id)}>
            <item.icon size={21} strokeWidth={tab === item.id ? 2.6 : 1.8} />
            <span>{item.label === 'Campus chat' ? 'Chat' : item.label === 'Rankings' ? 'Rank' : item.label}</span>
          </button>
        ))}
      </nav>

      {selectedWorkout && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setSelectedWorkout(null);
            setRunning(false);
          }}
        >
          <div className="workout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span className="eyebrow">YOUR SESSION</span>
              <button
                className="icon-btn"
                onClick={() => {
                  setSelectedWorkout(null);
                  setRunning(false);
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <WorkoutArt workout={selectedWorkout} large />
            <div className="workout-modal-content">
              <span className="eyebrow">
                {selectedWorkout.category.toUpperCase()} · {selectedWorkout.duration} MIN
              </span>
              <h2>{selectedWorkout.title}</h2>
              <p>{selectedWorkout.description}</p>
              <div className="timer-display">
                <Timer size={24} />
                <strong>{formatTime(seconds)}</strong>
                <span>ELAPSED</span>
              </div>
              <div className="timer-actions">
                <button className="secondary-btn" onClick={() => setRunning(!running)}>
                  {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pause timer' : 'Start timer'}
                </button>
                <button className="secondary-btn" onClick={() => setShowCamera(true)}>
                  <Camera size={18} /> Rep counter
                </button>
              </div>
              <button className="primary-btn modal-complete" disabled={saving} onClick={finishWorkout}>
                <Check size={18} /> {saving ? 'Saving...' : `Finish workout · +${selectedWorkout.xp} XP`}
              </button>
              <small>Finish whenever you're ready. Listen to your body.</small>
            </div>
          </div>
        </div>
      )}

      {showCamera && <CameraCounter onClose={() => setShowCamera(false)} />}
      <AnimatePresence>{toast && <Toast message={toast} onClose={() => setToast('')} />}</AnimatePresence>
      {error && (
        <div className="global-error">
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FitnessApp />
    </AuthProvider>
  );
}
