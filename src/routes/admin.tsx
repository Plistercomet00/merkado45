import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { LogOut, Plus, Pencil, Trash2, X, Search } from "lucide-react";
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
  categoria: string;
  imagem_url: string;
  disponivel: boolean;
  preco_100g: string;
  preco_kg: string;
  preco_unidade: string;
  peso_embalagem: string;
};

const FORM_VAZIO: FormState = {
  nome: "",
  descricao: "",
  categoria: CATEGORIAS[0],
  imagem_url: "",
  disponivel: true,
  preco_100g: "",
  preco_kg: "",
  preco_unidade: "",
  peso_embalagem: "",
};

function Painel({ email }: { email: string }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<FormState | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("Todos");

  async function carregar() {
    setLoading(true);
    const { data } = await supabase.from("produtos").select("*").order("created_at", { ascending: false });
    setProdutos((data as Produto[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    return produtos.filter((p) => {
      const okCat = categoria === "Todos" || p.categoria === categoria;
      const okBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
      return okCat && okBusca;
    });
  }, [produtos, categoria, busca]);

  async function salvar(form: FormState) {
    const payload: Record<string, unknown> = {
      nome: form.nome,
      descricao: form.descricao || null,
      categoria: form.categoria,
      imagem_url: form.imagem_url || null,
      disponivel: form.disponivel,
      preco_100g: null,
      preco_kg: null,
      preco_unidade: null,
      peso_embalagem: null,
    };

    if (form.categoria === "Naturais") {
      payload.preco_100g = form.preco_100g ? Number(form.preco_100g.replace(",", ".")) : null;
      payload.preco_kg = form.preco_kg ? Number(form.preco_kg.replace(",", ".")) : null;
    } else if (form.categoria === "Frigorífico") {
      payload.preco_kg = form.preco_kg ? Number(form.preco_kg.replace(",", ".")) : null;
    } else if (form.categoria === "Suplementos") {
      payload.peso_embalagem = form.peso_embalagem || null;
      payload.preco_unidade = form.preco_unidade ? Number(form.preco_unidade.replace(",", ".")) : null;
    }

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

  function precoLabel(p: Produto) {
    if (p.categoria === "Naturais") {
      const parts = [];
      if (p.preco_100g != null) parts.push(`100g R$ ${Number(p.preco_100g).toFixed(2).replace(".", ",")}`);
      if (p.preco_kg != null) parts.push(`1kg R$ ${Number(p.preco_kg).toFixed(2).replace(".", ",")}`);
      return parts.join(" · ");
    }
    if (p.categoria === "Frigorífico") {
      return p.preco_kg != null ? `1kg R$ ${Number(p.preco_kg).toFixed(2).replace(".", ",")}` : "";
    }
    if (p.categoria === "Suplementos") {
      const parts = [];
      if (p.peso_embalagem) parts.push(p.peso_embalagem);
      if (p.preco_unidade != null) parts.push(`R$ ${Number(p.preco_unidade).toFixed(2).replace(".", ",")}`);
      return parts.join(" · ");
    }
    return "";
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
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full h-12 pl-10 pr-4 text-base rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-4 pb-1">
          {(["Todos", ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`flex-shrink-0 min-h-10 px-4 rounded-full text-sm font-semibold transition-colors ${
                categoria === c
                  ? c === "Naturais"
                    ? "bg-[#2d7a1f] text-white"
                    : c === "Frigorífico"
                      ? "bg-[#c1393b] text-white"
                      : c === "Suplementos"
                        ? "bg-[#e8a020] text-white"
                        : "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {filtrados.length} produto{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        </p>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado.</p>
        ) : (
          <ul className="space-y-2">
            {filtrados.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                  {p.imagem_url && <img src={p.imagem_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-white text-xs font-bold mr-1 ${
                        p.categoria === "Naturais"
                          ? "bg-[#2d7a1f]"
                          : p.categoria === "Frigorífico"
                            ? "bg-[#c1393b]"
                            : "bg-[#e8a020]"
                      }`}
                    >
                      {p.categoria}
                    </span>
                    {precoLabel(p)}
                    {!p.disponivel && " · oculto"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditando({
                      id: p.id,
                      nome: p.nome,
                      descricao: p.descricao ?? "",
                      categoria: p.categoria,
                      imagem_url: p.imagem_url ?? "",
                      disponivel: p.disponivel,
                      preco_100g: p.preco_100g != null ? String(p.preco_100g) : "",
                      preco_kg: p.preco_kg != null ? String(p.preco_kg) : "",
                      preco_unidade: p.preco_unidade != null ? String(p.preco_unidade) : "",
                      peso_embalagem: p.peso_embalagem ?? "",
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
          className="w-full h-12 px-3 mb-4 rounded-lg border border-input bg-background text-base"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* CAMPOS DINÂMICOS POR CATEGORIA */}

        {form.categoria === "Naturais" && (
          <>
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
          </>
        )}

        {form.categoria === "Frigorífico" && (
          <>
            <label className="block text-sm font-medium mb-1">Preço por kg (R$)</label>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={form.preco_kg}
              onChange={(e) => setForm({ ...form, preco_kg: e.target.value })}
              className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
            />
          </>
        )}

        {form.categoria === "Suplementos" && (
          <>
            <label className="block text-sm font-medium mb-1">Peso da embalagem</label>
            <input
              placeholder="ex: 900g, 2kg, 60 cápsulas"
              value={form.peso_embalagem}
              onChange={(e) => setForm({ ...form, peso_embalagem: e.target.value })}
              className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
            />
            <label className="block text-sm font-medium mb-1">Preço por unidade (R$)</label>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={form.preco_unidade}
              onChange={(e) => setForm({ ...form, preco_unidade: e.target.value })}
              className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
            />
          </>
        )}

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
