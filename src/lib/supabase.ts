import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ibrthfhnjepuzucgxctp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xKVV1RBIPd_J0p5yhiPO7w_AXYXvCvO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SavedTrip {
  id: string;
  user_id: string;
  title: string;
  duration: number | null;
  budget: 'budget' | 'mid' | 'luxury' | null;
  itinerary: Record<string, unknown>;
  created_at: string;
}
