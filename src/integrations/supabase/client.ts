import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://penquqyosjfiosowovye.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbnF1cXlvc2pmaW9zb3dvdnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDM3NTMsImV4cCI6MjA5NDAxOTc1M30.myTUuUTA-2EJQtZRt9YXkWyX0QhwvlDU_04uAV1JSxs";

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  imagem_url: string | null;
  disponivel: boolean;
  created_at: string;
};

export const CATEGORIAS = [
  "Bebidas",
  "Mercearia",
  "Hortifruti",
  "Padaria",
  "Laticínios",
  "Limpeza",
  "Outros",
] as const;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export const WHATSAPP_NUMBER = "5581984881580";

export function whatsappLinkForProduct(nome: string, preco: number) {
  const msg = `Olá! Tenho interesse no produto: *${nome}* (R$ ${preco
    .toFixed(2)
    .replace(".", ",")}). Está disponível?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}