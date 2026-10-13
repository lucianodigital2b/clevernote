#!/usr/bin/env bash
# Deploy do getclevernote.app na VPS. Roda como o user `clevernote`, chamado pelo GitHub Actions
# por SSH. A chave do Actions só pode rodar este script (command= no authorized_keys):
#   command="/home/clevernote/deploy.sh",no-port-forwarding,no-pty,... ssh-ed25519 ... github-actions@clevernote
# O SHA esperado chega em SSH_ORIGINAL_COMMAND. Cópia versionada em deploy/deploy.sh do repo;
# depois de mudar aqui, copiar pra /home/clevernote/deploy.sh.
set -euo pipefail

APP=/home/clevernote/htdocs/getclevernote.app
PHP=/usr/bin/php8.4
SHA="${SSH_ORIGINAL_COMMAND:-}"

if ! [[ "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
    echo "SHA inválido: '$SHA'" >&2
    exit 2
fi

cd "$APP"

exec 9>/home/clevernote/deploy.lock
flock -n 9 || { echo "outro deploy rodando" >&2; exit 3; }

echo "==> git"
git fetch --quiet origin main
if [ "$(git rev-parse origin/main)" != "$SHA" ]; then
    echo "origin/main não é $SHA (já tem commit mais novo?)" >&2
    exit 4
fi
# Checkout de deploy: mudança local no servidor é descartada.
git reset --hard --quiet "$SHA"

echo "==> composer"
$PHP /usr/local/bin/composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --quiet

$PHP artisan optimize:clear

echo "==> npm"
# --ignore-scripts: o prepare é `husky install`, que não serve no servidor.
npm ci --ignore-scripts --no-audit --no-fund --loglevel=error
npm run build --silent

echo "==> artisan"
$PHP artisan migrate --force
$PHP artisan optimize
# O systemd (clevernote-horizon.service) sobe o Horizon de novo com o código novo.
$PHP artisan horizon:terminate

echo "$SHA" > public/REVISION
echo "==> no ar: $SHA"
