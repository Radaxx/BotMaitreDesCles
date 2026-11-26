# Bot Maître des Clés

Bot Discord qui donne accès à un salon caché par mot de passe, **sans rôle** :
la commande `/acces mot_de_passe:...` ajoute une permission individuelle au membre.
Hébergé gratuitement sur **Cloudflare Workers** (pas de serveur à garder allumé).

## 1. Discord — préparer le salon

1. Paramètres du salon → Permissions : **Voir le salon ❌** pour `@everyone`.
2. Ajoute le bot aux permissions du salon : ✅ Voir le salon, Envoyer des messages,
   Voir les anciens messages, **Gérer les permissions**.
3. Mode développeur (Paramètres → Avancés) → clic droit sur le salon → *Copier l'identifiant*.

## 2. Cloudflare — déployer

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** →
   **Import a repository** → choisis ce dépôt. Laisse la commande de déploiement par défaut
   (`npx wrangler deploy`) et déploie.
2. Dans le Worker → **Settings → Variables and Secrets**, ajoute (type *Secret*) :

| Nom | Valeur |
|---|---|
| `DISCORD_PUBLIC_KEY` | Developer Portal → *General Information* → Public Key |
| `DISCORD_TOKEN` | Developer Portal → *Bot* → Token |
| `SALON_ID` | ID du salon protégé |
| `SALON_MDP` | Le mot de passe |

3. Copie l'URL du Worker (`https://bot-maitre-des-cles.<ton-compte>.workers.dev`).

## 3. Discord — brancher le Worker

1. Developer Portal → *General Information* → **Interactions Endpoint URL** : colle l'URL du Worker
   et enregistre (Discord vérifie l'URL tout de suite ; les secrets doivent déjà être en place).
2. Enregistre la commande `/acces` : ouvre `https://<url-du-worker>/register` dans ton navigateur.
   (Alternative en local, Node 18+ :)

```bash
DISCORD_TOKEN=ton_token DISCORD_APP_ID=ton_application_id node register.js
```

`DISCORD_APP_ID` = *Application ID* dans *General Information*.

3. Invite le bot (OAuth2 → URL Generator → scopes `bot` + `applications.commands`) si ce n'est pas déjà fait.

## Développement local

```bash
npm install
# crée un fichier .dev.vars avec les 4 secrets
npm run dev
```
