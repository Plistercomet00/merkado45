import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  CATEGORIAS,
  supabase,
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto…"
              className="w-full h-12 pl-10 pr-4 text-base rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <nav className="overflow-x-auto no-scrollbar">
          <ul className="mx-auto max-w-3xl flex gap-2 px-4 pb-3 w-max">
            {(["Todos", ...CATEGORIAS] as const).map((c) => (
              <li key={c}>
                <button
                  onClick={() => setCategoria(c)}
                  className={`min-h-12 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    categoria === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        <h1 className="sr-only">Vitrine Merkado empório 45</h1>
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando produtos…</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtrados.map((p) => (
              <li key={p.id}>
                <Link
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="flex gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="w-24 h-24 flex-shrink-0 rounded-xl bg-muted overflow-hidden">
                    {p.imagem_url ? (
                      <img
                        src={p.imagem_url}
                        alt={p.nome}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Sem foto
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground">{p.categoria}</p>
                      <h2 className="text-base font-semibold text-foreground line-clamp-2">
                        {p.nome}
                      </h2>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-8 text-center text-sm text-muted-foreground">
        <Logo size="sm" />
        <p className="mt-2">Pedidos pelo WhatsApp</p>
      </footer>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}