# 🧹 Guia de Qualidade de Código

Este documento detalha como configurar e usar as ferramentas de qualidade de código do projeto BordadosApp.

## 📚 Índice

1. [Ferramentas Utilizadas](#ferramentas-utilizadas)
2. [Setup Inicial](#setup-inicial)
3. [Pre-commit Hooks](#pre-commit-hooks)
4. [Rodando Validações Localmente](#rodando-validações-localmente)
5. [Troubleshooting](#troubleshooting)

---

## Ferramentas Utilizadas

### Backend (Python)

| Ferramenta | Propósito | Documentação |
|-----------|----------|--------------|
| **Black** | Formatador de código opinionado | [black.readthedocs.io](https://black.readthedocs.io/) |
| **isort** | Organizador de imports | [pycqa.github.io/isort](https://pycqa.github.io/isort/) |
| **Flake8** | Linter (verifica erros de estilo) | [flake8.pycqa.org](https://flake8.pycqa.org/) |
| **mypy** | Type checking estático | [mypy-lang.org](https://www.mypy-lang.org/) |
| **pytest** | Framework de testes | [pytest.org](https://pytest.org/) |

### Frontend (JavaScript/TypeScript)

| Ferramenta | Propósito | Documentação |
|-----------|----------|--------------|
| **ESLint** | Linter de JavaScript/TypeScript | [eslint.org](https://eslint.org/) |
| **TypeScript** | Type checking | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Vite** | Build tool | [vitejs.dev](https://vitejs.dev/) |

### Automation

| Ferramenta | Propósito | Documentação |
|-----------|----------|--------------|
| **pre-commit** | Git hooks automáticos | [pre-commit.com](https://pre-commit.com/) |
| **GitHub Actions** | CI/CD pipeline | [github.com/features/actions](https://github.com/features/actions) |

---

## Setup Inicial

### 1. Instalação com Docker (Recomendado)

```bash
# Clonar repositório
git clone <repo-url>
cd bordados-app

# Subir containers (tudo é instalado automaticamente)
docker compose up -d

# Pronto! Tudo já está configurado.
```

### 2. Instalação Local (Sem Docker)

#### Backend

```bash
cd api

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows

# Instalar dependências + ferramentas de desenvolvimento
pip install -r requirements.txt
pip install -r requirements-dev.txt

# ✅ Pronto!
```

#### Frontend

```bash
cd app

# Instalar dependências
npm install

# ✅ Pronto!
```

---

## Pre-commit Hooks

Pre-commit hooks rodam automaticamente **antes** de cada commit, validando seu código e evitando problemas.

### Setup

```bash
# Instalar pre-commit framework
pip install pre-commit

# Configurar git hooks (de dentro do repositório)
cd /caminho/para/bordados-app
pre-commit install

# ✅ Pronto! Os hooks rodará antes de cada commit.
```

### Como Funciona

Quando você executa `git commit`:

1. ✅ Pre-commit roda automaticamente
2. 🔍 Valida formatação (Black, isort)
3. 🔍 Verifica linting (Flake8)
4. 🔍 Verifica outros erros (trailing whitespace, arquivos grandes, etc)

**Se passar:** Commit é criado normalmente.

**Se falhar:** Commit é bloqueado e você vê os erros.

### Comportamento das Ferramentas

| Ferramenta | Comportamento |
|-----------|--------------|
| Black, isort | ✅ Auto-corrige (você precisa fazer stage das mudanças) |
| Flake8 | ❌ Rejeita o commit (você precisa corrigir) |
| Trailing whitespace | ✅ Auto-corrige |
| Large files | ❌ Rejeita o commit |
| Private keys | ❌ Rejeita o commit |

### Exemplo: Commit com Erro

```bash
$ git commit -m "Add new feature"

# Pre-commit hooks running...
# ❌ Black failed - formatting issues found
# 
# Formatting fixed by Black. Please review changes and stage them again.

$ git add .
$ git commit -m "Add new feature"

# Pre-commit hooks running...
# ✅ All checks passed!
# [main abc1234] Add new feature
```

### Forçar Commit (Cuidado!)

Se você realmente precisa pular os hooks:

```bash
git commit --no-verify
```

⚠️ **Não recomendado!** O CI ainda fará as validações.

---

## Rodando Validações Localmente

### Opção 1: Usar Makefile (Recomendado)

```bash
# Ver todos os comandos disponíveis
make help

# Backend - Validar código
make lint-backend       # Verificar formatação e erros
make format-backend     # Auto-formatar código
make test-backend       # Rodar testes

# Frontend - Validar código
make lint-frontend      # Verificar erros
make format-frontend    # Auto-formatar código
make test-frontend      # Rodar testes

# Tudo junto
make lint               # Lint backend + frontend
make format             # Formatar tudo
make test               # Testes tudo
make ci                 # Simular CI completo
```

### Opção 2: Comandos Diretos (Docker)

#### Backend

```bash
# Validar formatação (Black)
docker compose exec api black --check .

# Auto-formatar
docker compose exec api black . && docker compose exec api isort .

# Validar imports
docker compose exec api isort --check-only .

# Linter (Flake8)
docker compose exec api flake8 .

# Type checking (mypy)
docker compose exec api mypy .

# Rodar testes
docker compose exec api pytest --tb=short
```

#### Frontend

```bash
# Linter
docker compose exec frontend npm run lint

# Auto-fix
docker compose exec frontend npm run lint -- --fix

# Testes
docker compose exec frontend npm run test

# Build
docker compose exec frontend npm run build
```

### Opção 3: Simulate CI Script

Simular a pipeline completa do CI localmente:

```bash
./simulate-ci.sh
```

---

## Configurações

### Backend - pyproject.toml

Configurações centralizadas para Black, isort, mypy e pytest.

```toml
[tool.black]
line-length = 100

[tool.isort]
profile = "black"
line-length = 100

[tool.mypy]
python_version = "3.10"
check_untyped_defs = true

[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "core.settings"
```

### Backend - .flake8

Configuração específica do Flake8.

```ini
[flake8]
max-line-length = 100
exclude = migrations,.venv,build,dist
```

### Backend - .pre-commit-config.yaml

Define quais hooks rodam e como.

```yaml
repos:
  - repo: https://github.com/psf/black
    hooks:
      - id: black
  - repo: https://github.com/pycqa/isort
    hooks:
      - id: isort
  - repo: https://github.com/pycqa/flake8
    hooks:
      - id: flake8
```

### Frontend - .eslintrc.cjs

Configuração do ESLint.

```javascript
module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  // ...
}
```

---

## CI/CD Pipeline

### GitHub Actions

A cada **push** ou **pull request**, o GitHub Actions roda:

1. ✅ Setup Node.js 20
2. ✅ Install frontend dependencies
3. ✅ ESLint + TypeScript + Build
4. ✅ Setup Python 3.10
5. ✅ Install backend dependencies
6. ✅ Black check
7. ✅ isort check
8. ✅ Flake8
9. ✅ mypy (warning only)
10. ✅ pytest

**Resultado:**
- ✅ Se passar: PR pode ser mergeado
- ❌ Se falhar: PR é bloqueado até corrigir

---

## Troubleshooting

### Pre-commit hooks não funcionam

```bash
# Verificar se está instalado
pre-commit --version

# Reinstalar
pip install pre-commit

# Limpar cache
pre-commit clean

# Tentar novamente
pre-commit install
```

### Black e isort conflitam

Já está resolvido! Usamos `profile = "black"` no isort para garantir compatibilidade.

### Mypy reclamando de tipos

Mypy é opcional por enquanto (warning only). Para aumentar strictness:

```bash
cd api && mypy . --strict
```

### Flake8 reclamando de linha comprida

Aumente o tamanho em `.flake8`:

```ini
[flake8]
max-line-length = 120  # Aumentado de 100
```

### Problema com pre-commit no Windows

```bash
# Usar WSL (Windows Subsystem for Linux) é recomendado
# Ou instale Git Bash

# No Git Bash:
git config core.safecrlf false
pre-commit install
```

### CI falhando mas código parece OK

Pode ser diferença entre versões. Rode localmente:

```bash
make ci
# ou
./simulate-ci.sh
```

---

## 📖 Recursos Adicionais

- [PEP 8 - Style Guide](https://pep8.org/)
- [Black - The Uncompromising Code Formatter](https://black.readthedocs.io/)
- [isort - Python Utility](https://pycqa.github.io/isort/)
- [Flake8 - Python Linting](https://flake8.pycqa.org/)
- [mypy - Static Type Checker](https://www.mypy-lang.org/)
- [pre-commit Documentation](https://pre-commit.com/)
- [GitHub Actions - Testing](https://docs.github.com/en/actions/automating-builds-and-testing)

---

## ❓ Dúvidas?

- Verifique o README.md principal
- Rode `make help` para ver todos os comandos
- Rode `make ci` para testar localmente
