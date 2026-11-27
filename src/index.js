/**
 * Bot Maître des Clés — Cloudflare Worker
 * Donne accès à un salon caché via /acces <mot_de_passe>, sans rôle :
 * le bot ajoute une permission individuelle (sur le membre) au salon.
 *
 * Secrets requis : DISCORD_PUBLIC_KEY, DISCORD_TOKEN, SALON_ID, SALON_MDP
 */

import { COMMANDS } from "./commands.js";

const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const READ_MESSAGE_HISTORY = 1n << 16n;
// Salon vocal
const STREAM = 1n << 9n;        // Vidéo / partage d'écran
const CONNECT = 1n << 20n;      // Se connecter
const SPEAK = 1n << 21n;        // Parler
const USE_VAD = 1n << 25n;      // Détection de la voix
const PERMISSIONS = (
  VIEW_CHANNEL | SEND_MESSAGES | READ_MESSAGE_HISTORY | STREAM | CONNECT | SPEAK | USE_VAD
).toString();

const EPHEMERAL = 1 << 6;

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      const { pathname } = new URL(request.url);
      if (pathname === "/register") return registerCommands(env);
      return new Response("Bot Maître des Clés en ligne ✅");
    }

    const signature = request.headers.get("X-Signature-Ed25519");
    const timestamp = request.headers.get("X-Signature-Timestamp");
    const body = await request.text();

    if (!signature || !timestamp || !(await verify(env.DISCORD_PUBLIC_KEY, signature, timestamp, body))) {
      return new Response("Signature invalide", { status: 401 });
    }

    const interaction = JSON.parse(body);

    // PING de vérification envoyé par Discord
    if (interaction.type === 1) return json({ type: 1 });

    // Commande slash
    if (interaction.type === 2 && interaction.data.name === "acces") {
      return handleAcces(interaction, env);
    }

    return json({ error: "Interaction inconnue" }, 400);
  },
};

async function handleAcces(interaction, env) {
  const user = interaction.member?.user;
  if (!user) return reply("⚠️ Utilise cette commande sur le serveur.");

  const essai = interaction.data.options?.find((o) => o.name === "mot_de_passe")?.value ?? "";
  if (!(await safeEqual(essai, env.SALON_MDP))) {
    return reply("❌ Mot de passe incorrect.");
  }

  const res = await fetch(
    `https://discord.com/api/v10/channels/${env.SALON_ID}/permissions/${user.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${env.DISCORD_TOKEN}`,
        "Content-Type": "application/json",
        "X-Audit-Log-Reason": encodeURIComponent("Mot de passe correct"),
      },
      body: JSON.stringify({ type: 1, allow: PERMISSIONS }), // type 1 = membre
    }
  );

  if (!res.ok) {
    console.log("Erreur Discord", res.status, await res.text());
    return reply("⚠️ Impossible de donner l'accès (vérifie les permissions du bot sur le salon).");
  }
  return reply(`✅ Accès accordé à <#${env.SALON_ID}>`);
}

// Enregistre (ou met à jour) la commande /acces auprès de Discord.
// Sans risque : renvoie toujours la même liste de commandes.
async function registerCommands(env) {
  const headers = { Authorization: `Bot ${env.DISCORD_TOKEN}`, "Content-Type": "application/json" };
  const app = await fetch("https://discord.com/api/v10/applications/@me", { headers });
  if (!app.ok) {
    return text(`❌ Token refusé par Discord (${app.status}). Vérifie le secret DISCORD_TOKEN.`, 500);
  }
  const { id } = await app.json();
  const res = await fetch(`https://discord.com/api/v10/applications/${id}/commands`, {
    method: "PUT",
    headers,
    body: JSON.stringify(COMMANDS),
  });
  return res.ok
    ? text("✅ Commande /acces enregistrée sur Discord.")
    : text(`❌ Erreur Discord ${res.status} : ${await res.text()}`, 500);
}

// --- Utilitaires ---

function text(body, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function reply(content) {
  return json({ type: 4, data: { content, flags: EPHEMERAL } });
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function verify(publicKey, signature, timestamp, body) {
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToBytes(signature),
      new TextEncoder().encode(timestamp + body)
    );
  } catch {
    return false;
  }
}

// Comparaison à temps constant (via hachage, pour des longueurs égales)
async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b ?? "")),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && b !== undefined;
}
