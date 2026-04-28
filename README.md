# BordadosApp - Sistema de Gestão de Bordados

Sistema web completo para gestão de um atelier de bordados, permitindo o controle de pedidos, clientes, produtos, catálogo e estoque de materiais.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** (versão 20+) - [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (versão 2+) - [Instalar Docker Compose](https://docs.docker.com/compose/install/)
- **Git** - [Instalar Git](https://git-scm.com/book/pt-BR/v2/Começando-Instalando-o-Git)

> **Nota:** Se trabalhar sem Docker, você precisará de **Node.js 20+** e **Python 3.10+**. Veja a seção [Instalação Local](#instalação-local-sem-docker).

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

### 3. Acessar a aplicação

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api

### 4. Parar a aplicação

```bash
docker compose down
```

---

## 📦 Instalação Local (Sem Docker)

Se preferir desenvolver localmente sem Docker:

### Backend (Django)

```bash
# Entrar no diretório da API
cd api

# O backend usa PostgreSQL; defina DATABASE_URL antes de rodar localmente.
# Exemplo: postgres://bordados:bordados@localhost:5432/bordados

# Criar ambiente virtual Python
python3 -m venv venv

# Ativar ambiente virtual
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Rodar migrations no PostgreSQL
python manage.py migrate

# Criar superuser (usuário admin)
python manage.py createsuperuser

# Iniciar servidor de desenvolvimento
python manage.py runserver
# Backend estará em: http://localhost:8000
```

### Frontend (React + Vite)

```bash
# Em outro terminal, entrar no diretório da app
cd app

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
# Frontend estará em: http://localhost:5173
```


## 🪟 Windows (WSL) — Como configurar

Se você desenvolve no Windows recomendamos usar **WSL (Windows Subsystem for Linux)** para ter um ambiente compatível com os comandos e o `Makefile` usados aqui.

Passos rápidos:

1. Abra o PowerShell como Administrador e execute (Windows 10/11):

```powershell
wsl --install -d Ubuntu
```

2. Reinicie o PC se solicitado. Abra a distribuição (ex.: "Ubuntu") e crie seu usuário.

3. Verifique a versão do WSL:

```powershell
wsl -l -v
```

4. Instale o Docker Desktop para Windows e habilite a integração com WSL2 (Settings → Resources → WSL Integration):

- https://docs.docker.com/get-docker/

5. Dentro do WSL, atualize o sistema e instale utilitários:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl
```

6. Use o WSL para rodar os comandos do projeto (recomendado):

```bash
git clone <repo-url>
cd bordados-app
make install-dev
make docker-up
```

Observações:
- É possível usar `make` no PowerShell instalando utilitários adicionais (Chocolatey, MSYS2, etc.), porém WSL oferece compatibilidade máxima.
- Se preferir não usar Docker Desktop, você pode instalar Docker dentro do WSL, mas a integração com Docker Desktop costuma ser mais simples.

## 🛠️ Comandos Úteis de Desenvolvimento
## 🧹 Qualidade de Código (Code Quality)

Usamos as melhores práticas do mercado para manter a qualidade do código:

### Ferramentas Instaladas

- **Black** - Formatador de código opinionado [📖](https://black.readthedocs.io/)
- **isort** - Organizador de imports [📖](https://pycqa.github.io/isort/)
- **Flake8** - Linter Python [📖](https://flake8.pycqa.org/)
- **mypy** - Type checking estático [📖](https://www.mypy-lang.org/)
- **pytest** - Framework de testes [📖](https://pytest.org/)
- **ESLint** - Linter JavaScript/TypeScript (Frontend) [📖](https://eslint.org/)
- **Pre-commit hooks** - Validação automática antes de commits [📖](https://pre-commit.com/)

### Configuração Inicial (Importante!)

Depois de clonar e instalar dependências, configure os pre-commit hooks:

```bash
# Instalar pre-commit framework
pip install pre-commit

# Configurar git hooks (executará validações antes de cada commit)
pre-commit install

# ✅ Pronto! Agora cada commit será validado automaticamente
```

### Validar Código Localmente

**Usar Makefile (recomendado):**

```bash
# Ver todos os comandos disponíveis
make help

# Validar tudo (backend + frontend)
make lint

# Auto-formatar código
make format

# Rodar testes
make test

# Simular CI pipeline local
make ci
```

**Ou diretamente sem Docker (após setup local):**

```bash
# Backend - Validar formatação (Black)
cd api && black --check .

# Backend - Validar imports (isort)
cd api && isort --check-only .

# Backend - Validar código (Flake8)
cd api && flake8 .

# Backend - Type checking (mypy)
cd api && mypy .

# Backend - Auto-formatar
cd api && black . && isort .

# Frontend - Linter
cd app && npm run lint

# Frontend - Auto-fix
cd app && npm run lint -- --fix
```

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

### Pre-commit Hooks (Validação Automática)

Quando você tenta fazer um `git commit`, os hooks validam:
- ✅ Arquivo bem formatado (Black + isort)
- ✅ Sem erros de linting (Flake8)
- ✅ Imports organizados
- ✅ Sem arquivos grandes acidentais
- ✅ JSON válido
- ✅ Sem chaves privadas

Se algo falhar, o commit é **bloqueado** e você vê quais são os problemas. Algumas ferramentas (Black, isort) corrigem automaticamente, outras você precisa arrumar manualmente.

**Para forçar um commit (cuidado!):**

```bash
git commit --no-verify
```

### CI/CD Pipeline

A cada Push ou Pull Request, o GitHub Actions roda:
- ✅ Lint completo (backend + frontend)
- ✅ Build (verifica se compila)
- ✅ Testes do backend com PostgreSQL

Se falhar, o PR não pode ser mergeado até corrigir.

---

## 🛠️ Comandos Úteis de Desenvolvimento

### Backend (API)

```bash
# Acessar o container do backend
docker compose exec api bash

# Ver logs do backend em tempo real
docker compose logs -f api

# Rodar migrations
docker compose exec api python manage.py migrate

# Criar superuser (usuário admin) dentro do container
docker compose exec api python manage.py createsuperuser

# Acessar shell interativo do Django
docker compose exec api python manage.py shell

# Rodar testes
docker compose exec api pytest

# Limpar migrations (cuidado!)
docker compose exec api python manage.py flush
```

### Frontend (React)
# Validar formatação (Black)
docker compose exec api black --check .

# Auto-formatar código (Black + isort)
docker compose exec api black . && docker compose exec api isort .

# Validar imports (isort)
docker compose exec api isort --check-only .

# Linter estrito (Flake8)
docker compose exec api flake8 .

# Type checking (mypy)
docker compose exec api mypy .
```

### Frontend (React)

```bash
# Acessar o container do frontend
docker compose exec frontend bash

# Ver logs do frontend em tempo real
docker compose logs -f frontend

# Rodar linter (verificar código)
docker compose exec frontend npm run lint

# Corrigir automaticamente erros de lint
docker compose exec frontend npm run lint -- --fix

# Executar testes
docker compose exec frontend npm run test

# Gerar build de produção
docker compose exec frontend npm run build
```

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
│   └── db.sqlite3 (legado, não usado com PostgreSQL)
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
├── .pre-commit-config.yaml
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
# Frontend: rodar linter e build
docker compose exec frontend npm run lint
docker compose exec frontend npm run build

# Backend: (quando estiver pronto com testes)
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
- (futuramente: testes do backend)

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

# Ou usar uma porta diferente
docker compose up -d -p 5174:5173
```

### Banco de dados com erro

```bash
# Resetar banco (cuidado: apaga tudo!)
docker compose down -v
docker compose up -d

# Depois rodar migrations
docker compose exec api python manage.py migrate
```

### PostgreSQL local sem Docker

Se preferir não usar o banco do `docker compose`, configure um PostgreSQL local e ajuste o `DATABASE_URL` antes de rodar o backend.

```bash
export DATABASE_URL=postgres://bordados:bordados@localhost:5432/bordados
cd api
python manage.py migrate
python manage.py runserver
```

### Dependências desatualizadas

```bash
# Limpar e reinstalar dependências do frontend
docker compose exec frontend rm package-lock.json
docker compose exec frontend npm install

# Para o backend
docker compose exec api pip install --upgrade -r requirements.txt
```

---

## 📚 Documentações Oficiais

- [Docker Documentation](https://docs.docker.com/)
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
