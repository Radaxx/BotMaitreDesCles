# Bot Maître des Clés

Bot Discord qui donne accès à un salon caché par mot de passe, sans rôle :
la commande `/acces mot_de_passe:...` ajoute une permission individuelle au membre.

## Variables d'environnement (Railway → Variables)

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot |
| `SALON_ID` | ID du salon protégé |
| `SALON_MDP` | Mot de passe |

## Configuration Discord

1. Salon : **Voir le salon ❌** pour `@everyone`.
2. Bot dans les permissions du salon : ✅ Voir le salon, Envoyer des messages,
   Voir les anciens messages, Gérer les permissions.
3. Invitation avec les scopes `bot` + `applications.commands`.
