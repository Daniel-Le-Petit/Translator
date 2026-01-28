# Enregistreur de Conversations

Application web moderne pour l'enregistrement, l'édition et l'archivage de conversations en temps réel.

## 🚀 Fonctionnalités

### 1. Enregistrement vocal en temps réel
- **Transcription automatique** via l'API Web Speech Recognition
- Enregistrement vocal depuis le microphone du laptop
- Transcription en temps réel affichée dans l'interface
- Support du français (configurable)
- Indicateur visuel de l'enregistrement en cours

### 2. Page principale de conversation en cours
- Champ de texte large, scrollable et éditable
- Transcription automatique de la conversation vocale
- Structure par prise de parole avec identification des locuteurs
- Mise en forme visuelle claire avec couleurs par participant

### 3. Reconnaissance et gestion des intervenants
- Sélection du participant actuel avant l'enregistrement
- Changement de participant en cours d'enregistrement
- Gestion des participants (ajout, modification, suppression)
- Couleurs distinctes pour chaque participant
- Format automatique : `NomParticipant: message`

### 4. Édition sans perte du flux
- Édition manuelle possible même pendant l'enregistrement (après arrêt)
- Auto-sauvegarde après 2 secondes d'inactivité
- Sauvegarde manuelle disponible
- Préservation du contexte et de la position

### 4. Sauvegarde et structuration
- Enregistrement avec nom structuré (YYYY-MM-DD_type_participants)
- Métadonnées complètes (date, durée, participants, statut, type, dossier, tags)
- Système de dossiers pour organiser les conversations
- Organisation par année/mois, projet, type, etc.

### 5. Recherche et récupération
- Navigation par dossiers
- Recherche par nom, date, participant ou mot-clé
- Liste chronologique avec filtres (statut, dossier)
- Affichage et édition des conversations archivées

## 🛠️ Technologies

- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **date-fns** pour la gestion des dates
- **localStorage** pour la persistance des données

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build
```

## 🎯 Utilisation

### Créer une nouvelle conversation
1. Cliquez sur "➕ Nouvelle conversation"
2. La transcription vocale apparaîtra automatiquement lors de l'enregistrement

### Ajouter des participants
1. Cliquez sur "👥 Gérer les participants" dans la barre latérale
2. Entrez le nom du participant et cliquez sur "Ajouter"
3. Les participants apparaissent avec des couleurs distinctes

### Enregistrer une conversation vocale
1. **Sélectionnez le participant actuel** en cliquant sur son nom (boutons colorés)
2. Cliquez sur **"🎤 Démarrer l'enregistrement"**
3. Autorisez l'accès au microphone si demandé
4. Parlez normalement - la transcription apparaît en temps réel
5. Pour changer de participant, cliquez sur un autre nom (le texte actuel sera finalisé)
6. Cliquez sur **"● Arrêter l'enregistrement"** pour terminer

### Format de conversation
Le format généré automatiquement est :
```
Participant1: Message du participant 1
Participant2: Message du participant 2
```

Chaque changement de participant crée automatiquement une nouvelle ligne.

### Édition manuelle
- Vous pouvez éditer le texte après l'enregistrement
- Les modifications sont sauvegardées automatiquement
- Le texte reste éditable même après transcription

### Organiser les conversations
1. Cliquez sur "⚙️ Métadonnées" dans la barre latérale
2. Définissez le nom, type, dossier et tags
3. Les conversations peuvent être organisées par dossiers (ex: "2024/01", "projet-x")

### Rechercher une conversation
- Utilisez la barre de recherche en haut de la liste
- Filtrez par statut (Active/Archivée)
- Filtrez par dossier si défini

## 📁 Structure du projet

```
src/
├── components/          # Composants React
│   ├── ConversationEditor.tsx
│   ├── ConversationList.tsx
│   ├── ParticipantManager.tsx
│   └── ConversationMetadata.tsx
├── hooks/              # Hooks personnalisés
│   └── useConversation.ts
├── types/              # Types TypeScript
│   └── index.ts
├── utils/              # Utilitaires
│   ├── storage.ts
│   ├── conversationParser.ts
│   └── colors.ts
├── App.tsx             # Composant principal
├── main.tsx            # Point d'entrée
└── index.css           # Styles globaux
```

## 🔮 Évolutions futures possibles

- Transcription automatique (API de reconnaissance vocale)
- Export PDF/Markdown
- Versioning des conversations
- Synchronisation cloud
- Partage de conversations
- Statistiques et analyses

## 📝 Notes

### Compatibilité navigateur
- **Chrome/Edge** : Support complet de la reconnaissance vocale
- **Safari** : Support complet (macOS/iOS)
- **Firefox** : Non supporté (l'API Web Speech Recognition n'est pas disponible)

### Permissions
- L'application nécessite l'autorisation d'accès au microphone
- La première fois, le navigateur demandera la permission
- Si la permission est refusée, vous devrez la réactiver dans les paramètres du navigateur

### Stockage
- Les données sont stockées localement dans le navigateur (localStorage)
- Pour une utilisation en production, envisagez d'ajouter un backend avec base de données
- L'application est responsive et fonctionne sur mobile et desktop

### Langue
- La reconnaissance vocale est configurée en français (fr-FR) par défaut
- Peut être modifiée dans le code si nécessaire
