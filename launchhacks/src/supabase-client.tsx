import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pgndwjjhyuqjbjzybifd.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbmR3ampoeXVxamJqenliaWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MzIwNDMsImV4cCI6MjA3MDMwODA0M30.6AdUqO3uSpuvLppchVAShu5SZzwpUQiWMQuml9-ps7w";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
