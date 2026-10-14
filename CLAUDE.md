@AGENTS.md

## Deploy

Produção é a VPS stockly (CloudPanel, site `getclevernote.app`), não Laravel Cloud. Push na `main` roda `.github/workflows/deploy.yml`, que chama `/home/clevernote/deploy.sh` (cópia em `deploy/deploy.sh`). Conferir com `curl https://getclevernote.app/REVISION`.
