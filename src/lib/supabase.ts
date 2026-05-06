import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oqamrudznerdfjrjsyej.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYW1ydWR6bmVyZGZqcmpzeWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODgwODAsImV4cCI6MjA5MzY2NDA4MH0.zqZgZWNbDaQfZ0IqBoaQV412vZaP58obvIumxqtk45Y';

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
