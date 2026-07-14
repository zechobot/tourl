import { useEffect, useRef, useState } from "react";
import Head from "next/head";

function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  return origin;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}d lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

export default function Home() {
  const origin = useOrigin();
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const fileRef = useRef(null);

  async function fetchLinks() {
    setLoadingLinks(true);
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      // diam-diam, bukan fatal untuk halaman utama
    } finally {
      setLoadingLinks(false);
    }
  }

  useEffect(() => {
    fetchLinks();
  }, []);

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageData(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          alias: alias || undefined,
          title: title || undefined,
          image: imageData || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat link.");
      setResult(data);
      setUrl("");
      setAlias("");
      setTitle("");
      clearImage();
      fetchLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
  }

  return (
    <>
      <Head>
        <title>tourl · commit your links</title>
        <meta
          name="description"
          content="URL shortener yang menyimpan data & foto langsung ke repo GitHub kamu."
        />
      </Head>

      <div className="min-h-screen bg-ink bg-grid bg-[size:28px_28px] font-sans">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          {/* Hero */}
          <header className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 font-mono text-xs text-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-moss" />
              repo-backed url shortener
            </div>
            <h1 className="text-4xl font-bold leading-tight text-bone sm:text-5xl">
              tourl
            </h1>
            <p className="mt-3 max-w-xl font-mono text-sm text-dim">
              <span className="text-moss">$</span> git commit -m "shorten this link" — setiap
              link yang kamu buat jadi satu commit di repo GitHub-mu. Foto ikut ke-push juga.
            </p>
          </header>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="mb-14 rounded-xl border border-line bg-panel/60 p-5 shadow-[0_0_0_1px_rgba(63,185,80,0.05)] sm:p-6"
          >
            <label className="mb-1.5 block font-mono text-xs text-dim">
              url tujuan <span className="text-wheat">*</span>
            </label>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2.5 focus-within:border-moss">
              <span className="font-mono text-moss">›</span>
              <input
                required
                type="url"
                placeholder="https://contoh.com/artikel-yang-panjang-sekali"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent font-mono text-sm text-bone placeholder:text-dim/60 focus:outline-none"
              />
            </div>

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-mono text-xs text-dim">
                  alias custom <span className="text-dim/60">(opsional)</span>
                </label>
                <div className="flex items-center gap-1 rounded-lg border border-line bg-ink px-3 py-2.5 focus-within:border-moss">
                  <span className="font-mono text-sm text-dim">{origin ? new URL(origin).host : ""}/</span>
                  <input
                    type="text"
                    placeholder="promo-agustus"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full bg-transparent font-mono text-sm text-bone placeholder:text-dim/60 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-xs text-dim">
                  judul preview <span className="text-dim/60">(opsional)</span>
                </label>
                <div className="rounded-lg border border-line bg-ink px-3 py-2.5 focus-within:border-moss">
                  <input
                    type="text"
                    placeholder="Judul yang muncul saat dibagikan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent font-mono text-sm text-bone placeholder:text-dim/60 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <label className="mb-1.5 block font-mono text-xs text-dim">
              foto preview <span className="text-dim/60">(opsional, tersimpan ke repo GitHub)</span>
            </label>
            {!imagePreview ? (
              <label className="mb-5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-ink/60 px-4 py-6 text-center transition hover:border-moss/60">
                <span className="font-mono text-sm text-dim">
                  <span className="text-moss">+</span> klik untuk pilih foto (max 5MB)
                </span>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
              </label>
            ) : (
              <div className="mb-5 flex items-center gap-3 rounded-lg border border-line bg-ink/60 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview" className="h-16 w-16 rounded-md object-cover" />
                <span className="flex-1 truncate font-mono text-xs text-dim">gambar siap di-push</span>
                <button
                  type="button"
                  onClick={clearImage}
                  className="rounded-md border border-line px-2.5 py-1 font-mono text-xs text-dim hover:border-wheat hover:text-wheat"
                >
                  hapus
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300">
                ✕ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-moss px-4 py-3 font-mono text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "commit-ing…" : "shorten & commit →"}
            </button>
          </form>

          {result && (
            <div className="mb-14 rounded-xl border border-moss/40 bg-moss/5 p-5">
              <p className="mb-2 font-mono text-xs text-dim">berhasil dibuat</p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`${origin}/${result.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-lg font-semibold text-moss underline decoration-dotted"
                >
                  {origin ? new URL(origin).host : ""}/{result.code}
                </a>
                <button
                  onClick={() => copy(`${origin}/${result.code}`)}
                  className="rounded-md border border-line px-3 py-1 font-mono text-xs text-bone hover:border-moss"
                >
                  salin
                </button>
              </div>
            </div>
          )}

          {/* Git log style list */}
          <section>
            <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-dim">
              log — {links.length} link
            </h2>

            {loadingLinks ? (
              <p className="font-mono text-sm text-dim">memuat…</p>
            ) : links.length === 0 ? (
              <p className="font-mono text-sm text-dim">
                belum ada commit. buat link pertamamu di atas.
              </p>
            ) : (
              <ol className="relative border-l border-line pl-6">
                {links.map((link) => (
                  <li key={link.code} className="mb-6 last:mb-0">
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-moss ring-4 ring-ink" />
                    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-line bg-panel/50 p-3.5">
                      {link.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={link.image}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-md border border-line object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`${origin}/${link.code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-wheat/10 px-1.5 py-0.5 font-mono text-sm font-semibold text-wheat"
                          >
                            /{link.code}
                          </a>
                          <span className="font-mono text-xs text-dim">{timeAgo(link.createdAt)}</span>
                          <span className="font-mono text-xs text-dim">· {link.clicks || 0} klik</span>
                        </div>
                        {link.title && <p className="mt-1 truncate text-sm text-bone">{link.title}</p>}
                        <p className="mt-1 truncate font-mono text-xs text-dim">{link.url}</p>
                      </div>
                      <button
                        onClick={() => copy(`${origin}/${link.code}`)}
                        className="shrink-0 rounded-md border border-line px-2.5 py-1 font-mono text-xs text-bone hover:border-moss"
                      >
                        salin
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <footer className="mt-16 border-t border-line pt-6 font-mono text-xs text-dim">
            data & foto disimpan sebagai commit di repo GitHub — tanpa database tambahan.
          </footer>
        </div>
      </div>
    </>
  );
}
