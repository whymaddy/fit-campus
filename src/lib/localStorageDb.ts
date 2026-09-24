/**
 * FIT CAMPUS Local Database & Auth System
 * Stores all campuses, workouts, challenges, profiles, activity logs, chat messages, and auth sessions in localStorage.
 */

export interface Campus {
  id: number;
  name: string;
  location: string;
}

export interface Workout {
  id: number;
  title: string;
  category: string;
  duration: number;
  calories: number;
  xp: number;
  description: string;
  accent: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  target: number;
  xp: number;
  icon: string;
}

export interface Profile {
  id: number;
  user_id: string;
  display_name: string;
  campus_id: number;
  xp: number;
  steps: number;
  streak: number;
  role: string;
}

export interface Log {
  id: number;
  user_id: string;
  type: string;
  workout_id: number | null;
  steps: number;
  xp: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_id: string;
  display_name: string;
  campus_id: number;
  body: string;
  created_at: string;
}

export interface LocalUser {
  id: string;
  email: string;
  password?: string;
  created_at: string;
}

// Initial Mock Seed Data
export const INITIAL_CAMPUSES: Campus[] = [
  { id: 1, name: "Poornima Institute of Engineering and Technology", location: "Jaipur" },
  { id: 2, name: "Poornima College of Engineering", location: "Jaipur" },
  { id: 3, name: "Poornima University", location: "Jaipur" },
  { id: 4, name: "SKIT Jaipur", location: "Jaipur" },
  { id: 5, name: "VGU Jaipur", location: "Jaipur" },
  { id: 6, name: "JECRC Jaipur", location: "Jaipur" },
];

export const INITIAL_WORKOUTS: Workout[] = [
  {
    id: 1,
    title: "Core & Chest Push-Up Blitz",
    category: "Strength",
    duration: 15,
    calories: 140,
    xp: 50,
    description: "Build upper body power with bodyweight push-up variations.",
    accent: "purple",
  },
  {
    id: 2,
    title: "Campus Perimeter 3K Run",
    category: "Cardio",
    duration: 20,
    calories: 220,
    xp: 60,
    description: "Sustained outdoor run around college athletic grounds.",
    accent: "coral",
  },
  {
    id: 3,
    title: "Dorm Room Lower Body Squats",
    category: "Strength",
    duration: 15,
    calories: 150,
    xp: 50,
    description: "Quads, hamstrings, and glute burnout session.",
    accent: "mint",
  },
  {
    id: 4,
    title: "HIIT Jumping Jacks & Burpees",
    category: "Cardio",
    duration: 12,
    calories: 180,
    xp: 55,
    description: "High-intensity cardiovascular stamina booster.",
    accent: "yellow",
  },
];

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: "10,000 Steps Daily Campus Sprint",
    description: "Hit 10,000 steps daily for 5 days in a row to earn bonus XP!",
    target: 10000,
    xp: 250,
    icon: "footprints",
  },
  {
    id: 2,
    title: "100 Push-Up Camera Challenge",
    description: "Complete 100 push-ups using the AI camera rep counter.",
    target: 100,
    xp: 300,
    icon: "camera",
  },
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 1,
    user_id: "demo_user_1",
    display_name: "Aarav Sharma",
    campus_id: 1,
    xp: 1250,
    steps: 24500,
    streak: 8,
    role: "student",
  },
  {
    id: 2,
    user_id: "demo_user_2",
    display_name: "Priya Verma",
    campus_id: 1,
    xp: 980,
    steps: 19200,
    streak: 5,
    role: "student",
  },
  {
    id: 3,
    user_id: "demo_user_3",
    display_name: "Rohan Gupta",
    campus_id: 4,
    xp: 840,
    steps: 16500,
    streak: 4,
    role: "student",
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    user_id: "demo_user_1",
    display_name: "Aarav Sharma",
    campus_id: 1,
    body: "Hey campus crew! Anyone up for evening running session around PIET grounds? 🏃‍♂️",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    user_id: "demo_user_2",
    display_name: "Priya Verma",
    campus_id: 1,
    body: "Count me in! Just completed 6,000 steps today.",
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

// Helper functions for localStorage reading & writing
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("localStorage error:", err);
  }
}

export const LocalDb = {
  // Campuses
  getCampuses: (): Campus[] => getItem("fc_campuses", INITIAL_CAMPUSES),
  addCampus: (name: string, location: string): Campus => {
    const list = LocalDb.getCampuses();
    const newCampus: Campus = { id: Date.now(), name, location };
    const updated = [...list, newCampus];
    setItem("fc_campuses", updated);
    return newCampus;
  },
  deleteCampus: (id: number) => {
    const updated = LocalDb.getCampuses().filter((c) => c.id !== id);
    setItem("fc_campuses", updated);
  },

  // Workouts
  getWorkouts: (): Workout[] => getItem("fc_workouts", INITIAL_WORKOUTS),
  addWorkout: (w: Omit<Workout, "id">): Workout => {
    const list = LocalDb.getWorkouts();
    const newW: Workout = { ...w, id: Date.now() };
    const updated = [...list, newW];
    setItem("fc_workouts", updated);
    return newW;
  },
  deleteWorkout: (id: number) => {
    const updated = LocalDb.getWorkouts().filter((w) => w.id !== id);
    setItem("fc_workouts", updated);
  },

  // Challenges
  getChallenges: (): Challenge[] => getItem("fc_challenges", INITIAL_CHALLENGES),
  addChallenge: (ch: Omit<Challenge, "id">): Challenge => {
    const list = LocalDb.getChallenges();
    const newCh: Challenge = { ...ch, id: Date.now() };
    const updated = [...list, newCh];
    setItem("fc_challenges", updated);
    return newCh;
  },
  deleteChallenge: (id: number) => {
    const updated = LocalDb.getChallenges().filter((c) => c.id !== id);
    setItem("fc_challenges", updated);
  },

  // Users & Auth
  getUsers: (): LocalUser[] => getItem("fc_users", []),
  findUserByEmail: (email: string): LocalUser | undefined => {
    const users = LocalDb.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  createUser: (email: string, password?: string): LocalUser => {
    const users = LocalDb.getUsers();
    const newUser: LocalUser = {
      id: "usr_" + Math.random().toString(36).slice(2, 9),
      email: email.toLowerCase(),
      password,
      created_at: new Date().toISOString(),
    };
    setItem("fc_users", [...users, newUser]);
    return newUser;
  },
  updateUserPassword: (email: string, newPassword?: string) => {
    const users = LocalDb.getUsers().map((u) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    setItem("fc_users", users);
  },

  // Profiles
  getProfiles: (): Profile[] => getItem("fc_profiles", INITIAL_PROFILES),
  getProfileByUserId: (userId: string): Profile | undefined => {
    return LocalDb.getProfiles().find((p) => p.user_id === userId);
  },
  saveProfile: (userId: string, displayName: string, campusId: number): Profile => {
    const profiles = LocalDb.getProfiles();
    const existing = profiles.find((p) => p.user_id === userId);
    if (existing) {
      const updated = profiles.map((p) =>
        p.user_id === userId
          ? { ...p, display_name: displayName, campus_id: campusId }
          : p
      );
      setItem("fc_profiles", updated);
      return { ...existing, display_name: displayName, campus_id: campusId };
    } else {
      const newProfile: Profile = {
        id: Date.now(),
        user_id: userId,
        display_name: displayName,
        campus_id: campusId,
        xp: 150,
        steps: 0,
        streak: 1,
        role: displayName.toLowerCase().includes("admin") ? "admin" : "student",
      };
      setItem("fc_profiles", [...profiles, newProfile]);
      return newProfile;
    }
  },
  updateProfileStats: (userId: string, xpToAdd: number, stepsToAdd: number) => {
    const profiles = LocalDb.getProfiles().map((p) => {
      if (p.user_id === userId) {
        return {
          ...p,
          xp: (p.xp || 0) + xpToAdd,
          steps: (p.steps || 0) + stepsToAdd,
        };
      }
      return p;
    });
    setItem("fc_profiles", profiles);
  },

  // Logs
  getLogs: (userId?: string): Log[] => {
    const logs: Log[] = getItem("fc_logs", []);
    return userId ? logs.filter((l) => l.user_id === userId) : logs;
  },
  addLog: (userId: string, type: string, workoutId: number | null, steps: number, xp: number): Log => {
    const logs = getItem<Log[]>("fc_logs", []);
    const newLog: Log = {
      id: Date.now(),
      user_id: userId,
      type,
      workout_id: workoutId,
      steps,
      xp,
      created_at: new Date().toISOString(),
    };
    setItem("fc_logs", [newLog, ...logs]);
    LocalDb.updateProfileStats(userId, xp, steps);
    return newLog;
  },

  // Messages
  getMessages: (campusId?: number): ChatMessage[] => {
    const msgs: ChatMessage[] = getItem("fc_messages", INITIAL_MESSAGES);
    return campusId ? msgs.filter((m) => m.campus_id === campusId) : msgs;
  },
  addMessage: (userId: string, displayName: string, campusId: number, body: string): ChatMessage => {
    const msgs = getItem<ChatMessage[]>("fc_messages", INITIAL_MESSAGES);
    const newMsg: ChatMessage = {
      id: Date.now(),
      user_id: userId,
      display_name: displayName,
      campus_id: campusId,
      body,
      created_at: new Date().toISOString(),
    };
    setItem("fc_messages", [...msgs, newMsg]);
    return newMsg;
  },
  deleteMessage: (id: number) => {
    const msgs = getItem<ChatMessage[]>("fc_messages", INITIAL_MESSAGES).filter((m) => m.id !== id);
    setItem("fc_messages", msgs);
  },

  // Password Reset Codes (OTP Store)
  saveResetCode: (email: string, code: string) => {
    const resetStore = getItem<Record<string, { code: string; expires: number }>>("fc_reset_codes", {});
    resetStore[email.toLowerCase()] = {
      code,
      expires: Date.now() + 15 * 60 * 1000, // 15 mins
    };
    setItem("fc_reset_codes", resetStore);
  },
  verifyResetCode: (email: string, code: string): boolean => {
    const resetStore = getItem<Record<string, { code: string; expires: number }>>("fc_reset_codes", {});
    const record = resetStore[email.toLowerCase()];
    if (!record) return false;
    if (Date.now() > record.expires) return false;
    return record.code === code.trim();
  },
};
