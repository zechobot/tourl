// lib/github.js
// Semua data link + foto disimpan langsung di repo GitHub lewat GitHub Contents API.
// links.json  -> "database" mapping kode pendek -> data link
// images/*    -> file foto yang diupload user

const GITHUB_API = "https://api.github.com";

function envOrThrow(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Env var ${name} belum di-set. Cek .env.local / Vercel Project Settings.`);
  return val;
}

function ghConfig() {
  return {
    token: envOrThrow("GITHUB_TOKEN"),
    owner: envOrThrow("GITHUB_OWNER"),
    repo: envOrThrow("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

async function ghFetch(path, options = {}) {
  const { token } = ghConfig();
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  return res;
}

// Ambil isi file dari repo. Return { content, sha } atau null kalau belum ada.
async function getFile(filePath) {
  const { owner, repo, branch } = ghConfig();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gagal ambil file ${filePath} dari GitHub: ${res.status} ${body}`);
  }

  const json = await res.json();
  const content = Buffer.from(json.content, "base64").toString("utf-8");
  return { content, sha: json.sha };
}

// Tulis/timpa file di repo (dipakai untuk links.json maupun file foto).
async function putFile(filePath, contentBase64, message, sha) {
  const { owner, repo, branch } = ghConfig();
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gagal menulis file ${filePath} ke GitHub: ${res.status} ${body}`);
  }
  return res.json();
}

const DATA_PATH = "data/links.json";

async function readLinks() {
  const file = await getFile(DATA_PATH);
  if (!file) return { links: {}, sha: null };
  try {
    return { links: JSON.parse(file.content), sha: file.sha };
  } catch {
    return { links: {}, sha: file.sha };
  }
}

async function writeLinks(links, sha, message) {
  const contentBase64 = Buffer.from(JSON.stringify(links, null, 2)).toString("base64");
  await putFile(DATA_PATH, contentBase64, message, sha || undefined);
}

// Simpan satu link baru. Retry sekali kalau ada konflik sha (race condition ringan).
async function saveLink(code, data) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { links, sha } = await readLinks();
    if (links[code]) throw new Error("Kode sudah dipakai, coba kode lain.");
    links[code] = data;
    try {
      await writeLinks(links, sha, `feat: tambah link ${code}`);
      return;
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
}

async function getLink(code) {
  const { links } = await readLinks();
  return links[code] || null;
}

async function listLinks() {
  const { links } = await readLinks();
  return Object.entries(links)
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

async function bumpClicks(code) {
  const { links, sha } = await readLinks();
  if (!links[code]) return;
  links[code].clicks = (links[code].clicks || 0) + 1;
  try {
    await writeLinks(links, sha, `chore: klik +1 untuk ${code}`);
  } catch {
    // gagal update counter bukan hal fatal, redirect tetap harus jalan
  }
}

// Upload foto (data URL base64) ke folder images/ di repo, return path relatif + URL publik.
async function uploadImage(code, dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Format gambar tidak valid, harus base64 data URL.");
  const mime = match[1];
  const base64 = match[2];
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const filePath = `images/${code}.${ext}`;

  await putFile(filePath, base64, `feat: upload foto untuk ${code}`);

  // URL relatif ke endpoint proxy kita sendiri (/api/image/<code>.<ext>), supaya foto tetap
  // bisa ditampilkan walau repo GitHub-nya PRIVATE (proxy yang pegang token, bukan browser).
  // Proxy di pages/api/image/[...path].js otomatis menambahkan prefix "images/".
  const url = `/api/image/${code}.${ext}`;
  return { path: filePath, url, mime };
}

// Ambil raw bytes sebuah file dari repo (dipakai oleh proxy /api/image/[...path]).
async function getRawFile(filePath) {
  const { owner, repo, branch } = ghConfig();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`
  );
  if (!res.ok) return null;
  const json = await res.json();
  return Buffer.from(json.content, "base64");
}

export { saveLink, getLink, listLinks, bumpClicks, uploadImage, getRawFile };
