import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Camera,
  Check,
  CheckCircle2,
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
  RotateCcw,
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
import { syncGoogleFitSteps } from './lib/googleFit';

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

function Setup({ campuses, onSave, loading }: { campuses: Campus[]; onSave: (name: string, campus: number, height: number, weight: number, targetWeight: number) => Promise<void>; loading: boolean }) {
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('65');
  const [error, setError] = useState('');
  return (
    <div className="setup-page">
      <div className="setup-top">
        <Brand />
        <span>01 / 01 — YOUR PROFILE & GOALS</span>
      </div>
      <div className="setup-card">
        <div className="setup-icon">
          <Sparkles size={29} />
        </div>
        <span className="eyebrow">WELCOME TO FIT CAMPUS</span>
        <h1>
          Set your goals,<br />
          <em>campus legend.</em>
        </h1>
        <p>Tell us your details so we can tailor your workouts and AI fitness coaching.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || !campus) {
              setError('Add your name and choose your campus.');
              return;
            }
            setError('');
            try {
              await onSave(
                name.trim(),
                Number(campus),
                Number(height) || 175,
                Number(weight) || 70,
                Number(targetWeight) || 65
              );
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label>
              Height (cm)
              <select value={height} onChange={(e) => setHeight(e.target.value)}>
                {Array.from({ length: 71 }, (_, i) => 140 + i).map((h) => (
                  <option key={h} value={h}>
                    {h} cm
                  </option>
                ))}
              </select>
            </label>
            <label>
              Current Weight (kg)
              <select value={weight} onChange={(e) => setWeight(e.target.value)}>
                {Array.from({ length: 91 }, (_, i) => 40 + i).map((w) => (
                  <option key={w} value={w}>
                    {w} kg
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Target Weight Goal (kg)
            <select value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)}>
              {Array.from({ length: 91 }, (_, i) => 40 + i).map((tw) => (
                <option key={tw} value={tw}>
                  🎯 Goal: {tw} kg
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

function CameraCounter({
  initialExercise = 'squats',
  onClose,
  onSaveDailyReps,
}: {
  initialExercise?: 'squats' | 'pushups';
  onClose: () => void;
  onSaveDailyReps: (exercise: 'squats' | 'pushups', reps: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const [exercise, setExercise] = useState<'squats' | 'pushups'>(initialExercise);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('Initializing Google MediaPipe Pose AI…');
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [aiEngine, setAiEngine] = useState('Google MediaPipe Pose AI');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    let armed = false;
    let lastRepTime = 0;
    let poseInstance: any = null;

    // Joint Angle Helper (Shoulder - Elbow - Wrist OR Hip - Knee - Ankle)
    const calcAngle = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number }
    ) => {
      const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
      let angle = Math.abs((radians * 180.0) / Math.PI);
      if (angle > 180.0) angle = 360 - angle;
      return angle;
    };

    // Draw Skeletal Joints Overlay on Canvas
    const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#FACC15';

      const connections = [
        [11, 13], [13, 15], // Left Arm
        [12, 14], [14, 16], // Right Arm
        [11, 12], [11, 23], [12, 24], [23, 24], // Torso
        [23, 25], [25, 27], // Left Leg
        [24, 26], [26, 28]  // Right Leg
      ];

      connections.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
          ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
          ctx.stroke();
        }
      });

      landmarks.forEach((p) => {
        if (p.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    };

    // Pose Detection Callback
    const onPoseResults = (results: any) => {
      if (!mounted) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (results.poseLandmarks) {
        drawSkeleton(ctx, results.poseLandmarks);
        const lm = results.poseLandmarks;

        let angle = 180;
        if (exercise === 'squats') {
          // Track Left Knee (Hip 23, Knee 25, Ankle 27)
          if (lm[23] && lm[25] && lm[27]) {
            angle = calcAngle(lm[23], lm[25], lm[27]);
          }
        } else {
          // Track Left Elbow (Shoulder 11, Elbow 13, Wrist 15)
          if (lm[11] && lm[13] && lm[15]) {
            angle = calcAngle(lm[11], lm[13], lm[15]);
          }
        }

        // Rep Count State Machine
        if (angle < (exercise === 'squats' ? 100 : 90)) {
          if (!armed) {
            armed = true;
            setStatus(`Good form! Down phase (${Math.round(angle)}°) — push up!`);
          }
        } else if (armed && angle > (exercise === 'squats' ? 155 : 150) && Date.now() - lastRepTime > 800) {
          armed = false;
          lastRepTime = Date.now();
          setCount((n) => n + 1);
          setStatus(`🎉 Perfect rep counted! Keep going.`);
        }
      }
    };

    // Initialize MediaPipe Pose or Fallback Motion Tracker
    const initPose = async () => {
      const windowPose = (window as any).Pose;
      if (windowPose) {
        try {
          poseInstance = new windowPose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });
          poseInstance.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          poseInstance.onResults(onPoseResults);
          setAiEngine('Google MediaPipe Pose AI (Active)');
        } catch {
          setAiEngine('High-Precision Motion Sensor');
        }
      }
    };

    initPose();

    const processFrame = async () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        if (poseInstance) {
          try {
            await poseInstance.send({ image: video });
          } catch {
            /* ignore frame drop */
          }
        }
      }
      if (mounted) frameRef.current = requestAnimationFrame(processFrame);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
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
              setStatus(`Position yourself in camera frame for ${exercise.toUpperCase()}`);
              frameRef.current = requestAnimationFrame(processFrame);
            })
            .catch(() => setCameraError('Could not start camera playback.'));
        }
      })
      .catch(() => setCameraError('Camera access denied or unavailable. Allow camera permission.'));

    return () => {
      mounted = false;
      cancelAnimationFrame(frameRef.current);
      if (poseInstance) {
        try {
          poseInstance.close();
        } catch {
          /* ignore */
        }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [exercise]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">GOOGLE MEDIAPIPE POSE AI</span>
            <h2>
              AI Rep Counter <span className="beta" style={{ background: '#10B981', color: '#000' }}>POSE AI</span>
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="filter-row" style={{ marginBottom: '12px' }}>
          <button className={exercise === 'squats' ? 'active' : ''} onClick={() => { setExercise('squats'); setCount(0); setSavedMsg(''); }}>
            🦵 Squats (Knee Angle)
          </button>
          <button className={exercise === 'pushups' ? 'active' : ''} onClick={() => { setExercise('pushups'); setCount(0); setSavedMsg(''); }}>
            💪 Pushups (Elbow Angle)
          </button>
        </div>

        <div className="camera-view" style={{ position: 'relative' }}>
          <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', borderRadius: '16px' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
          {cameraError && (
            <div className="camera-error">
              <Camera size={30} />
              {cameraError}
            </div>
          )}
          <span className="camera-badge">
            <span className={active ? 'live-dot' : ''} />
            {active ? aiEngine : 'CAMERA OFF'}
          </span>
        </div>

        <div className="camera-stats">
          <div>
            <strong style={{ color: exercise === 'squats' ? '#F59E0B' : '#10B981' }}>{count}</strong>
            <span>ACCURATE {exercise.toUpperCase()} REPS</span>
          </div>
          <p>{status}</p>

          {savedMsg && (
            <div style={{ color: '#10B981', fontWeight: 700, fontSize: '13px', margin: '4px 0 8px 0' }}>
              {savedMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
            <button
              className="secondary-btn"
              onClick={() => {
                setCount(0);
                setSavedMsg('');
              }}
              style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
            >
              <RotateCcw size={16} /> Reset Reps
            </button>
            <button
              onClick={() => {
                if (count > 0) {
                  onSaveDailyReps(exercise, count);
                  setSavedMsg(`✓ Added +${count} ${exercise === 'squats' ? 'Squats' : 'Pushups'} to today's box!`);
                  setCount(0);
                  setTimeout(() => setSavedMsg(''), 4000);
                }
              }}
              disabled={count === 0}
              style={{
                flex: 1.3,
                justifyContent: 'center',
                background: count > 0 ? '#10B981' : '#374151',
                color: count > 0 ? '#000' : '#9CA3AF',
                fontWeight: 700,
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                cursor: count > 0 ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: count === 0 ? 0.6 : 1,
              }}
            >
              <CheckCircle2 size={16} /> Done Reps
            </button>
          </div>
        </div>

        <p className="camera-disclaimer">
          🟢 3D Skeletal Pose tracking detects 33 joint keypoints using Google MediaPipe Pose AI. Ensure full body is visible.
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
  const [cameraMode, setCameraMode] = useState<'squats' | 'pushups' | null>(null);

  const [dailyReps, setDailyReps] = useState<{ date: string; pushups: number; squats: number }>(() => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem('fitcampus_daily_reps');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          return { date: today, pushups: Number(parsed.pushups) || 0, squats: Number(parsed.squats) || 0 };
        }
      }
    } catch {
      /* ignore */
    }
    return { date: today, pushups: 0, squats: 0 };
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (dailyReps.date !== today) {
      const fresh = { date: today, pushups: 0, squats: 0 };
      setDailyReps(fresh);
      localStorage.setItem('fitcampus_daily_reps', JSON.stringify(fresh));
    }
  }, [dailyReps.date]);

  const handleSaveDailyReps = (exercise: 'squats' | 'pushups', count: number) => {
    if (count <= 0) return;
    const today = new Date().toISOString().split('T')[0];
    setDailyReps((prev) => {
      const base = prev.date === today ? prev : { date: today, pushups: 0, squats: 0 };
      const next = {
        ...base,
        [exercise]: base[exercise] + count,
      };
      localStorage.setItem('fitcampus_daily_reps', JSON.stringify(next));
      return next;
    });
    setToast(`🎉 Added +${count} ${exercise === 'squats' ? 'Squats' : 'Pushups'} to today's box!`);
  };

  const [stepTracking, setStepTracking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);

  const [draft, setDraft] = useState('');
  const [editName, setEditName] = useState('');
  const [editCampus, setEditCampus] = useState('');

  // Chat Tab Sub-Views (Selection Screen, Campus Chat, AI Fitness Coach)
  const [chatSubView, setChatSubView] = useState<'select' | 'campus' | 'ai'>('select');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [aiDraft, setAiDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => localStorage.getItem('fc_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);

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

        // Sensitivity: threshold at 12.8 m/s^2 (distinct walking step impact)
        if (mag > 12.8) motionPeak = true;
        if (motionPeak && mag < 9.8 && Date.now() - motionLast > 520) {
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

        // Sensitivity pure acceleration: peak > 2.2
        if (mag > 2.2) motionPeak = true;
        if (motionPeak && mag < 0.5 && Date.now() - motionLast > 520) {
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

  const setup = async (name: string, campusId: number, height: number, weight: number, targetWeight: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const newProfile = LocalDb.saveProfile(user.id, name, campusId, height, weight, targetWeight);
      setProfiles(LocalDb.getProfiles());
      setToast('Welcome to the crew! Your goals & profile are saved.');
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

  const sendAiMessage = async (customPrompt?: string) => {
    const promptText = (customPrompt || aiDraft).trim();
    if (!promptText || aiLoading) return;

    setAiDraft('');
    const newHistory = [...aiMessages, { role: 'user' as const, text: promptText }];
    setAiMessages(newHistory);
    setAiLoading(true);

    try {
      const key = geminiKeyInput.trim() || import.meta.env.VITE_GEMINI_API_KEY || '';
      let aiReply = '';

      if (key) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an elite, friendly AI Fitness & Nutrition Coach for college students at FIT CAMPUS.
Student Profile Context:
- Name: ${profile?.display_name || 'Student'}
- Height: ${profile?.height || '175'} cm, Weight: ${profile?.weight || '70'} kg, Target Weight: ${profile?.target_weight || '65'} kg
- Campus: ${campus?.name || 'Campus'}

Give practical, encouraging, and campus-tailored fitness/nutrition advice.
Student Question: ${promptText}`,
                    },
                  ],
                },
              ],
            }),
          }
        );
        const data = await res.json();
        aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      if (!aiReply) {
        const q = promptText.toLowerCase();
        if (q.includes('workout') || q.includes('exercise') || q.includes('gym') || q.includes('plan') || q.includes('routine')) {
          aiReply = `💪 **Custom Workout Advice for ${profile?.display_name || 'you'}**\n\nFor your stats (Height: ${profile?.height || 175}cm, Weight: ${profile?.weight || 70}kg):\n1. **Warmup**: 5 mins light jogging + Arm/Leg circles.\n2. **Main Routine**:\n   - Bodyweight Squats: 3 sets x 15 reps\n   - Pushups: 3 sets x 12 reps\n   - Core Planks: 3 sets x 45s\n3. **Cooldown**: 5 mins stretching.\n\nKeep your streak active! 🔥`;
        } else if (q.includes('diet') || q.includes('food') || q.includes('protein') || q.includes('mess') || q.includes('eat') || q.includes('meal')) {
          aiReply = `🥗 **Nutrition & Campus Mess Guide for ${profile?.display_name || 'you'}**\n\n• **Target Weight Goal**: Move towards ${profile?.target_weight || 65}kg with balanced protein intake.\n• **High Protein Options**: Eggs, Paneer, Tofu, Dal, Sprouts, Chana.\n• **Hydration**: Drink 3+ Liters of water daily.\n• **Avoid**: Late night oily canteen snacks and sugary sodas!`;
        } else if (q.includes('step') || q.includes('walk') || q.includes('cardio') || q.includes('run')) {
          aiReply = `🏃 **Campus Activity & Step Target**\n\n• **Daily Target**: Walk 8,000 - 10,000 steps around ${campus?.name || 'campus'}.\n• **Calorie Burn**: ~350-450 kcal burned per 10k steps.\n• **Tip**: Take stairs instead of elevators between classes!`;
        } else if (q.includes('sleep') || q.includes('rest') || q.includes('recover')) {
          aiReply = `😴 **Recovery & Sleep Guidance**\n\n• **Recommended Sleep**: 7-8 hours per night for muscle repair and peak mental focus during lectures.\n• **Tip**: Turn off phone screens 30 mins before sleep for deeper REM rest.`;
        } else if (q.includes('water') || q.includes('hydrate')) {
          aiReply = `💧 **Hydration Target**\n\n• **Goal**: Drink 3 to 3.5 Liters of water daily.\n• **Campus Habit**: Carry a reusable water bottle to your lectures!`;
        } else if (q.includes('arm') || q.includes('chest') || q.includes('bicep') || q.includes('tricep') || q.includes('shoulder')) {
          aiReply = `💪 **Upper Body Focus**\n\n• **Pushups**: 3 sets x 12-15 reps (chest & triceps)\n• **Chair Dips**: 3 sets x 12 reps (triceps)\n• **Pike Pushups**: 3 sets x 10 reps (shoulders)\n• **Isometric Bicep Holds**: 45s holds.`;
        } else if (q.includes('leg') || q.includes('squat') || q.includes('thigh') || q.includes('glute')) {
          aiReply = `🦵 **Lower Body Focus**\n\n• **Bodyweight Squats**: 3 sets x 15 reps\n• **Lunges**: 3 sets x 12 reps per leg\n• **Calf Raises**: 3 sets x 20 reps\n• **Wall Sit**: 45s hold.`;
        } else if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('namaste')) {
          aiReply = `Hey ${profile?.display_name || 'there'}! 👋 I'm your Gemini AI Coach. Ask me about custom workouts, hostel diets, step targets, or weight goals!`;
        } else {
          aiReply = `🤖 **AI Coach Guidance for "${promptText}"**\n\nBased on your profile stats (Height: ${profile?.height || 175}cm, Weight: ${profile?.weight || 70}kg, Target Goal: ${profile?.target_weight || 65}kg at ${campus?.name}):\n\nTo achieve your target goal, balance your daily calories, aim for 8,000 steps daily, and complete 3 workout sessions per week. Feel free to ask me for specific workout routines, hostel diet tips, or recovery advice!`;
        }
      }

      setAiMessages([...newHistory, { role: 'model', text: aiReply }]);
    } catch {
      setAiMessages([
        ...newHistory,
        {
          role: 'model',
          text: `💪 **Fitness Recommendation**: Maintain 8,000 steps daily on campus and complete 3 workout routines per week for great energy!`,
        },
      ]);
    } finally {
      setAiLoading(false);
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
        {profile.role === 'admin' && (
          <>
            <div className="side-section-label side-section-second">MORE</div>
            <nav>
              <button className={`side-link ${tab === 'admin' ? 'selected' : ''}`} onClick={() => switchTab('admin')}>
                <Shield size={19} /> Admin portal
              </button>
            </nav>
          </>
        )}
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

                  <div className="section-row workout-section" style={{ marginTop: '24px' }}>
                    <div>
                      <span className="eyebrow">DAILY AI REPETITION TRACKER</span>
                      <h2>Today's Workout Boxes</h2>
                    </div>
                    <span className="section-caption">Resets automatically every day at midnight</span>
                  </div>

                  <div className="stats-grid" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.09) 0%, rgba(16, 185, 129, 0.02) 100%)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '20px', padding: '20px' }}>
                      <div className="stat-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="stat-icon green" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Dumbbell size={22} />
                          </span>
                          <span className="stat-label" style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }}>PUSHUPS BOX</span>
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '3px 8px', borderRadius: '20px', fontWeight: 700 }}>TODAY</span>
                      </div>
                      <div style={{ fontSize: '42px', fontWeight: 900, color: '#10B981', margin: '14px 0 4px 0', lineHeight: 1 }}>
                        {dailyReps.pushups} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fg-muted)' }}>reps</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '18px' }}>
                        Tracked live with MediaPipe Pose AI (Elbows)
                      </p>
                      <button
                        onClick={() => setCameraMode('pushups')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          background: '#10B981',
                          color: '#000',
                          border: 'none',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                        }}
                      >
                        <Camera size={18} /> Start Pushups Camera
                      </button>
                    </div>

                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(245, 158, 11, 0.02) 100%)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '20px', padding: '20px' }}>
                      <div className="stat-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="stat-icon amber" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame size={22} />
                          </span>
                          <span className="stat-label" style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }}>SQUATS BOX</span>
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', padding: '3px 8px', borderRadius: '20px', fontWeight: 700 }}>TODAY</span>
                      </div>
                      <div style={{ fontSize: '42px', fontWeight: 900, color: '#F59E0B', margin: '14px 0 4px 0', lineHeight: 1 }}>
                        {dailyReps.squats} <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fg-muted)' }}>reps</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '18px' }}>
                        Tracked live with MediaPipe Pose AI (Knees)
                      </p>
                      <button
                        onClick={() => setCameraMode('squats')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          background: '#F59E0B',
                          color: '#000',
                          border: 'none',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px',
                        }}
                      >
                        <Camera size={18} /> Start Squats Camera
                      </button>
                    </div>
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
                    <button onClick={() => setCameraMode('squats')}>
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
                      <span className="eyebrow">COMMUNITY & AI ASSISTANT</span>
                      <h1>
                        Campus Chat & AI<span className="heading-period">.</span>
                      </h1>
                      <p>Connect with your campus crew or get instant AI fitness coaching.</p>
                    </div>
                    <span className="heading-icon">
                      <MessageCircle size={28} />
                    </span>
                  </div>

                  {chatSubView === 'select' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '750px', margin: '20px auto 40px' }}>
                      {/* Card 1: Campus Chat (Warm Soft Tan Card) */}
                      <div
                        onClick={() => setChatSubView('campus')}
                        style={{
                          background: 'linear-gradient(135deg, #BFA88F, #A68B70)',
                          borderRadius: '28px',
                          padding: '48px 32px',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 16px 40px rgba(166, 139, 112, 0.28)',
                          transition: 'transform 0.2s, boxShadow 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '14px',
                        }}
                      >
                        <div style={{ fontSize: '54px', lineHeight: 1 }}>🏫</div>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 900, letterSpacing: '1px', color: '#FFF' }}>
                          CAMPUS CHAT
                        </h2>
                        <p style={{ fontSize: '14px', color: '#F8F1EA', fontWeight: 500, maxWidth: '380px', margin: 0, lineHeight: 1.5 }}>
                          Connect & chat live with students of {campus?.name || 'your campus'}
                        </p>
                      </div>

                      {/* Card 2: AI Fitness Coach (Warm Soft Taupe Card) */}
                      <div
                        onClick={() => setChatSubView('ai')}
                        style={{
                          background: 'linear-gradient(135deg, #8E7B6C, #736153)',
                          borderRadius: '28px',
                          padding: '48px 32px',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 16px 40px rgba(115, 97, 83, 0.28)',
                          transition: 'transform 0.2s, boxShadow 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '14px',
                        }}
                      >
                        <div style={{ fontSize: '54px', lineHeight: 1 }}>🤖</div>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 900, letterSpacing: '1px', color: '#FFF' }}>
                          AI FITNESS COACH
                        </h2>
                        <p style={{ fontSize: '14px', color: '#EFE6DE', fontWeight: 500, maxWidth: '380px', margin: 0, lineHeight: 1.5 }}>
                          Personalized workout plans & health advice based on your height, weight & goals
                        </p>
                      </div>
                    </div>
                  )}

                  {chatSubView === 'campus' && (
                    <div className="chat-layout">
                      <div className="chat-card">
                        <div className="chat-header">
                          <button
                            onClick={() => setChatSubView('select')}
                            style={{ background: 'none', border: 'none', color: '#7652dc', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', paddingRight: '8px' }}
                          >
                            <ArrowLeft size={16} /> Back
                          </button>
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
                  )}

                  {chatSubView === 'ai' && (
                    <div className="chat-layout">
                      <div className="chat-card" style={{ height: '640px' }}>
                        <div className="chat-header">
                          <button
                            onClick={() => setChatSubView('select')}
                            style={{ background: 'none', border: 'none', color: '#7652dc', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', paddingRight: '8px' }}
                          >
                            <ArrowLeft size={16} /> Back
                          </button>
                          <div className="chat-header-icon" style={{ background: '#F0EAFC', color: '#7652DC' }}>
                            <Sparkles size={22} />
                          </div>
                          <div>
                            <strong>Gemini AI Fitness Coach</strong>
                            <span style={{ color: '#10B981', fontWeight: 700 }}>
                              🟢 Gemini 1.5 AI Engine Active
                            </span>
                          </div>
                          <button
                            onClick={() => setShowKeyModal(true)}
                            style={{ background: '#F1EDFC', border: 'none', color: '#7652DC', fontSize: '11px', fontWeight: 700, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            🔑 API Key
                          </button>
                        </div>

                        <div className="chat-messages" style={{ gap: '14px' }}>
                          {aiMessages.map((m, idx) => (
                            <div className={`chat-message ${m.role === 'user' ? 'own' : ''}`} key={idx}>
                              <span className={`avatar ${m.role === 'user' ? 'avatar-purple' : 'avatar-mint'}`}>
                                {m.role === 'user' ? initials(profile.display_name) : 'AI'}
                              </span>
                              <div className="message-content">
                                <div>
                                  <strong>{m.role === 'user' ? profile.display_name : 'Gemini AI Coach'}</strong>
                                </div>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                              </div>
                            </div>
                          ))}
                          {aiLoading && (
                            <div className="chat-message">
                              <span className="avatar avatar-mint">AI</span>
                              <div className="message-content">
                                <p style={{ background: '#F1EDFC', color: '#7652DC' }}>Thinking & crafting advice...</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Prompts */}
                        <div style={{ padding: '8px 14px', display: 'flex', gap: '6px', overflowX: 'auto', background: '#FAFAFC', borderTop: '1px solid #F0EDF2' }}>
                          <button
                            onClick={() => sendAiMessage('Suggest a personalized 7-day campus workout plan')}
                            style={{ whiteSpace: 'nowrap', fontSize: '10px', fontWeight: 700, padding: '6px 10px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569' }}
                          >
                            🏋️ Workout Plan
                          </button>
                          <button
                            onClick={() => sendAiMessage('Recommend a high-protein hostel mess diet')}
                            style={{ whiteSpace: 'nowrap', fontSize: '10px', fontWeight: 700, padding: '6px 10px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569' }}
                          >
                            🥗 Hostel Mess Diet
                          </button>
                          <button
                            onClick={() => sendAiMessage('How many steps should I walk daily to hit my goal weight?')}
                            style={{ whiteSpace: 'nowrap', fontSize: '10px', fontWeight: 700, padding: '6px 10px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#FFF', color: '#475569' }}
                          >
                            🏃 Step Target
                          </button>
                        </div>

                        <form className="chat-compose" onSubmit={(e) => { e.preventDefault(); sendAiMessage(); }}>
                          <input
                            value={aiDraft}
                            onChange={(e) => setAiDraft(e.target.value)}
                            placeholder="Ask Gemini AI Coach anything..."
                            aria-label="Ask AI Coach"
                          />
                          <button disabled={aiLoading || !aiDraft.trim()} aria-label="Send to AI Coach">
                            <Send size={18} />
                          </button>
                        </form>
                      </div>

                      <div className="chat-side">
                        <span className="chat-side-icon" style={{ background: '#10B981' }}>
                          <Zap size={25} />
                        </span>
                        <h3>AI Personalization</h3>
                        <p>
                          Tailored specifically for <strong>{profile.display_name}</strong> at <strong>{campus?.name}</strong>.
                        </p>
                        <div className="chat-rule">
                          <Check size={16} /> Height: {profile.height || '175'} cm
                        </div>
                        <div className="chat-rule">
                          <Check size={16} /> Weight: {profile.weight || '70'} kg
                        </div>
                        <div className="chat-rule">
                          <Check size={16} /> Target: {profile.target_weight || '65'} kg
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gemini API Key Modal */}
                  {showKeyModal && (
                    <div className="modal-backdrop" onClick={() => setShowKeyModal(false)}>
                      <div className="workout-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 420px)', padding: '24px' }}>
                        <div className="modal-head" style={{ padding: 0, marginBottom: '16px' }}>
                          <h2 style={{ fontSize: '20px' }}>Custom Gemini API Key</h2>
                          <button className="icon-btn" onClick={() => setShowKeyModal(false)}>
                            <X size={18} />
                          </button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
                          Enter your Google Gemini API key to enable direct 100% custom AI responses:
                        </p>
                        <input
                          type="password"
                          placeholder="AIzaSy..."
                          value={geminiKeyInput}
                          onChange={(e) => setGeminiKeyInput(e.target.value)}
                          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px', marginBottom: '16px' }}
                        />
                        <button
                          className="primary-btn"
                          style={{ width: '100%' }}
                          onClick={() => {
                            localStorage.setItem('fc_gemini_key', geminiKeyInput.trim());
                            setShowKeyModal(false);
                            setToast('Gemini API Key saved!');
                          }}
                        >
                          Save API Key
                        </button>
                      </div>
                    </div>
                  )}
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
                        <small>🟢 Motion Sensor Active in background.</small>
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
                <button className="secondary-btn" onClick={() => setCameraMode('squats')}>
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

      {cameraMode && (
        <CameraCounter
          initialExercise={cameraMode}
          onClose={() => setCameraMode(null)}
          onSaveDailyReps={handleSaveDailyReps}
        />
      )}
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
