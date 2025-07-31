import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytlrpcehkhhdzprsezks.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0bHJwY2Voa2hoZHpwcnNlemtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDE4MjIsImV4cCI6MjA2OTQ3NzgyMn0.aZmnKmGuk62mvraJd3SdXIHMylKqY3nN8DXBQHC1LIM';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;