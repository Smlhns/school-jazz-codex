const schoolJazzSupabaseUrl = "https://lerlnnuhjgesznlaeuef.supabase.co";
const schoolJazzSupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcmxubnVoamdlc3pubGFldWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTQ2NDcsImV4cCI6MjA5NjU5MDY0N30.1_fJxL1zbFvr6rAbpz0QCC_00dH-l3z_MTw8Z8ZPomk";

window.schoolJazzSupabase = window.supabase
  ? window.supabase.createClient(schoolJazzSupabaseUrl, schoolJazzSupabaseAnonKey)
  : null;
