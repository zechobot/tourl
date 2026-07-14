# tourl — URL shortener dengan storage GitHub

URL shortener ala yurl/AppURL: bikin link pendek, opsional upload foto preview,
tanpa perlu database terpisah — semuanya (mapping link & foto) disimpan sebagai
commit di sebuah repo GitHub. Siap deploy ke Vercel.

## Fitur

- Shorten URL dengan kode acak atau alias custom.
- Upload foto preview, otomatis ter-push ke folder `images/` di repo GitHub.
- Halaman `/kode-pendek` otomatis redirect ke URL asli.
- Kalau yang buka link adalah bot medsos (WhatsApp, Twitter/X, Telegram, Discord, dll),
  otomatis ditampilkan halaman dengan meta `og:title` / `og:image` supaya preview link
  bagus saat dibagikan — bukan langsung redirect.
- Foto disajikan lewat proxy internal (`/api/image/...`) jadi repo GitHub-nya **boleh private**.
- Riwayat link ditampilkan di halaman utama gaya "git log".

## Cara kerja penyimpanan

Tidak ada database eksternal. Semua data ditulis ke repo GitHub kamu lewat
GitHub Contents API:

- `data/links.json` — mapping kode pendek → URL, judul, foto, jumlah klik.
- `images/<kode>.<ext>` — file foto yang diupload user.

Setiap kali ada link baru / foto baru, aplikasi melakukan commit ke repo tersebut.

## 1. Siapkan repo penyimpanan di GitHub

1. Buat repo baru di GitHub, boleh **private**, contoh nama: `tourl-data`.
   Tidak perlu isi apa-apa, biarkan kosong.
2. Buat Personal Access Token:
   - Buka https://github.com/settings/tokens → **Fine-grained tokens** → *Generate new token*.
   - Batasi akses token hanya ke repo `tourl-data` tadi.
   - Permission yang dibutuhkan: **Contents: Read and write**.
   - Simpan token-nya (hanya muncul sekali).

## 2. Jalankan lokal (opsional, untuk coba dulu)

```bash
npm install
cp .env.example .env.local
# isi .env.local: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH
npm run dev
```

Buka http://localhost:3000

## 3. Deploy ke Vercel

1. Push folder project ini ke sebuah repo GitHub (repo untuk **kode aplikasi**,
   boleh beda dengan repo `tourl-data` yang khusus penyimpanan data).
2. Buka https://vercel.com/new, import repo kode tadi.
3. Di step **Environment Variables**, isi:

   | Key | Value |
   |---|---|
   | `GITHUB_TOKEN` | token dari langkah 1 |
   | `GITHUB_OWNER` | username/organisasi GitHub kamu |
   | `GITHUB_REPO` | `tourl-data` (repo penyimpanan) |
   | `GITHUB_BRANCH` | `main` |
   | `NEXT_PUBLIC_BASE_URL` | isi setelah deploy pertama, contoh `https://tourl-kamu.vercel.app` |

4. Klik **Deploy**.
5. Setelah dapat domain Vercel-nya, masuk lagi ke Project Settings → Environment
   Variables, update `NEXT_PUBLIC_BASE_URL` dengan domain asli, lalu redeploy
   (dipakai supaya meta `og:image` dan `og:url` absolut, bukan relatif).

## Struktur project

```
pages/
  index.js              halaman utama (form shorten + daftar link)
  [code].js             handler redirect + preview OG untuk bot
  api/
    shorten.js           POST buat link baru (+ upload foto)
    links.js              GET daftar semua link
    image/[...path].js    proxy untuk menyajikan foto dari repo GitHub
lib/
  github.js              semua komunikasi ke GitHub Contents API
  code.js                generator kode pendek acak
```

## Batasan yang perlu kamu tahu

- GitHub Contents API punya rate limit (5000 request/jam untuk token biasa).
  Cukup untuk pemakaian personal/tim kecil, tapi bukan untuk trafik tinggi.
- Update `links.json` memakai skema baca-lalu-tulis sederhana; kalau ada dua
  request "create link" yang benar-benar bersamaan, ada sedikit kemungkinan race
  condition. Ada retry 1x otomatis untuk kasus ini.
- Setiap link/foto baru = 1-2 commit baru di repo `tourl-data`. Ini disengaja
  (sesuai request: "penyimpanan ke GitHub"), tapi berarti riwayat commit repo
  akan panjang seiring waktu — itu normal.
- Ukuran foto dibatasi 5MB di frontend.

## Kustomisasi cepat

- Ganti warna/aksen: edit `tailwind.config.js` (token warna `ink`, `moss`, `wheat`, dll).
- Ganti daftar bot yang dianggap "crawler" (untuk preview OG): edit regex `BOT_UA`
  di `pages/[code].js`.
- Mau pakai custom domain sendiri (bukan `*.vercel.app`)? Tinggal tambahkan domain
  itu di Vercel Project Settings → Domains, lalu update `NEXT_PUBLIC_BASE_URL`.
# tourl
