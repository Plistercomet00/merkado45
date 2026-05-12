// v2
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { supabase, whatsappLinkForProduct, type Produto } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoDetalhe,
});

function corCategoria(cat: string) {
  if (cat === "Naturais") return { bg: "#2d7a1f", light: "#eaf3de", text: "#173404" };
  if (cat === "Frigorífico") return { bg: "#c1393b", light: "#fceaea", text: "#5a0f10" };
  if (cat === "Suplementos") return { bg: "#e8a020", light: "#faeeda", text: "#5a3a05" };
  return { bg: "#6ab820", light: "#eaf3de", text: "#173404" };
}

function PrecosProduto({ p }: { p: Produto }) {
  const cor = corCategoria(p.categoria);

  if (p.categoria === "Naturais") {
    if (p.preco_100g == null && p.preco_kg == null) return null;
    return (
      <div className="grid grid-cols-2 gap-3">
        {p.preco_100g != null && (
          <div className="rounded-2xl p-4 text-center" style={{ background: cor.light }}>
            <p className="text-xs font-medium mb-1" style={{ color: cor.bg }}>
              100 gramas
            </p>
            <p className="text-2xl font-black" style={{ color: cor.text }}>
              R$ {p.preco_100g.toFixed(2).replace(".", ",")}
            </p>
          </div>
        )}
        {p.preco_kg != null && (
          <div className="rounded-2xl p-4 text-center" style={{ background: cor.bg }}>
            <p className="text-xs font-medium mb-1 text-white/80">1 quilograma</p>
            <p className="text-2xl font-black text-white">R$ {p.preco_kg.toFixed(2).replace(".", ",")}</p>
          </div>
        )}
      </div>
    );
  }

  if (p.categoria === "Frigorífico") {
    if (p.preco_kg == null) return null;
    return (
      <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: cor.light }}>
        <p className="text-sm font-medium" style={{ color: cor.bg }}>
          Preço por kg
        </p>
        <p className="text-3xl font-black" style={{ color: cor.text }}>
          R$ {p.preco_kg.toFixed(2).replace(".", ",")}
        </p>
      </div>
    );
  }

  if (p.categoria === "Suplementos") {
    if (p.preco_unidade == null && !p.peso_embalagem) return null;
    return (
      <div className="grid grid-cols-2 gap-3">
        {p.peso_embalagem && (
          <div className="rounded-2xl p-4 text-center" style={{ background: cor.light }}>
            <p className="text-xs font-medium mb-1" style={{ color: cor.bg }}>
              Embalagem
            </p>
            <p className="text-2xl font-black" style={{ color: cor.text }}>
              {p.peso_embalagem}
            </p>
          </div>
        )}
        {p.preco_unidade != null && (
          <div className="rounded-2xl p-4 text-center" style={{ background: cor.bg }}>
            <p className="text-xs font-medium mb-1 text-white/80">Preço</p>
            <p className="text-2xl font-black text-white">R$ {p.preco_unidade.toFixed(2).replace(".", ",")}</p>
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      </div>
    );
  }

  if (naoEncontrado || !produto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4 bg-white">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link
          to="/"
          className="inline-flex min-h-12 items-center px-5 rounded-full bg-primary text-primary-foreground font-semibold"
        >
          Voltar à vitrine
        </Link>
      </div>
    );
  }

  const cor = corCategoria(produto.categoria);

  return (
    <div className="min-h-screen bg-white text-foreground pb-28">
      {/* HEADER — transparente sobre a imagem */}
      <header className="absolute top-0 left-0 right-0 z-40 h-14">
        <div className="mx-auto max-w-3xl h-full px-4 flex items-center justify-between">
          <button
            onClick={() => navigate({ to: "/" })}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm active:scale-95 transition-transform"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow-sm">
            <Logo size="sm" />
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* IMAGEM — fullscreen com fundo branco */}
      <div className="relative w-full bg-white" style={{ minHeight: produto.imagem_url ? 280 : 80 }}>
        {produto.imagem_url ? (
          <img src={produto.imagem_url} alt={produto.nome} className="w-full object-cover" style={{ height: 280 }} />
        ) : (
          <div className="w-full flex items-center justify-center" style={{ height: 120, background: cor.light }}>
            <span className="text-5xl opacity-40">
              {produto.categoria === "Naturais" ? "🌿" : produto.categoria === "Frigorífico" ? "🥩" : "💪"}
            </span>
          </div>
        )}
        {/* Faixa colorida da categoria na base da imagem */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: cor.bg }} />
      </div>

      {/* CONTEÚDO */}
      <main className="mx-auto max-w-3xl px-4 pt-5">
        {/* Badge + Nome */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ background: cor.bg, color: "white" }}
          >
            {produto.categoria}
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-3">{produto.nome}</h1>

        {/* Linha separadora com cor da categoria */}
        <div className="h-0.5 w-12 rounded-full mb-4" style={{ background: cor.bg }} />

        {/* Descrição */}
        {produto.descricao && (
          <p className="text-base leading-relaxed text-foreground/70 mb-6 whitespace-pre-line">{produto.descricao}</p>
        )}

        {/* Preços */}
        <PrecosProduto p={produto} />

        {/* Espaço para o botão fixo */}
        <div className="h-6" />
      </main>

      {/* BOTÕES FIXOS NO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-4 pt-3 pb-5">
        <div className="mx-auto max-w-3xl flex flex-col gap-2">
          <a
            href={whatsappLinkForProduct(produto.nome)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-14 w-full rounded-2xl text-base font-bold shadow-sm active:scale-[0.98] transition-transform text-white"
            style={{ background: "#25d366" }}
          >
            <FaWhatsapp className="h-6 w-6" />
            Fale Conosco!
          </a>
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center gap-2 min-h-11 w-full rounded-2xl text-sm font-medium active:scale-[0.98] transition-transform border border-border text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao catálogo
          </button>
        </div>
      </div>
    </div>
  );
}
