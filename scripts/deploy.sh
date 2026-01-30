#!/usr/bin/env bash
# Déploiement Translator vers GitHub (Render déploie automatiquement depuis GitHub).
# Usage: ./scripts/deploy.sh [message de commit]
# À lancer depuis la racine du projet: /media/daniel/HDD/AIFB/Translator ou depuis ~

set -e

# Répertoire du projet (racine du repo)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

COMMIT_MSG="${1:-update}"

echo "== Répertoire: $PROJECT_ROOT =="

if [[ ! -d .git ]]; then
  echo "Initialisation du dépôt Git..."
  git init
  git branch -M main
fi

if ! git remote get-url origin &>/dev/null; then
  echo "Remote 'origin' absent. Ajoutez-le avec:"
  echo "  git remote add origin https://github.com/Daniel-Le-Petit/Translator.git"
  exit 1
fi

echo "== Statut =="
git status

echo "== Ajout des fichiers =="
git add .

if git diff --cached --quiet; then
  echo "Aucun changement à committer."
else
  echo "== Commit: $COMMIT_MSG =="
  git commit -m "$COMMIT_MSG"
fi

echo "== Pull (rebase) =="
git pull origin main --rebase || true

echo "== Push vers GitHub =="
git push -u origin main

echo "Déploiement poussé. Render déclenchera un déploiement automatique si le service est connecté à ce repo."
