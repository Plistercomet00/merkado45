import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { supabase, whatsappLinkForProduct, type Produto } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoDetalhe,
});

function corCat(cat: string) {
  if (cat === "Naturais") return "#2d7a1f";
  if (cat === "Frigorífico") return "#c1393b";
  if (cat === "Suplementos") return "#e8a020";
  return "#6ab820";
}

function PrecosProduto({ p }: { p: Produto }) {
  const cor = corCat(p.categoria);
  if (p.categoria === "Naturais") {
    if (p.preco_100g == null && p.preco_kg == null) return null;
    return (
      <div className="flex gap-6 items-start">
        {p.preco_100g != null && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">100 gramas</p>
            <p className="text-2xl font-bold" style={{ color: cor }}>
              R$ {p.preco_100g.toFixed(2).replace(".", ",")}
            </p>
          </div>
        )}
        {p.preco_100g != null && p.preco_kg != null && <div className="w-px self-stretch bg-border/60 mt-1" />}
        {p.preco_kg != null && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">1 quilograma</p>
            <p className="text-2xl font-bold" style={{ color: cor }}>
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
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Preço por kg</p>
        <p className="text-3xl font-bold" style={{ color: cor }}>
          R$ {p.preco_kg.toFixed(2).replace(".", ",")}
        </p>
      </div>
    );
  }
  if (p.categoria === "Suplementos") {
    if (p.preco_unidade == null && !p.peso_embalagem) return null;
    return (
      <div className="flex gap-6 items-start">
        {p.peso_embalagem && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Embalagem</p>
            <p className="text-2xl font-bold text-foreground">{p.peso_embalagem}</p>
          </div>
        )}
        {p.peso_embalagem && p.preco_unidade != null && <div className="w-px self-stretch bg-border/60 mt-1" />}
        {p.preco_unidade != null && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Preço</p>
            <p className="text-2xl font-bold" style={{ color: cor }}>
              R$ {p.preco_unidade.toFixed(2).replace(".", ",")}
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function ProdutoDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data, error } = await supabase.from("produtos").select("*").eq("id", id).maybeSingle();
      if (!ativo) return;
      if (error || !data) setNaoEncontrado(true);
      else setProduto(data as Produto);
      setLoading(false);
    })();
    return () => {
      ativo = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (naoEncontrado || !produto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 bg-white">
        <p className="text-muted-foreground text-sm">Produto não encontrado.</p>
        <Link
          to="/"
          className="inline-flex min-h-10 items-center px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          Voltar à vitrine
        </Link>
      </div>
    );
  }

  const cor = corCat(produto.categoria);
  const emoji = produto.categoria === "Naturais" ? "🌿" : produto.categoria === "Frigorífico" ? "🥩" : "💊";

  return (
    <div className="min-h-screen bg-white text-foreground pb-32">
      <header className="sticky top-0 z-40 h-14 border-b border-border/60 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl h-full px-4 flex items-center justify-between">
          <button
            onClick={() => navigate({ to: "/" })}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-border/60 active:scale-95 transition-transform"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <Link to="/" aria-label="Início">
            <Logo size="sm" />
          </Link>
          <div className="w-9" />
        </div>
      </header>

      <div className="w-full bg-white relative" style={{ aspectRatio: "4/3", maxHeight: 300, overflow: "hidden" }}>
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-contain"
            style={{ background: "#fff" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 200 }}>
            <span className="text-6xl opacity-20">{emoji}</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <span
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(6px)",
              color: "#888",
              borderColor: "rgba(0,0,0,0.08)",
              fontStyle: "italic",
              letterSpacing: "0.01em",
            }}
          >
            Imagem meramente ilustrativa
          </span>
        </div>
      </div>

      <div className="h-0.5 w-full" style={{ background: cor }} />

      <main className="mx-auto max-w-3xl px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cor }} />
          <span className="text-xs font-medium text-muted-foreground">{produto.categoria}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-4">{produto.nome}</h1>
        <div className="py-4 border-t border-b border-border/40">
          <PrecosProduto p={produto} />
        </div>
        {produto.descricao && (
          <div className="py-4 border-b border-border/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Sobre o produto</p>
            <p className="text-sm leading-relaxed text-foreground/70 whitespace-pre-line">{produto.descricao}</p>
          </div>
        )}
        <div className="py-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>📍</span>
            <span>Disponível em Casa Amarela, Recife/PE</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>⏰</span>
            <span>Segunda a Sábado · 07h às 18h</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/60 px-4 pt-3 pb-6">
        <div className="mx-auto max-w-3xl flex flex-col gap-2">
          <a
            href={whatsappLinkForProduct(produto.nome)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-12 w-full rounded-xl text-sm font-semibold text-white active:scale-[0.98] transition-transform"
            style={{ background: "#25d366" }}
          >
            <FaWhatsapp className="h-5 w-5" />
            Fale Conosco pelo WhatsApp
          </a>
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-xl text-xs font-medium text-muted-foreground active:scale-[0.98] transition-transform border border-border/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao catálogo
          </button>
        </div>
      </div>
    </div>
  );
}
