// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validación
if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL no encontrada. Revisa tu archivo .env");
if (!supabaseAnonKey) throw new Error("VITE_SUPABASE_ANON_KEY no encontrada. Revisa tu archivo .env");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);