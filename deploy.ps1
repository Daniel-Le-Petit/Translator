# Script de déploiement pour leave-tracker
param(
    [string]$message = "update"
)

# Chemins corrects
$gitPath = "C:\Program Files\Git\cmd"
$ghExe   = "C:\Program Files\GitHub CLI\gh.exe"

# Ajout de Git au PATH (session courante)
if ($Env:PATH -notlike "*$gitPath*") {
    $Env:PATH += ";$gitPath"
}

$logFile = ".\git.log"
"=== Git script lancé à $(Get-Date) ===" | Out-File $logFile

try {

    # Vérification GitHub CLI
    if (-not (Test-Path $ghExe)) {
        throw "GitHub CLI introuvable : $ghExe"
    }

    # Vérification dépôt git local
    if (-not (Test-Path ".git")) {
        "`n== Initialisation du dépôt Git local ==" | Out-File $logFile -Append
        git init | Out-File $logFile -Append
        git branch -M main | Out-File $logFile -Append
    }

    # Vérification du remote origin
    $remoteExists = git remote | Select-String "origin"

    if (-not $remoteExists) {
        "`n== Création du repo GitHub si inexistant ==" | Out-File $logFile -Append

        $repoName = Split-Path -Leaf (Get-Location)
        $githubUser = & $ghExe api user -q .login

        # Vérifie si le repo existe déjà
        & $ghExe repo view "$githubUser/$repoName" 2>$null

        if ($LASTEXITCODE -ne 0) {
            & $ghExe repo create $repoName --private --source=. --remote=origin --push |
                Out-File $logFile -Append
        }
        else {
            git remote add origin "https://github.com/$githubUser/$repoName.git"
        }
    }

    "`n== Remote(s) ==" | Out-File $logFile -Append
    git remote -v | Out-File $logFile -Append

    "`n== Statut du dépôt ==" | Out-File $logFile -Append
    git status | Out-File $logFile -Append

    "`n== Pull des dernières modifs ==" | Out-File $logFile -Append
    git pull origin main --rebase | Out-File $logFile -Append

    "`n== Ajout des fichiers ==" | Out-File $logFile -Append
    git add . | Out-File $logFile -Append

    "`n== Commit ==" | Out-File $logFile -Append
    if (-not (git diff --cached --quiet)) {
        git commit -m $message | Out-File $logFile -Append
    }
    else {
        "Aucun changement à commit." | Out-File $logFile -Append
    }

    "`n== Push vers GitHub ==" | Out-File $logFile -Append
    git push -u origin main | Out-File $logFile -Append

    "Script terminé avec succès." | Out-File $logFile -Append
}
catch {
    "Une erreur est survenue : $_" | Out-File $logFile -Append
}

Get-Content $logFile
