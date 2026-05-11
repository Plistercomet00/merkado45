import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Plus, Pencil, Trash2, X } from "lucide-react";
import { CATEGORIAS, supabase, type Produto } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin — Merkado empório 45" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function AdminPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return userEmail ? <Painel email={userEmail} /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setCarregando(false);
    if (error) setErro(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <form onSubmit={entrar} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <Logo size="md" />
          <p className="text-sm text-muted-foreground mt-2">Painel administrativo</p>
        </div>
        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
        />
        <label className="block text-sm font-medium mb-1">Senha</label>
        <input
          type="password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full h-12 px-3 mb-4 rounded-lg border border-input bg-background text-base"
        />
        {erro && <p className="text-sm text-destructive mb-3">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full min-h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-60"
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

type FormState = {
  id?: string;
  nome: string;
  descricao: string;
  preco_100g: string;
  preco_kg: string;
  categoria: string;
  imagem_url: string;
  disponivel: boolean;
};

const FORM_VAZIO: FormState = {
  nome: "",
  descricao: "",
  preco_100g: "",
  preco_kg: "",
  categoria: CATEGORIAS[0],
  imagem_url: "",
  disponivel: true,
};

function Painel({ email }: { email: string }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<FormState | null>(null);

  async function carregar() {
    setLoading(true);
    const { data } = await supabase.from("produtos").select("*").order("created_at", { ascending: false });
    setProdutos((data as Produto[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(form: FormState) {
    const payload = {
      nome: form.nome,
      descricao: form.descricao || null,
      preco_100g: form.preco_100g ? Number(form.preco_100g.replace(",", ".")) : null,
      preco_kg: form.preco_kg ? Number(form.preco_kg.replace(",", ".")) : null,
      categoria: form.categoria,
      imagem_url: form.imagem_url || null,
      disponivel: form.disponivel,
    };
    if (form.id) {
      await supabase.from("produtos").update(payload).eq("id", form.id);
    } else {
      await supabase.from("produtos").insert(payload);
    }
    setEditando(null);
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("produtos").delete().eq("id", id);
    carregar();
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <Logo size="sm" />
            <p className="text-xs text-muted-foreground mt-1 truncate">{email}</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="min-h-12 px-4 inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando…</p>
        ) : produtos.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Nenhum produto cadastrado. Toque em + para adicionar.
          </p>
        ) : (
          <ul className="space-y-2">
            {produtos.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                  {p.imagem_url && <img src={p.imagem_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.categoria}
                    {p.preco_100g != null && ` · 100g R$ ${Number(p.preco_100g).toFixed(2).replace(".", ",")}`}
                    {p.preco_kg != null && ` · 1kg R$ ${Number(p.preco_kg).toFixed(2).replace(".", ",")}`}
                    {!p.disponivel && " · oculto"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditando({
                      id: p.id,
                      nome: p.nome,
                      descricao: p.descricao ?? "",
                      preco_100g: p.preco_100g != null ? String(p.preco_100g) : "",
                      preco_kg: p.preco_kg != null ? String(p.preco_kg) : "",
                      categoria: p.categoria,
                      imagem_url: p.imagem_url ?? "",
                      disponivel: p.disponivel,
                    })
                  }
                  className="min-h-12 min-w-12 flex items-center justify-center rounded-full hover:bg-secondary"
                  aria-label="Editar"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => excluir(p.id)}
                  className="min-h-12 min-w-12 flex items-center justify-center rounded-full hover:bg-destructive/10 text-destructive"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <button
        onClick={() => setEditando(FORM_VAZIO)}
        className="fixed bottom-5 right-5 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
        aria-label="Adicionar produto"
      >
        <Plus className="h-7 w-7" />
      </button>

      {editando && <FormModal initial={editando} onClose={() => setEditando(null)} onSave={salvar} />}
    </div>
  );
}

function FormModal({
  initial,
  onClose,
  onSave,
}: {
  initial: FormState;
  onClose: () => void;
  onSave: (f: FormState) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [salvando, setSalvando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await onSave(form);
    setSalvando(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center">
      <form
        onSubmit={submit}
        className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{form.id ? "Editar produto" : "Novo produto"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 min-w-12 flex items-center justify-center rounded-full hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block text-sm font-medium mb-1">Nome</label>
        <input
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
        />

        <label className="block text-sm font-medium mb-1">Categoria</label>
        <select
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium mb-1">Preço 100g (R$)</label>
        <input
          inputMode="decimal"
          placeholder="0,00"
          value={form.preco_100g}
          onChange={(e) => setForm({ ...form, preco_100g: e.target.value })}
          className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
        />

        <label className="block text-sm font-medium mb-1">Preço 1kg (R$)</label>
        <input
          inputMode="decimal"
          placeholder="0,00"
          value={form.preco_kg}
          onChange={(e) => setForm({ ...form, preco_kg: e.target.value })}
          className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
        />

        <label className="block text-sm font-medium mb-1">URL da imagem</label>
        <input
          type="url"
          placeholder="https://…"
          value={form.imagem_url}
          onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
          className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
        />

        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          rows={4}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-full p-3 mb-3 rounded-lg border border-input bg-background text-base"
        />

        <label className="flex items-center gap-2 mb-5 min-h-12">
          <input
            type="checkbox"
            checked={form.disponivel}
            onChange={(e) => setForm({ ...form, disponivel: e.target.checked })}
            className="h-5 w-5"
          />
          <span className="text-sm">Disponível na vitrine</span>
        </label>

        <button
          type="submit"
          disabled={salvando}
          className="w-full min-h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
}
