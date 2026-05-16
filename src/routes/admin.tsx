import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { LogOut, Plus, Pencil, Trash2, X, Search, Upload, Image, ZoomIn, ZoomOut, Check, Eye } from "lucide-react";
import { CATEGORIAS, supabase, type Produto } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin — Merkado empório 45" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

function normalizar(texto: string) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function AdminApp() {
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
  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  return userEmail ? <Painel email={userEmail} /> : <Login />;
}

function AdminPage() {
  return <AdminApp />;
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
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
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
          {carregando ? "Entrando..." : "Entrar"}
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

function corCat(cat: string) {
  if (cat === "Naturais") return "#2d7a1f";
  if (cat === "Frigorífico") return "#c1393b";
  if (cat === "Suplementos") return "#e8a020";
  return "#6ab820";
}

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

  const filtrados = useMemo(
    () =>
      produtos.filter((p) => {
        const okCat = categoria === "Todos" || p.categoria === categoria;
        const okBusca = !busca || normalizar(p.nome ?? "").includes(normalizar(busca.trim()));
        return okCat && okBusca;
      }),
    [produtos, categoria, busca],
  );

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
      const { error } = await supabase.from("produtos").update(payload).eq("id", form.id);
      if (error) {
        alert("Erro ao salvar: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("produtos").insert(payload);
      if (error) {
        alert("Erro ao salvar: " + error.message);
        return;
      }
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
    if (p.categoria === "Frigorífico")
      return p.preco_kg != null ? `1kg R$ ${Number(p.preco_kg).toFixed(2).replace(".", ",")}` : "";
    if (p.categoria === "Suplementos") {
      const parts = [];
      if (p.peso_embalagem) parts.push(p.peso_embalagem);
      if (p.preco_unidade != null) parts.push(`R$ ${Number(p.preco_unidade).toFixed(2).replace(".", ",")}`);
      return parts.join(" · ");
    }
    return "";
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <Logo size="sm" />
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{email}</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="h-9 px-4 inline-flex items-center gap-2 rounded-full border border-border/60 text-sm font-medium text-muted-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full h-11 pl-9 pr-4 text-sm rounded-xl border border-border/60 bg-white focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-4 pb-1">
          {(["Todos", ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`flex-shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-colors border ${categoria === c ? "text-white border-transparent" : "bg-white text-muted-foreground border-border/60"}`}
              style={categoria === c ? { background: corCat(c), borderColor: corCat(c) } : {}}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {filtrados.length} produto{filtrados.length !== 1 ? "s" : ""}
        </p>
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">Nenhum produto encontrado.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/40">
            {filtrados.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                  {p.imagem_url ? (
                    <img src={p.imagem_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: corCat(p.categoria) }} />
                    <span className="text-xs text-muted-foreground">{p.categoria}</span>
                    {!p.disponivel && <span className="text-xs text-muted-foreground/60">· oculto</span>}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{p.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{precoLabel(p)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
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
                    className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => excluir(p.id)}
                    className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-destructive/10 transition-colors"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <button
        onClick={() => setEditando(FORM_VAZIO)}
        className="fixed bottom-6 right-5 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Adicionar produto"
      >
        <Plus className="h-6 w-6" />
      </button>
      {editando && <FormModal initial={editando} onClose={() => setEditando(null)} onSave={salvar} />}
    </div>
  );
}

function ImageCropper({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const minScaleRef = useRef(1);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [scale, setScaleState] = useState(1);
  const [offset, setOffsetState] = useState({ x: 0, y: 0 });
  const [imgReady, setImgReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const lastTouchDist = useRef(0);
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const CROP_SIZE = 300;
  const EXPORT_SIZE = 1080;

  function setScale(s: number) {
    const clamped = Math.min(3, Math.max(minScaleRef.current, s));
    scaleRef.current = clamped;
    setScaleState(clamped);
  }

  function setOffset(o: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) {
    const next = typeof o === "function" ? o(offsetRef.current) : o;
    offsetRef.current = next;
    setOffsetState(next);
  }

  useEffect(() => {
    setImgReady(false);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const min = CROP_SIZE / Math.min(img.width, img.height);
      minScaleRef.current = min;
      scaleRef.current = min;
      offsetRef.current = { x: 0, y: 0 };
      setScaleState(min);
      setOffsetState({ x: 0, y: 0 });
      setImgReady(true);
    };
    img.src = src;
  }, [src]);

  function draw() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const s = scaleRef.current;
      const o = offsetRef.current;
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
      const w = img.width * s;
      const h = img.height * s;
      const x = (CROP_SIZE - w) / 2 + o.x;
      const y = (CROP_SIZE - h) / 2 + o.y;
      ctx.drawImage(img, x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(CROP_SIZE / 3, 0);
      ctx.lineTo(CROP_SIZE / 3, CROP_SIZE);
      ctx.moveTo((CROP_SIZE * 2) / 3, 0);
      ctx.lineTo((CROP_SIZE * 2) / 3, CROP_SIZE);
      ctx.moveTo(0, CROP_SIZE / 3);
      ctx.lineTo(CROP_SIZE, CROP_SIZE / 3);
      ctx.moveTo(0, (CROP_SIZE * 2) / 3);
      ctx.lineTo(CROP_SIZE, (CROP_SIZE * 2) / 3);
      ctx.stroke();
      ctx.strokeStyle = "#6ab820";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, CROP_SIZE - 2, CROP_SIZE - 2);
    });
  }

  useEffect(() => {
    if (imgReady) draw();
  }, [scale, offset, imgReady]);

  useEffect(() => {
    if (!imgReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function dist(e: TouchEvent) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 2) {
        lastTouchDist.current = dist(e);
        lastTouchPos.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      } else if (e.touches.length === 1) {
        lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 2) {
        const d = dist(e);
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        if (lastTouchDist.current > 0) {
          const newScale = Math.min(3, Math.max(minScaleRef.current, scaleRef.current * (d / lastTouchDist.current)));
          scaleRef.current = newScale;
          setScaleState(newScale);
        }
        const newOffset = {
          x: offsetRef.current.x + cx - lastTouchPos.current.x,
          y: offsetRef.current.y + cy - lastTouchPos.current.y,
        };
        offsetRef.current = newOffset;
        setOffsetState(newOffset);
        lastTouchDist.current = d;
        lastTouchPos.current = { x: cx, y: cy };
      } else if (e.touches.length === 1) {
        const newOffset = {
          x: offsetRef.current.x + e.touches[0].clientX - lastTouchPos.current.x,
          y: offsetRef.current.y + e.touches[0].clientY - lastTouchPos.current.y,
        };
        offsetRef.current = newOffset;
        setOffsetState(newOffset);
        lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      draw();
    }

    function onTouchEnd() {
      lastTouchDist.current = 0;
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [imgReady]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || e.pointerType === "touch") return;
    const newOffset = {
      x: dragStart.current.ox + e.clientX - dragStart.current.x,
      y: dragStart.current.oy + e.clientY - dragStart.current.y,
    };
    offsetRef.current = newOffset;
    setOffsetState(newOffset);
  }
  function onPointerUp() {
    setDragging(false);
  }

  function confirm() {
    const img = imgRef.current;
    if (!img) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_SIZE;
    exportCanvas.height = EXPORT_SIZE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    const ratio = EXPORT_SIZE / CROP_SIZE;
    const w = img.width * scaleRef.current * ratio;
    const h = img.height * scaleRef.current * ratio;
    const x = (EXPORT_SIZE - w) / 2 + offsetRef.current.x * ratio;
    const y = (EXPORT_SIZE - h) / 2 + offsetRef.current.y * ratio;
    ctx.drawImage(img, x, y, w, h);
    exportCanvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.95,
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center">
      <div className="bg-card rounded-2xl overflow-hidden w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Ajustar imagem</p>
          <button onClick={onCancel} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-center bg-black p-2">
          {!imgReady ? (
            <div style={{ width: CROP_SIZE, height: CROP_SIZE }} className="flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              style={{
                width: CROP_SIZE,
                height: CROP_SIZE,
                maxWidth: "100%",
                cursor: dragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          )}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-3">Arraste para mover · Dois dedos para zoom</p>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setScale(scaleRef.current - 0.1)}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-border hover:bg-muted"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={minScaleRef.current}
              max={3}
              step="0.05"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setScale(scaleRef.current + 0.1)}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-border hover:bg-muted"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-border text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirm}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" /> Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErro("Imagem muito grande. Máximo 10MB.");
      return;
    }
    setErro(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setCropSrc(ev.target.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    setCropSrc(null);
    setUploading(true);
    const nome = `${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("produto")
      .upload(nome, blob, { upsert: true, contentType: "image/jpeg" });
    if (uploadError) {
      setErro("Erro ao fazer upload: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("produto").getPublicUrl(nome);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">Imagem do produto</label>
      {cropSrc && <ImageCropper src={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />}
      {value ? (
        <div className="relative mb-2">
          <img src={value} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 rounded-xl border-2 border-dashed border-input bg-muted flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
        >
          {uploading ? (
            <p className="text-sm text-muted-foreground">Enviando...</p>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Toque para escolher uma foto</p>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP · máx 10MB</p>
            </>
          )}
        </div>
      )}
      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 w-full h-10 rounded-lg border border-input bg-background text-sm text-muted-foreground flex items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" /> Trocar imagem
        </button>
      )}
      {erro && <p className="text-xs text-destructive mt-1">{erro}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
}

function PreviewVitrine({ form }: { form: FormState }) {
  const cor = corCat(form.categoria);
  const emoji = form.categoria === "Naturais" ? "🌿" : form.categoria === "Frigorífico" ? "🥩" : "💊";

  function PrecoPreview() {
    if (form.categoria === "Naturais") {
      const p100g = form.preco_100g ? Number(form.preco_100g.replace(",", ".")) : null;
      const pkg = form.preco_kg ? Number(form.preco_kg.replace(",", ".")) : null;
      if (!p100g && !pkg) return null;
      return (
        <div className="mt-2 flex gap-3 items-center">
          {p100g != null && (
            <div>
              <p className="text-xs text-muted-foreground">100g</p>
              <p className="text-sm font-bold" style={{ color: cor }}>
                R$ {p100g.toFixed(2).replace(".", ",")}
              </p>
            </div>
          )}
          {p100g != null && pkg != null && <div className="w-px h-5 bg-border/60" />}
          {pkg != null && (
            <div>
              <p className="text-xs text-muted-foreground">1kg</p>
              <p className="text-sm font-bold" style={{ color: cor }}>
                R$ {pkg.toFixed(2).replace(".", ",")}
              </p>
            </div>
          )}
        </div>
      );
    }
    if (form.categoria === "Frigorífico") {
      const pkg = form.preco_kg ? Number(form.preco_kg.replace(",", ".")) : null;
      if (!pkg) return null;
      return (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">por kg</p>
          <p className="text-sm font-bold" style={{ color: cor }}>
            R$ {pkg.toFixed(2).replace(".", ",")}
          </p>
        </div>
      );
    }
    if (form.categoria === "Suplementos") {
      const pun = form.preco_unidade ? Number(form.preco_unidade.replace(",", ".")) : null;
      return (
        <div className="mt-2 flex gap-3 items-center">
          {form.peso_embalagem && (
            <div>
              <p className="text-xs text-muted-foreground">Embalagem</p>
              <p className="text-sm font-bold text-foreground">{form.peso_embalagem}</p>
            </div>
          )}
          {form.peso_embalagem && pun != null && <div className="w-px h-5 bg-border/60" />}
          {pun != null && (
            <div>
              <p className="text-xs text-muted-foreground">Preço</p>
              <p className="text-sm font-bold" style={{ color: cor }}>
                R$ {pun.toFixed(2).replace(".", ",")}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-border/60 overflow-hidden">
      <div className="px-3 py-2 bg-muted/30 border-b border-border/40 flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Pré-visualização na vitrine</span>
      </div>
      <div className="flex gap-3 p-3 bg-white">
        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
          {form.imagem_url ? (
            <img src={form.imagem_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl opacity-30">{emoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cor }} />
            <span className="text-xs text-muted-foreground">{form.categoria}</span>
          </div>
          <p className="text-sm font-semibold text-foreground truncate">
            {form.nome || <span className="text-muted-foreground italic">Nome do produto</span>}
          </p>
          {form.descricao && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{form.descricao}</p>}
          <PrecoPreview />
        </div>
        <div className="flex items-center flex-shrink-0 self-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
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
  const [erro, setErro] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
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
        {erro && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{erro}</div>}

        <label className="block text-sm font-medium mb-1">Nome</label>
        <input
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="w-full h-12 px-3 mb-3 rounded-lg border border-input bg-background text-base"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
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
              autoCorrect="off"
              spellCheck={false}
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

        <ImageUpload value={form.imagem_url} onChange={(url) => setForm({ ...form, imagem_url: url })} />

        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          rows={3}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-full p-3 mb-4 rounded-lg border border-input bg-background text-base"
        />

        <PreviewVitrine form={form} />

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
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
