import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { supabase, whatsappLinkForProduct, type Produto } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoDetalhe,
});

function PrecosProduto({ p }: { p: Produto }) {
  if (p.categoria === "Naturais") {
    if (p.preco_100g == null && p.preco_kg == null) return null;
    return (
      <div className="mt-6 grid grid-cols-2 gap-3">
        {p.preco_100g != null && (
          <div className="rounded-2xl bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">100g</p>
            <p className="text-xl font-bold text-foreground">R$ {p.preco_100g.toFixed(2).replace(".", ",")}</p>
          </div>
        )}
        {p.preco_kg != null && (
          <div className="rounded-2xl bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">1kg</p>
            <p className="text-xl font-bold text-foreground">R$ {p.preco_kg.toFixed(2).replace(".", ",")}</p>
          </div>
        )}
      </div>
    );
  }

  if (p.categoria === "Frigorífico") {
    if (p.preco_kg == null) return null;
    return (
      <div className="mt-6">
        <div className="rounded-2xl bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Preço por kg</p>
          <p className="text-xl font-bold text-foreground">R$ {p.preco_kg.toFixed(2).replace(".", ",")}</p>
        </div>
      </div>
    );
  }

  if (p.categoria === "Suplementos") {
    if (p.preco_unidade == null && !p.peso_embalagem) return null;
    return (
      <div className="mt-6 grid grid-cols-2 gap-3">
        {p.peso_embalagem && (
          <div className="rounded-2xl bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Embalagem</p>
            <p className="text-xl font-bold text-foreground">{p.peso_embalagem}</p>
          </div>
        )}
        {p.preco_unidade != null && (
          <div className="rounded-2xl bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Preço</p>
            <p className="text-xl font-bold text-foreground">R$ {p.preco_unidade.toFixed(2).replace(".", ",")}</p>
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (naoEncontrado || !produto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4">
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl h-full px-2 flex items-center justify-between">
          <button
            onClick={() => navigate({ to: "/" })}
            className="min-h-12 min-w-12 flex items-center justify-center rounded-full hover:bg-muted"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <Link to="/" aria-label="Início">
            <Logo size="sm" />
          </Link>
          <div className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {produto.imagem_url && (
          <img src={produto.imagem_url} alt={produto.nome} className="w-full h-64 object-cover rounded-2xl mb-6" />
        )}

        <span
          className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            produto.categoria === "Naturais"
              ? "bg-[#2d7a1f] text-white"
              : produto.categoria === "Frigorífico"
                ? "bg-[#c1393b] text-white"
                : produto.categoria === "Suplementos"
                  ? "bg-[#e8a020] text-white"
                  : "bg-secondary text-secondary-foreground"
          }`}
        >
          {produto.categoria}
        </span>

        <h1 className="text-3xl font-extrabold mt-3">{produto.nome}</h1>

        {produto.descricao && (
          <p className="mt-4 text-base leading-relaxed whitespace-pre-line text-foreground/85">{produto.descricao}</p>
        )}

        <PrecosProduto p={produto} />

        <div className="mt-8 flex flex-col gap-3">
          <a
            href={whatsappLinkForProduct(produto.nome)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-12 w-full rounded-full bg-primary text-primary-foreground text-base font-bold shadow-md active:scale-[0.98] transition-transform"
          >
            <FaWhatsapp className="h-5 w-5" />
            Pedir pelo WhatsApp
          </a>
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center gap-2 min-h-12 w-full rounded-full border-2 border-secondary text-secondary text-base font-bold active:scale-[0.98] transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar ao catálogo
          </button>
        </div>
      </main>
    </div>
  );
}
