import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use relative proxy URL in the browser to bypass ISP DPI blocking,
// but use the absolute URL on the server since Node.js requires absolute URLs.
const isBrowser = typeof window !== 'undefined';
const clientUrl = isBrowser ? `${window.location.origin}/supabase-api` : supabaseUrl;

export const supabase = createClient(clientUrl, supabaseAnonKey);
