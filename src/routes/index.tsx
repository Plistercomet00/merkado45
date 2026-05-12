import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Instagram, MapPin, Clock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CATEGORIAS, supabase, whatsappGeneralLink, type Produto } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Merkado empório 45 — Vitrine" },
      { name: "description", content: "Veja os produtos do Merkado empório 45 e peça pelo WhatsApp." },
    ],
  }),
});

function corCat(cat: string) {
  if (cat === "Naturais") return "#2d7a1f";
  if (cat === "Frigorífico") return "#c1393b";
  if (cat === "Suplementos") return "#e8a020";
  return "#6ab820";
}

function PrecoResumido({ p }: { p: Produto }) {
  const cor = corCat(p.categoria);

  if (p.categoria === "Naturais") {
    if (p.preco_100g == null && p.preco_kg == null) return null;
    return (
      <div className="mt-3 flex gap-3 items-center">
        {p.preco_100g != null && (
          <div>
            <p className="text-xs text-muted-foreground">100g</p>
            <p className="text-sm font-bold" style={{ color: cor }}>
              R$ {p.preco_100g.toFixed(2).replace(".", ",")}
            </p>
          </div>
        )}
        {p.preco_100g != null && p.preco_kg != null && <div className="w-px h-6 bg-border" />}
        {p.preco_kg != null && (
          <div>
            <p className="text-xs text-muted-foreground">1kg</p>
            <p className="text-sm font-bold" style={{ color: cor }}>
              R$ {p.preco_kg.toFixed(2).replace(".", ",")}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (p.categoria === "Frigorífico") {
    if (p.preco_kg == null) return null;
    return (
      <div className="mt-3">
        <p className="text-xs text-muted-foreground">por kg</p>
        <p className="text-sm font-bold" style={{ color: cor }}>
          R$ {p.preco_kg.toFixed(2).replace(".", ",")}
        </p>
      </div>
    );
  }

  if (p.categoria === "Suplementos") {
    if (p.preco_unidade == null && !p.peso_embalagem) return null;
    return (
      <div className="mt-3 flex gap-3 items-center">
        {p.peso_embalagem && (
          <div>
            <p className="text-xs text-muted-foreground">Embalagem</p>
            <p className="text-sm font-bold text-foreground">{p.peso_embalagem}</p>
          </div>
        )}
        {p.peso_embalagem && p.preco_unidade != null && <div className="w-px h-6 bg-border" />}
        {p.preco_unidade != null && (
          <div>
            <p className="text-xs text-muted-foreground">Preço</p>
            <p className="text-sm font-bold" style={{ color: cor }}>
              R$ {p.preco_unidade.toFixed(2).replace(".", ",")}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

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
      const okBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
      return okCat && okBusca;
    });
  }, [produtos, categoria, busca]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const cats = [
    { nome: "Naturais", emoji: "🌿", desc: "Ervas, temperos e grãos" },
    { nome: "Frigorífico", emoji: "🥩", desc: "Carnes, queijos e frios" },
    { nome: "Suplementos", emoji: "💊", desc: "Whey, creatina e mais" },
  ];

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-40 h-14 border-b border-border/60 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl h-full px-4 flex items-center justify-between">
          <Link to="/" aria-label="Início">
            <Logo size="sm" />
          </Link>
          <a
            href={whatsappGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-white text-sm font-medium active:scale-95 transition-transform"
            style={{ background: "#25d366" }}
          >
            <FaWhatsapp className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </header>

      {/* CATEGORIAS — minimalistas, linha com ícone */}
      <section className="mx-auto max-w-3xl px-4 pt-6 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Categorias</p>
        <div className="grid grid-cols-3 gap-2">
          {cats.map(({ nome, emoji, desc }) => (
            <button
              key={nome}
              onClick={() => {
                setCategoria(nome);
                setTimeout(() => scrollTo("vitrine"), 30);
              }}
              className="flex flex-col items-start gap-1 p-3 rounded-xl border border-border/60 bg-white active:scale-[0.97] transition-transform hover:border-border"
              style={categoria === nome ? { borderColor: corCat(nome), background: corCat(nome) + "08" } : {}}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-semibold text-foreground leading-tight">{nome}</span>
              <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* VITRINE */}
      <section id="vitrine" className="mx-auto max-w-3xl px-4 pb-12 scroll-mt-16">
        {/* Busca + filtros */}
        <div className="relative mb-3 mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full h-11 pl-9 pr-4 text-sm rounded-xl border border-border/60 bg-white focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-5 pb-1">
          {(["Todos", ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`flex-shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-colors border ${
                categoria === c ? "text-white border-transparent" : "bg-white text-muted-foreground border-border/60"
              }`}
              style={categoria === c ? { background: corCat(c), borderColor: corCat(c) } : {}}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Lista de produtos */}
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando…</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border/40">
            {filtrados.map((p) => (
              <li key={p.id}>
                <Link
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="flex gap-3 py-4 active:bg-muted/30 transition-colors"
                >
                  {/* Imagem quadrada */}
                  <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-40">
                        {p.categoria === "Naturais" ? "🌿" : p.categoria === "Frigorífico" ? "🥩" : "💊"}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: corCat(p.categoria) }}
                      />
                      <span className="text-xs text-muted-foreground">{p.categoria}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground leading-snug truncate">{p.nome}</h3>
                    {p.descricao && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.descricao}</p>}
                    <PrecoResumido p={p} />
                  </div>

                  {/* Seta */}
                  <div className="flex items-center flex-shrink-0 self-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 4l4 4-4 4"
                        stroke="#ccc"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-border/60 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-4">
          <Logo size="sm" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>Rua Taquaritinga, 45 — Casa Amarela, Recife/PE</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Segunda a Sábado · 07h às 18h</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://www.instagram.com/merkado45.emporio/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-10 w-10 rounded-full border border-border/60 flex items-center justify-center active:scale-95 transition-all"
            >
              <Instagram className="h-5 w-5 text-muted-foreground" />
            </a>
            <a
              href={whatsappGeneralLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="h-10 w-10 rounded-full flex items-center justify-center active:scale-95 transition-transform text-white"
              style={{ background: "#25d366" }}
            >
              <FaWhatsapp className="h-5 w-5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} Merkado empório 45</p>
        </div>
      </footer>
    </div>
  );
}
