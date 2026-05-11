import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MessageCircle, Instagram, MapPin, Clock, Leaf, Beef, Pill, Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";
import {
  CATEGORIAS,
  supabase,
  whatsappGeneralLink,
  type Produto,
} from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Merkado empório 45 — Vitrine" },
      {
        name: "description",
        content:
          "Veja os produtos do Merkado empório 45 e peça pelo WhatsApp.",
      },
    ],
  }),
});

function Index() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState<string>("Todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("disponivel", true)
        .order("created_at", { ascending: false });
      if (!ativo) return;
      if (!error && data) setProdutos(data as Produto[]);
      setLoading(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    return produtos.filter((p) => {
      const okCat = categoria === "Todos" || p.categoria === categoria;
      const okBusca =
        !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
      return okCat && okBusca;
    });
  }, [produtos, categoria, busca]);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const categoryCards = [
    { nome: "Naturais", titulo: "Produtos Naturais", bg: "bg-secondary", Icon: Leaf },
    { nome: "Frigorífico", titulo: "Frigorífico", bg: "bg-brand-meat", Icon: Beef },
    { nome: "Suplementos", titulo: "Suplementos", bg: "bg-brand-supp", Icon: Pill },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER fixo compacto */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl h-full px-4 flex items-center justify-between">
          <Link to="/" aria-label="Início">
            <Logo size="sm" />
          </Link>
          <a
            href={whatsappGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm active:scale-95 transition-transform"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </header>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-3xl px-4 pt-6 pb-10">
        <div className="grid grid-cols-1 gap-3">
          {categoryCards.map(({ nome, titulo, bg, Icon }) => (
            <button
              key={nome}
              onClick={() => {
                setCategoria(nome);
                setTimeout(() => scrollTo("vitrine"), 30);
              }}
              className={`${bg} text-white rounded-2xl p-5 min-h-[88px] flex items-center justify-between text-left shadow-md active:scale-[0.98] transition-transform`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Nossas especialidades
                </p>
                <p className="text-lg font-extrabold mt-0.5">{titulo}</p>
              </div>
              <Icon className="h-10 w-10 opacity-90" />
            </button>
          ))}
        </div>
      </section>

      {/* VITRINE */}
      <section id="vitrine" className="mx-auto max-w-3xl px-4 pb-12 scroll-mt-16">
        <h2 className="text-xl font-bold mb-3">Nossos produtos</h2>

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

        <div className="flex flex-wrap gap-2 mb-4">
          {(["Todos", ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`min-h-12 px-5 rounded-full text-base font-semibold transition-colors ${
                categoria === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando produtos…</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-card border border-border">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3">
            {filtrados.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl bg-card border border-border p-4 shadow-sm"
              >
                <span className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {p.categoria}
                </span>
                <h3 className="mt-2 text-lg font-bold text-foreground">{p.nome}</h3>
                {p.descricao && (
                  <p className="mt-1 text-base text-muted-foreground line-clamp-2">
                    {p.descricao}
                  </p>
                )}
                <Link
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="mt-3 inline-flex items-center justify-center min-h-12 w-full rounded-full bg-primary text-primary-foreground text-base font-bold active:scale-[0.98] transition-transform"
                >
                  Ver detalhes
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* DIFERENCIAIS */}
      <section className="bg-secondary text-secondary-foreground py-10">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-xl font-bold text-center mb-6">Por que escolher</h2>
          <ul className="grid grid-cols-1 gap-5">
            {[
              { Icon: Sparkles, title: "Seleção cuidadosa", desc: "Cada item é escolhido a dedo pensando em você." },
              { Icon: ShieldCheck, title: "Produtos frescos", desc: "Frescor e qualidade do começo ao fim da prateleira." },
              { Icon: HeartHandshake, title: "Atendimento especializado", desc: "Equipe pronta para te orientar pelo WhatsApp." },
            ].map(({ Icon, title, desc }) => (
              <li key={title} className="flex gap-4 items-start">
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-white/15 flex items-center justify-center">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-bold">{title}</p>
                  <p className="text-base opacity-90 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-accent text-accent-foreground py-10">
        <div className="mx-auto max-w-3xl px-4 flex flex-col items-center text-center gap-4">
          <Logo size="md" />
          <div className="flex items-start gap-2 text-base">
            <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>Rua Exemplo, 45 — Bairro, Cidade/UF</p>
          </div>
          <div className="flex items-start gap-2 text-base">
            <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>Seg a Sáb · 08h às 19h</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a
              href={whatsappGeneralLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
            >
              <MessageCircle className="h-6 w-6" />
            </a>
          </div>
          <p className="text-xs opacity-70 mt-4">
            © {new Date().getFullYear()} Merkado empório 45
          </p>
        </div>
      </footer>
    </div>
  );
}