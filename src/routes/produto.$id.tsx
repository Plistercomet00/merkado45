import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import {
  supabase,
  whatsappLinkForProduct,
  type Produto,
} from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoDetalhe,
});

function ProdutoDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", id)
        .maybeSingle();
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
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-2 py-2 flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/" })}
            className="min-h-12 min-w-12 flex items-center justify-center rounded-full hover:bg-secondary"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <Link to="/">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        <div className="aspect-square w-full rounded-2xl bg-muted overflow-hidden mb-4">
          {produto.imagem_url ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sem foto
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{produto.categoria}</p>
        <h1 className="text-2xl font-bold text-foreground mt-1">{produto.nome}</h1>
        <p className="text-3xl font-extrabold text-primary mt-2">
          R$ {Number(produto.preco).toFixed(2).replace(".", ",")}
        </p>
        {produto.descricao && (
          <p className="mt-4 text-base text-foreground/80 leading-relaxed whitespace-pre-line">
            {produto.descricao}
          </p>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur p-3">
        <a
          href={whatsappLinkForProduct(produto.nome, Number(produto.preco))}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto max-w-3xl flex items-center justify-center gap-2 min-h-14 rounded-full bg-[#25D366] text-white font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="h-5 w-5" />
          Pedir pelo WhatsApp
        </a>
      </div>
    </div>
  );
}