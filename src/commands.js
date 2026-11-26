// Définition des commandes slash du bot
export const COMMANDS = [
  {
    name: "acces",
    description: "Entrer le mot de passe du salon privé",
    contexts: [0], // serveurs uniquement
    options: [
      { type: 3, name: "mot_de_passe", description: "Le mot de passe du salon", required: true },
    ],
  },
];
