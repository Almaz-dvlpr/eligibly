import AuthForm from "@/components/AuthForm";
import Setup from "@/components/Setup";
import { supabaseConfigured } from "@/lib/supabase/env";

export default function Register() { return supabaseConfigured() ? <AuthForm mode="register" /> : <Setup />; }
