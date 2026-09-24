import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LocalDb, type LocalUser } from '../lib/localStorageDb';
import { getSupabase } from '../lib/supabase';
import { handleGoogleRedirect, signInWithGoogle } from '../lib/googleAuth';

interface AppUser {
  id: string;
  email: string;
}

interface AppSession {
  access_token: string;
  user: AppUser;
}

type AuthValue = {
  user: AppUser | null;
  session: AppSession | null;
  loading: boolean;
  error: string;
  signUp: (email: string, password?: string) => Promise<void>;
  signInWithPassword: (email: string, password?: string) => Promise<void>;
  signInWithGoogleAuth: () => Promise<void>;
  sendForgotPasswordCode: (email: string) => Promise<{ code: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  loading: true,
  error: '',
  signUp: async () => {},
  signInWithPassword: async () => {},
  signInWithGoogleAuth: async () => {},
  sendForgotPasswordCode: async () => ({ code: '' }),
  resetPasswordWithCode: async () => {},
  signOut: async () => {},
});

const AUTH_STORAGE_KEY = 'fc_local_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function initAuth() {
      try {
        await handleGoogleRedirect();
        const client = await getSupabase();
        if (client) {
          const { data } = await client.auth.getSession();
          if (data.session && active) {
            setSession({
              access_token: data.session.access_token,
              user: { id: data.session.user.id, email: data.session.user.email || '' },
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        /* fallback to local storage */
      }

      // Check local storage session
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.user && active) {
              setSession(parsed);
              setLoading(false);
              return;
            }
          } catch {
            /* invalid stored session */
          }
        }
      }

      if (active) setLoading(false);
    }

    initAuth();
  }, []);

  const saveLocalSession = (usr: LocalUser) => {
    const sess: AppSession = {
      access_token: 'local_token_' + Date.now(),
      user: { id: usr.id, email: usr.email },
    };
    setSession(sess);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sess));
    }
  };

  const signUp = async (email: string, password?: string) => {
    setError('');
    // Remote Supabase attempt if configured
    const client = await getSupabase();
    if (client) {
      const { error: authErr } = await client.auth.signUp({ email, password: password || 'password123' });
      if (authErr) throw authErr;
    }
    // Save to local DB
    let user = LocalDb.findUserByEmail(email);
    if (!user) {
      user = LocalDb.createUser(email, password);
    }
    saveLocalSession(user);
  };

  const signInWithPassword = async (email: string, password?: string) => {
    setError('');
    // Remote Supabase attempt if configured
    const client = await getSupabase();
    if (client) {
      const { data, error: authErr } = await client.auth.signInWithPassword({
        email,
        password: password || 'password123',
      });
      if (!authErr && data.session) {
        setSession({
          access_token: data.session.access_token,
          user: { id: data.session.user.id, email: data.session.user.email || '' },
        });
        return;
      }
    }

    // Local DB authentication
    let user = LocalDb.findUserByEmail(email);
    if (!user) {
      // Create user automatically on first sign-in if credentials provided
      user = LocalDb.createUser(email, password);
    } else if (user.password && password && user.password !== password) {
      throw new Error('Incorrect password. Please try again or reset your password.');
    }
    saveLocalSession(user);
  };

  const signInWithGoogleAuth = async () => {
    await signInWithGoogle((googleUser) => {
      let user = LocalDb.findUserByEmail(googleUser.email);
      if (!user) {
        user = LocalDb.createUser(googleUser.email, 'google_authenticated');
      }
      saveLocalSession(user);
    });
  };

  const sendForgotPasswordCode = async (email: string) => {
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    LocalDb.saveResetCode(email, code);
    return { code };
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword?: string) => {
    const isValid = LocalDb.verifyResetCode(email, code);
    if (!isValid) throw new Error('Invalid or expired 6-digit verification code.');

    LocalDb.updateUserPassword(email, newPassword || 'password123');
    let user = LocalDb.findUserByEmail(email);
    if (!user) {
      user = LocalDb.createUser(email, newPassword);
    }
    saveLocalSession(user);
  };

  const signOut = async () => {
    try {
      const client = await getSupabase();
      if (client) await client.auth.signOut();
    } catch {
      /* ignore */
    }
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        error,
        signUp,
        signInWithPassword,
        signInWithGoogleAuth,
        sendForgotPasswordCode,
        resetPasswordWithCode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
