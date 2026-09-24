import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (instance) return instance;
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      if (config.url && config.anonKey) {
        instance = createClient(config.url, config.anonKey);
        return instance;
      }
    }
  } catch (err) {
    console.warn("Supabase remote config not active, using local engine fallback.", err);
  }
  return null;
}
