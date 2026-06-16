import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Instagram, MapPin, Clock, ChevronRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CATEGORIAS, supabase, whatsappGeneralLink, type Produto } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Empório Merkado 45 — Produtos Naturais, Suplementos e Frigorífico em Casa Amarela, Recife" },
      {
        name: "description",
        content:
          "O Empório Merkado 45 (também conhecido como Mercado 45, Merkado 45 e Empório 45) fica na Rua Taquaritinga, 45, Casa Amarela, Recife/PE. Venda de produtos naturais, ervas, temperos, grãos, chás, suplementos, whey protein, creatina, carnes e frios. Seg–Sáb, 07h às 18h.",
      },
      {
        name: "keywords",
        content:
          "Empório Merkado 45, Merkado 45, Mercado 45, Empório 45, empório Casa Amarela, produtos naturais Recife, suplementos Casa Amarela, ervas e temperos Recife, whey protein Casa Amarela, frigorífico Casa Amarela, empório Recife, loja natural Recife",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Empório Merkado 45 — Casa Amarela, Recife" },
      {
        property: "og:description",
        content:
          "Produtos naturais, suplementos e frigorífico em Casa Amarela, Recife. Peça pelo WhatsApp ou visite a loja na Rua Taquaritinga, 45.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://merkado45.lovable.app" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Empório Merkado 45 — Casa Amarela, Recife" },
      {
        name: "twitter:description",
        content: "Produtos naturais, suplementos e frigorífico em Casa Amarela, Recife/PE. Seg–Sáb, 07h às 18h.",
      },
    ],
  }),
});

function corCat(cat: string) {
  if (cat === "Naturais") return "#2d7a1f";
  if (cat === "Frigorífico") return "#c1393b";
  if (cat === "Suplementos") return "#e8a020";
  return "#6ab820";
}

function bgCat(cat: string) {
  if (cat === "Naturais") return "#f0f7eb";
  if (cat === "Frigorífico") return "#fdf0f0";
  if (cat === "Suplementos") return "#fdf6e8";
  return "#f0f7eb";
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const ORDEM_CATEGORIAS: Record<string, number> = {
  Suplementos: 0,
  Naturais: 1,
  Frigorífico: 2,
};

function PrecoResumido({ p }: { p: Produto }) {
  const cor = corCat(p.categoria);
  if (p.categoria === "Naturais") {
    const temGranel = p.preco_100g != null || p.preco_kg != null;
    const temUnidade = p.preco_unidade != null;
    if (!temGranel && !temUnidade) return null;
    return (
      <div className="flex flex-wrap gap-2 items-center mt-1.5">
        {p.preco_100g != null && (
          <span className="text-sm font-semibold" style={{ color: cor }}>
            R$ {p.preco_100g.toFixed(2).replace(".", ",")}{" "}
            <span className="text-xs font-normal text-muted-foreground">/100g</span>
          </span>
        )}
        {p.preco_100g != null && p.preco_kg != null && <span className="text-border">·</span>}
        {p.preco_kg != null && (
          <span className="text-sm font-semibold" style={{ color: cor }}>
            R$ {p.preco_kg.toFixed(2).replace(".", ",")}{" "}
            <span className="text-xs font-normal text-muted-foreground">/kg</span>
          </span>
        )}
        {temUnidade && temGranel && <span className="text-border">·</span>}
        {temUnidade && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: bgCat(p.categoria), color: corCat(p.categoria) }}
          >
            {p.unidade_embalagem || "Un."} — R$ {p.preco_unidade!.toFixed(2).replace(".", ",")}
          </span>
        )}
      </div>
    );
  }
  if (p.categoria === "Frigorífico") {
    if (p.preco_kg == null) return null;
    return (
      <p className="text-sm font-semibold mt-1.5" style={{ color: cor }}>
        R$ {p.preco_kg.toFixed(2).replace(".", ",")}{" "}
        <span className="text-xs font-normal text-muted-foreground">/kg</span>
      </p>
    );
  }
  if (p.categoria === "Suplementos") {
    if (p.preco_unidade == null && !p.peso_embalagem) return null;
    return (
      <div className="flex flex-col gap-1.5 mt-1.5">
        <div className="flex gap-2 items-center">
          {p.peso_embalagem && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: bgCat(p.categoria), color: corCat(p.categoria) }}
            >
              {p.peso_embalagem}
            </span>
          )}
          {p.preco_unidade != null && (
            <span className="text-sm font-semibold" style={{ color: corCat(p.categoria) }}>
              R$ {p.preco_unidade.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>
        {p.sabores && (
          <div className="flex flex-wrap gap-1">
            {p.sabores
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((sabor) => (
                <span
                  key={sabor}
                  className="text-xs px-2 py-0.5 rounded-full font-medium border"
                  style={{ background: "#fff", color: "#e8a020", borderColor: "#e8a02040" }}
                >
                  {sabor}
                </span>
              ))}
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
    const resultado = produtos.filter((p) => {
      const okCat = categoria === "Todos" || p.categoria === categoria;
      const okBusca = !busca || normalizar(p.nome).includes(normalizar(busca.trim()));
      return okCat && okBusca;
    });

    return resultado.sort((a, b) => {
      const catA = ORDEM_CATEGORIAS[a.categoria] ?? 99;
      const catB = ORDEM_CATEGORIAS[b.categoria] ?? 99;
      if (catA !== catB) return catA - catB;
      const imgA = a.imagem_url ? 0 : 1;
      const imgB = b.imagem_url ? 0 : 1;
      return imgA - imgB;
    });
  }, [produtos, categoria, busca]);

  const cats = [
    { nome: "Naturais", emoji: "🌿", desc: "Ervas e temperos" },
    { nome: "Frigorífico", emoji: "🥩", desc: "Carnes e frios" },
    { nome: "Suplementos", emoji: "💊", desc: "Whey e creatina" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-foreground">
      <header
        className="sticky top-0 z-40 bg-white border-b border-border/50"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="mx-auto max-w-3xl h-14 px-4 flex items-center justify-between">
          <Link to="/" aria-label="Início">
            <Logo size="sm" />
          </Link>
          <a
            href={whatsappGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-white text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: "#25d366", boxShadow: "0 2px 8px rgba(37,211,102,0.35)" }}
          >
            <FaWhatsapp className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </header>

      <div className="bg-white px-4 pt-5 pb-4 mx-auto max-w-3xl">
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #1a4a0f 0%, #2d7a1f 60%, #4a9e30 100%)", minHeight: 100 }}
        >
          <div className="px-5 py-4">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Casa Amarela, Recife</p>
            <h1 className="text-white text-xl font-bold leading-tight mb-1">
              Qualidade que você
              <br />
              sente no dia a dia
            </h1>
            <p className="text-white/70 text-xs">Seg–Sáb · 07h às 18h</p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20">🌿</div>
        </div>
      </div>

      <div className="bg-white px-4 pb-4 mx-auto max-w-3xl">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Explorar por categoria
        </p>
        <div className="grid grid-cols-3 gap-2">
          {cats.map(({ nome, emoji, desc }) => (
            <button
              key={nome}
              onClick={() => {
                setCategoria(nome);
                setTimeout(
                  () => document.getElementById("vitrine")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  30,
                );
              }}
              className="flex flex-col items-start gap-1.5 p-3 rounded-2xl border transition-all active:scale-[0.97]"
              style={
                categoria === nome
                  ? { borderColor: corCat(nome), background: bgCat(nome), boxShadow: `0 2px 12px ${corCat(nome)}25` }
                  : { borderColor: "#ebebeb", background: "#fafafa" }
              }
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-bold text-foreground leading-tight">{nome}</span>
              <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div id="vitrine" className="mx-auto max-w-3xl px-4 pt-4 pb-16 scroll-mt-14">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full h-11 pl-10 pr-4 text-sm rounded-2xl border border-border/50 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          />
        </div>

        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-4 pb-1 -mx-4 px-4">
          {(["Todos", ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`flex-shrink-0 h-8 px-4 rounded-full text-xs font-semibold transition-all border ${categoria === c ? "text-white border-transparent shadow-sm" : "bg-white text-muted-foreground border-border/50"}`}
              style={categoria === c ? { background: corCat(c), boxShadow: `0 2px 8px ${corCat(c)}40` } : {}}
            >
              {c}
            </button>
          ))}
        </div>

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
          <ul className="flex flex-col gap-2">
            {filtrados.map((p) => (
              <li key={p.id}>
                <Link
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="flex gap-3 p-3 bg-white rounded-2xl border border-border/40 active:scale-[0.99] transition-transform"
                  style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
                >
                  <div
                    className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ background: bgCat(p.categoria) }}
                  >
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl opacity-50">
                        {p.categoria === "Naturais" ? "🌿" : p.categoria === "Frigorífico" ? "🥩" : "💊"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: corCat(p.categoria) }}
                      />
                      <span className="text-xs text-muted-foreground">{p.categoria}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug">{p.nome}</h3>
                    {p.descricao && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.descricao}</p>}
                    <PrecoResumido p={p} />
                  </div>
                  <div className="flex items-center self-center flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: bgCat(p.categoria) }}
                    >
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: corCat(p.categoria) }} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="bg-white border-t border-border/50">
        <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-4">
          <Logo size="sm" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>Rua Taquaritinga, 45 — Casa Amarela, Recife/PE</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
              <span>Segunda a Sábado · 07h às 18h</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/merkado45.emporio/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="h-10 w-10 rounded-full border border-border/60 flex items-center justify-center active:scale-95 transition-all hover:border-border"
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
          <p className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} Merkado empório 45</p>
        </div>
      </footer>
    </div>
  );
}
