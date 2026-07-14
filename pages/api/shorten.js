import { saveLink, uploadImage } from "../../lib/github";
import { randomCode, isValidAlias } from "../../lib/code";

export const config = {
  api: {
    bodyParser: { sizeLimit: "8mb" }, // biar foto base64 muat
  },
};

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  try {
    const { url, alias, title, image } = req.body || {};

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: "URL tujuan tidak valid." });
    }

    let code = (alias || "").trim();
    if (code) {
      if (!isValidAlias(code)) {
        return res.status(400).json({
          error: "Alias harus 3-32 karakter, hanya huruf/angka/-/_ dan bukan kata yang dipakai sistem.",
        });
      }
    } else {
      code = randomCode(6);
    }

    let imageData = null;
    if (image) {
      imageData = await uploadImage(code, image);
    }

    const record = {
      url,
      title: title || null,
      image: imageData ? imageData.url : null,
      createdAt: Date.now(),
      clicks: 0,
    };

    await saveLink(code, record);

    return res.status(200).json({ code, ...record });
  } catch (err) {
    console.error(err);
    const msg = err.message || "Terjadi kesalahan di server.";
    const isClientErr = msg.includes("sudah dipakai");
    return res.status(isClientErr ? 409 : 500).json({ error: msg });
  }
}
