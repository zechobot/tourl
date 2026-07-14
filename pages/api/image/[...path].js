import { getRawFile } from "../../../lib/github";

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export default async function handler(req, res) {
  try {
    const parts = req.query.path;
    if (!Array.isArray(parts) || parts.length === 0) {
      return res.status(400).end("Path tidak valid.");
    }
    const filePath = `images/${parts.join("/")}`;
    const ext = parts[parts.length - 1].split(".").pop().toLowerCase();
    const buffer = await getRawFile(filePath);

    if (!buffer) return res.status(404).end("Foto tidak ditemukan.");

    res.setHeader("Content-Type", MIME_BY_EXT[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    return res.status(500).end("Gagal mengambil foto.");
  }
}
