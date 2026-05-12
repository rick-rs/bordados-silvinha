# BordadosApp - Sistema de Gestão de Bordados

Sistema web completo para gestão de um atelier de bordados, permitindo o controle de pedidos, clientes, produtos, catálogo e estoque de materiais.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** (versão 20+) - [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (versão 2+) - [Instalar Docker Compose](https://docs.docker.com/compose/install/)
- **Git** - [Instalar Git](https://git-scm.com/book/pt-BR/v2/Começando-Instalando-o-Git)

---

## 🚀 Guia de Início Rápido (Recomendado)

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/bordados-app.git
cd bordados-app
```

### 2. Subir a aplicação com Docker Compose

```bash
# Iniciar PostgreSQL, backend (API Django) e frontend (React)
docker compose up -d

# Acompanhar os logs da aplicação (Ctrl+C para sair)
docker compose logs -f
```

O Docker Compose lê o arquivo `.env` da raiz para valores como banco e URL do frontend. Os arquivos `api/.env` e `app/.env` alimentam os containers e devem ser mantidos sincronizados com os exemplos.

### 3. Acessar a aplicação

- **Frontend:** http://localhost:5173
- **Backend API (root):** http://localhost:8000/api/
- **Admin (Django admin):** http://localhost:8000/admin/  — criar superuser com `docker compose exec api python manage.py createsuperuser`
- **API Schema (OpenAPI):** http://localhost:8000/api/schema/
- **API Docs (Swagger UI):** http://localhost:8000/api/docs/

Usuário de teste criado automaticamente no ambiente local:

- **E-mail:** `admin@teste.com`
- **Senha:** `admin`

Outras rotas úteis (serão expandidas):
- Recursos de domínio estão disponíveis sob `/api/` — ex.: `/api/clientes/`, `/api/produtos/`, `/api/pedidos/`.


### 4. Parar a aplicação

```bash
docker compose down
```

---

## ️ Comandos Úteis de Desenvolvimento
## 🧹 Qualidade de Código (Code Quality)

Usamos as melhores práticas do mercado para manter a qualidade do código:

### Ferramentas de Qualidade

- **Black** - Formatador de código opinionado [📖](https://black.readthedocs.io/)
- **isort** - Organizador de imports [📖](https://pycqa.github.io/isort/)
- **Flake8** - Linter Python [📖](https://flake8.pycqa.org/)
- **mypy** - Type checking estático [📖](https://www.mypy-lang.org/)
- **pytest** - Framework de testes [📖](https://pytest.org/)
- **ESLint** - Linter JavaScript/TypeScript (Frontend) [📖](https://eslint.org/)

### Validar Código

**Usar Makefile (recomendado):**

```bash
# Ver todos os comandos disponíveis
make help

# Validar tudo (backend + frontend) dentro do Docker Compose
make lint

# Auto-formatar código dentro do Docker Compose
make format

# Rodar testes dentro do Docker Compose
make test

# Simular o pipeline de CI
make ci
```

### Testar o CI e corrigir erros

Quando quiser validar exatamente o que o CI vai executar, siga esta ordem:

1. Rode `make ci` na raiz do projeto. Isso executa lint, testes e build dentro dos containers.
2. Se falhar no backend, rode `make lint-backend` para ver o erro mais específico.
3. Se falhar no frontend, rode `make lint-frontend` e depois `make build-frontend`.
4. Corrija o arquivo indicado pelo erro e rode o comando que falhou de novo.
5. Quando os comandos separados passarem, rode `make ci` novamente para confirmar o fluxo completo.

Se quiser inspecionar manualmente os containers, use:

```bash
docker compose exec api flake8 .
docker compose exec api pytest --tb=short
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

Se houver erro de ambiente, confirme antes que o arquivo `.env` da raiz existe e que `api/.env` e `app/.env` estão preenchidos.

**Com Docker:**

```bash
# Backend linting
docker compose exec api black --check .
docker compose exec api isort --check-only .
docker compose exec api flake8 .

# Backend auto-format
docker compose exec api black . && docker compose exec api isort .

# Frontend linting
docker compose exec frontend npm run lint
```

### CI/CD Pipeline

A cada Push ou Pull Request, o GitHub Actions roda:
- ✅ Lint completo (backend + frontend)
- ✅ Build (verifica se compila)
- ✅ Testes do backend com PostgreSQL

Se falhar, o PR não pode ser mergeado até corrigir.

---

## 🛠️ Comandos Úteis de Desenvolvimento

### Docker Compose Geral

```bash
# Reconstruir imagens (após mudanças em Dockerfile)
docker compose up -d --build

# Limpar volumes (cuidado: apaga dados do banco!)
docker compose down -v

# Ver status dos containers
docker compose ps

# Inspecionar logs de um serviço específico
docker compose logs api
docker compose logs frontend

# Reiniciar um serviço
docker compose restart api
docker compose restart frontend
```

---

## 🗂️ Estrutura do Projeto

```
bordados-app/
├── api/
│   ├── core/
│   │   ├── settings.py
│   │   └── ... (outras configurações)
│   ├── manage.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── Dockerfile
├── app/
│   ├── App.tsx
│   ├── index.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .eslintrc.cjs
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
├── pyproject.toml
├── Makefile
├── CONTRIBUTING.md
└── README.md
```

---

## 🔄 Workflow de Desenvolvimento

### 1. Criar uma branch para sua feature

```bash
git checkout -b feature/minha-funcionalidade
```

### 2. Fazer mudanças no código

- **Backend:** edite arquivos em `api/`
- **Frontend:** edite arquivos em `app/`

### 3. Validar suas mudanças

```bash
# Lint e build do frontend dentro do container
docker compose exec frontend npm run lint
docker compose exec frontend npm run build

# Testes do backend dentro do container
docker compose exec api pytest
```

### 4. Fazer commit e push

```bash
git add .
git commit -m "feat: descrição clara da sua mudança"
git push origin feature/minha-funcionalidade
```

### 5. Abrir Pull Request

O CI/CD rodará automaticamente no GitHub Actions, validando:
- ✅ Lint do frontend
- ✅ Build do frontend
- ✅ Testes do backend com PostgreSQL

---

## 🐛 Troubleshooting

### Frontend não inicia / restart loop

**Problema:** Container do frontend reinicia continuamente
**Solução:** O volume `frontend_node_modules` garante que `node_modules` não seja apagado. Se o problema persistir:

```bash
# Limpar e reconstruir
docker compose down -v
docker compose up -d --build
```

### Porta 5173 já em uso

```bash
# Encontrar o processo usando a porta
lsof -i :5173

# Matar o processo (substitua PID)
kill -9 <PID>

# Ou ajustar a porta no docker-compose.yml antes de subir novamente
```

### Banco de dados com erro

```bash
# Resetar banco (cuidado: apaga tudo!)
docker compose down -v
docker compose up -d

# Depois rodar migrations
docker compose exec api python manage.py migrate
```

### Dependências desatualizadas

```bash
# Recriar os containers e renovar os volumes de dependências
docker compose down -v
docker compose up -d --build
```

---

## 📚 Documentações Oficiais

- [Docker Documentation](https://docs.docker.com/)
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
