// Enregistre la commande /acces auprès de Discord (à lancer une seule fois).
// Usage : DISCORD_TOKEN=xxx DISCORD_APP_ID=yyy node register.js

const { DISCORD_TOKEN, DISCORD_APP_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_APP_ID) {
  console.error("Définis DISCORD_TOKEN et DISCORD_APP_ID.");
  process.exit(1);
}

const commands = [
  {
    name: "acces",
    description: "Entrer le mot de passe du salon privé",
    contexts: [0], // serveurs uniquement
    options: [
      { type: 3, name: "mot_de_passe", description: "Le mot de passe du salon", required: true },
    ],
  },
];

const res = await fetch(`https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`, {
  method: "PUT",
  headers: { Authorization: `Bot ${DISCORD_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(commands),
});

console.log(res.ok ? "✅ Commande /acces enregistrée." : `❌ Erreur ${res.status} : ${await res.text()}`);
