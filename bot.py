"""
Bot Discord : accès à un salon par mot de passe, sans rôle.
Le bot ajoute une permission individuelle (sur le membre) au salon caché.

Installation :  pip install -U discord.py
Lancement :
    export DISCORD_TOKEN="token_du_bot"
    export SALON_ID="123456789012345678"
    export SALON_MDP="ton_mot_de_passe"
    python bot.py
"""
import os
import hmac
import discord
from discord import app_commands

TOKEN = os.environ["DISCORD_TOKEN"]
SALON_ID = int(os.environ["SALON_ID"])
MOT_DE_PASSE = os.environ["SALON_MDP"].encode()

client = discord.Client(intents=discord.Intents.default())
tree = app_commands.CommandTree(client)


@tree.command(name="acces", description="Entrer le mot de passe du salon privé")
@app_commands.describe(mot_de_passe="Le mot de passe du salon")
@app_commands.checks.cooldown(1, 30.0)  # 1 essai toutes les 30 s par personne
async def acces(interaction: discord.Interaction, mot_de_passe: str):
    # Comparaison à temps constant
    if not hmac.compare_digest(mot_de_passe.encode(), MOT_DE_PASSE):
        await interaction.response.send_message("❌ Mot de passe incorrect.", ephemeral=True)
        return

    salon = interaction.guild.get_channel(SALON_ID)
    if salon is None:
        await interaction.response.send_message("⚠️ Salon introuvable.", ephemeral=True)
        return

    await salon.set_permissions(
        interaction.user,
        view_channel=True,
        send_messages=True,
        read_message_history=True,
        reason="Mot de passe correct",
    )
    await interaction.response.send_message(f"✅ Accès accordé à {salon.mention}", ephemeral=True)


@acces.error
async def acces_error(interaction: discord.Interaction, error):
    if isinstance(error, app_commands.CommandOnCooldown):
        await interaction.response.send_message(
            f"⏳ Réessaie dans {error.retry_after:.0f} s.", ephemeral=True
        )
    else:
        raise error


@client.event
async def on_ready():
    await tree.sync()
    print(f"Connecté en tant que {client.user}")


client.run(TOKEN)
