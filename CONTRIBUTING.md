# Guia de Contribuicao

Este projeto roda com Docker Compose e o fluxo de validacao foi simplificado para facilitar a colaboracao do grupo. O CI valida apenas os testes automatizados.

## Setup Inicial

```bash
git clone <repo-url>
cd bordados-app
docker compose up -d
```

O Docker Compose sobe PostgreSQL, API Django e frontend React. Confira se os arquivos `.env`, `api/.env` e `app/.env` estao configurados a partir dos exemplos do projeto.

## Rodando Testes

Use o Makefile na raiz do projeto:

```bash
make test
```

Para rodar a mesma validacao do CI localmente:

```bash
make ci
```

Tambem e possivel rodar cada parte separadamente:

```bash
make test-backend
make test-frontend
```

Ou diretamente nos containers:

```bash
docker compose exec api pytest --tb=short
docker compose exec frontend npm run test -- --run
```

## Workflow de Desenvolvimento

1. Crie uma branch para sua alteracao.
2. Faca as mudancas no backend em `api/` ou no frontend em `app/`.
3. Rode os testes automatizados.
4. Faca commit e abra o Pull Request.

```bash
git checkout -b feature/minha-funcionalidade
make ci
git add .
git commit -m "feat: descricao clara da mudanca"
git push origin feature/minha-funcionalidade
```

## CI

O GitHub Actions roda automaticamente em push e pull request para `main`.

Validacoes executadas:

- Testes do backend com PostgreSQL
- Testes do frontend com Vitest

Se alguma validacao falhar, corrija o erro indicado e rode `make ci` novamente antes de atualizar o Pull Request.

## Comandos Uteis

```bash
make help
make docker-up
make docker-down
make docker-logs
make docker-rebuild
```

Para migrations e tarefas Django:

```bash
make makemigrations
make migrate
make createsuperuser
make shell
```
