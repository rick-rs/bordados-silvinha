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
# Iniciar backend (API Django) e frontend (React)
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

# Criar ambiente virtual Python
python3 -m venv venv

# Ativar ambiente virtual
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Rodar migrations (banco de dados)
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
├── api/                          # Backend Django
│   ├── core/                    # Configurações do projeto
│   │   ├── settings.py          # Configurações do Django
│   │   ├── urls.py              # Rotas principais
│   │   ├── asgi.py              # ASGI para produção
│   │   └── wsgi.py              # WSGI para produção
│   ├── manage.py                # Gerenciador Django
│   ├── requirements.txt          # Dependências Python
│   ├── Dockerfile               # Imagem Docker do backend
│   └── db.sqlite3               # Banco de dados (local)
│
├── app/                          # Frontend React + Vite
│   ├── src/
│   │   ├── App.tsx              # Componente raiz
│   │   └── index.tsx            # Ponto de entrada
│   ├── index.html               # HTML principal
│   ├── package.json             # Dependências Node
│   ├── tsconfig.json            # Configuração TypeScript
│   ├── vite.config.ts           # Configuração Vite
│   ├── .eslintrc.cjs            # Configuração ESLint
│   ├── Dockerfile               # Imagem Docker do frontend
│   └── node_modules/            # Dependências instaladas (Git ignored)
│
├── docker-compose.yml           # Orquestração de containers
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline CI/CD (GitHub Actions)
└── README.md                    # Este arquivo
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

---

## ✨ Funcionalidades

### Dashboard
- Visão geral com indicadores: pedidos em andamento, faturamento mensal, pedidos atrasados e alertas de estoque
- Painel de alertas de prazo com destaque para pedidos próximos ao vencimento ou atrasados
- Painel de reposição de estoque com materiais abaixo do mínimo
- Tabela de pedidos recentes com status e pagamento
- Botão flutuante (FAB) para nova encomenda no mobile

### Pedidos
- Listagem completa de pedidos com filtros
- Criação de novos pedidos com seleção de cliente, produtos e bordados
- Detalhamento do pedido com histórico de status
- Fluxo de status: Recebido -> Aguardando Matriz -> Em Produção -> Pronto para Entrega -> Entregue
- Suporte a cancelamento com motivo
- Marcação de pedido urgente
- Registro de canal de origem (Instagram, WhatsApp, Facebook, Marketplace)
- Controle de pagamento (Pix, Dinheiro, Cartão, Transferência) com status (Pendente, Parcial, Pago)

### Clientes
- Cadastro completo com nome, telefone, e-mail, rede social
- Endereço completo (CEP, rua, número, complemento, bairro, cidade, estado)
- Listagem e exclusão de clientes

### Produtos e Catálogo
- Cadastro de peças (toalhas, fraldas, etc.) e bordados (nomes, flores, monogramas, etc.)
- Informações: descrição, preço base, tempo estimado, categoria/subcategoria
- Quantidade de pontos para bordados
- Catálogo visual para consulta

### Estoque
- Cadastro de materiais (linhas, entretelas, tecidos)
- Controle de quantidade atual e estoque mínimo
- Movimentações de entrada e saída com observações
- Alertas automáticos quando estoque está abaixo do mínimo

### Agenda
- Calendário mensal com visualização dos pedidos por data de prazo
- Destaque para pedidos urgentes e atrasados

## 💻 Tecnologias

### Backend
- **Django 4.2+** - Framework web Python [📖](https://www.djangoproject.com/)
- *📊 *SQLite** - Banco de dados relacional
- **Python 3.10+** - Linguagem de programação

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces [📖](https://react.dev/)
- **Vite 5** - Bundler moderno e rápido [📖](https://vitejs.dev/)
- **TypeScript** - JavaScript com tipagem estática [📖](https://www.typescriptlang.org/)
- **React Router** - Roteamento de páginas [📖](https://reactrouter.com/)

### DevOps
- **Docker** - Containerização [📖](https://www.docker.com/)
- **Docker Compose** - Orquestração local [📖](https://docs.docker.com/compose/)
- **GitHub Actions** - CI/CD automático [📖](https://docs.github.com/en/actions)

---

### Cliente
Nome, telefone, e-mail, rede social, endereço completo (CEP, rua, número, complemento, bairro, cidade, estado).

### Produto
Nome, descrição, imagem, preço base, tempo estimado, categoria, subcategoria, tipo (peça ou bordado), quantidade de pontos (para bordados).

### Pedido
Cliente, data do pedido, prazo, canal de origem, forma e status de pagamento, urgência, observações, itens (produto, quantidade, valor, descrição do bordado), valor total, status com histórico de alterações.

### Material
Nome, descrição, unidade de medida, quantidade atual, estoque mínimo.

### Movimentação de Estoque
Material, tipo (entrada/saída), quantidade, data, observação.
