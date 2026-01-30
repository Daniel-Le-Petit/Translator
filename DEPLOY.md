# Déploiement Translator sur Render.com via GitHub

## Prérequis

- Compte GitHub : **Daniel-Le-Petit**
- Compte [Render.com](https://render.com)
- Git installé sur ta machine
- (Optionnel) [GitHub CLI](https://cli.github.com/) (`gh`) pour créer le repo en une commande

---

## 1. Créer le dépôt GitHub (une seule fois)

### Option A : avec GitHub CLI

```bash
cd /media/daniel/HDD/AIFB/Translator
gh auth login   # si pas déjà connecté
gh repo create Translator --private --source=. --remote=origin --push
```

### Option B : à la main

1. Sur [github.com](https://github.com), clique sur **New repository**.
2. Nom du repo : **Translator** (ou `translator`).
3. Visibilité : **Private** ou **Public**.
4. Ne coche pas "Add a README" (tu as déjà le projet en local).
5. Crée le repo, puis dans ton projet :

```bash
cd /media/daniel/HDD/AIFB/Translator
git remote add origin https://github.com/Daniel-Le-Petit/Translator.git
git branch -M main
git push -u origin main
```

---

## 2. Connecter Render au repo GitHub (une seule fois)

1. Va sur [dashboard.render.com](https://dashboard.render.com).
2. **New** → **Static Site**.
3. Connecte ton compte GitHub si besoin, puis choisis le repo **[Daniel-Le-Petit/Translator](https://github.com/Daniel-Le-Petit/Translator)**.
4. Render lit le fichier **render.yaml** à la racine :
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `dist`
   - Nom du service : `translator`
5. Clique sur **Create Static Site**.
6. Après le premier build, l’URL sera du type : `https://translator-xxxx.onrender.com`.

---

## 3. Déployer (à chaque mise à jour)

### Depuis la racine du projet

```bash
cd /media/daniel/HDD/AIFB/Translator
chmod +x scripts/deploy.sh
./scripts/deploy.sh "Description du changement"
```

Sans argument, le message de commit sera `update` :

```bash
./scripts/deploy.sh
```

### Ce que fait le script

- `git pull origin main --rebase`
- `git add .` puis `git commit -m "..."` s’il y a des changements
- `git push origin main`

Render détecte le push et relance un build + déploiement automatiquement.

---

## 4. Déployer depuis un autre répertoire (ex. home)

Le script s’adapte tout seul : il se base sur l’emplacement de `scripts/deploy.sh` pour trouver la racine du projet. Tu peux l’appeler comme ceci :

```bash
/media/daniel/HDD/AIFB/Translator/scripts/deploy.sh "mon message"
# ou
~/HDD/AIFB/Translator/scripts/deploy.sh "mon message"
```

(En supposant que `~/HDD` ou `/media/daniel/HDD` pointe vers ton disque.)

---

## Fichiers utiles

| Fichier | Rôle |
|--------|------|
| `render.yaml` | Config Render (build, dossier publié, rewrite SPA). |
| `scripts/deploy.sh` | Script bash pour push vers GitHub (déploiement déclenché par Render). |
| `public/_redirects` | Règle SPA pour Render (fallback vers `index.html`). |

---

## Dépannage

- **Le build échoue sur Render**  
  Vérifie les logs dans le dashboard Render. Souvent : `npm run build` doit réussir en local (`npm run build` dans le projet).

- **404 sur une route (ex. /conversation/123)**  
  Le rewrite SPA est dans `render.yaml` et `public/_redirects`. Si ça persiste, dans Render → service → **Redirects/Rewrites**, ajoute une règle : `/*` → `/index.html` (rewrite).

- **Pas de remote `origin`**  
  Ajoute-le :  
  `git remote add origin https://github.com/Daniel-Le-Petit/Translator.git`

- **Authentification GitHub**  
  Utilise un [Personal Access Token](https://github.com/settings/tokens) ou SSH si `git push` te demande un mot de passe.
