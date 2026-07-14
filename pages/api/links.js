import { listLinks } from "../../lib/github";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  try {
    const links = await listLinks();
    return res.status(200).json({ links });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Gagal mengambil data." });
  }
}
