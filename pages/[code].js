import Head from "next/head";
import { getLink, bumpClicks } from "../lib/github";

const BOT_UA = /(facebookexternalhit|Twitterbot|Slackbot|TelegramBot|WhatsApp|LinkedInBot|Discordbot|Googlebot|Pinterest|SkypeUriPreview|redditbot)/i;

export default function ShortLinkPage({ record, code, baseUrl }) {
  // Halaman ini hanya benar-benar dirender untuk crawler/bot (lihat getServerSideProps).
  // Manusia biasa langsung di-redirect 302 sebelum sampai sini.
  const title = record.title || `tourl · ${code}`;
  const image = record.image ? `${baseUrl}${record.image}` : undefined;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${baseUrl}/${code}`} />
        {image && <meta property="og:image" content={image} />}
        <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={title} />
        {image && <meta name="twitter:image" content={image} />}
        <meta httpEquiv="refresh" content={`0; url=${record.url}`} />
      </Head>
      <main style={{ fontFamily: "sans-serif", padding: "2rem", color: "#e6edf3", background: "#0d1117", minHeight: "100vh" }}>
        <p>
          Mengarahkan ke <a href={record.url} style={{ color: "#3fb950" }}>{record.url}</a>…
        </p>
      </main>
    </>
  );
}

export async function getServerSideProps({ params, req, res }) {
  const { code } = params;
  const record = await getLink(code);

  if (!record) {
    return { notFound: true };
  }

  const ua = req.headers["user-agent"] || "";
  const isBot = BOT_UA.test(ua);

  if (!isBot) {
    bumpClicks(code).catch(() => {});
    return {
      redirect: {
        destination: record.url,
        permanent: false,
      },
    };
  }

  const proto = req.headers["x-forwarded-proto"] || "http";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${req.headers.host}`;

  return {
    props: { record, code, baseUrl },
  };
}
