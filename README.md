# BordadosApp - Sistema de Gestão de Bordados

Sistema web para gestão de uma microempresa de bordados eletrônicos. O projeto combina uma API Django com um frontend React/TypeScript/Vite/Tailwind e roda localmente com Docker Compose.

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

Por padrão, o ambiente local mantém a API aberta para facilitar o desenvolvimento. O Compose de produção é separado e exige autenticação na API.

### 3. Acessar a aplicação

- **Frontend:** http://localhost:5173
- **Backend API (root):** http://localhost:8000/api/
- **Admin (Django admin):** http://localhost:8000/admin/  — criar superuser com `docker compose exec api python manage.py createsuperuser`
- **API Schema (OpenAPI):** http://localhost:8000/api/schema/
- **API Docs (Swagger UI):** http://localhost:8000/api/docs/

Usuário de teste criado automaticamente no ambiente local:

- **E-mail:** `admin@teste.com`
- **Senha:** `admin`

Rotas úteis da API:

- `/api/usuarios/`
- `/api/clientes/`
- `/api/produtos/`
- `/api/pedidos/`
- `/api/itens-pedido/`
- `/api/historico-status/`
- `/api/materiais/`
- `/api/movimentacoes-estoque/`


### 4. Parar a aplicação

```bash
docker compose down
```

## Produção com Nginx

A produção usa Nginx no host como proxy reverso e `docker-compose.prod.yml` para os containers. O Nginx escuta na porta 80; API e frontend são publicados somente em `127.0.0.1`, e o PostgreSQL não publica portas. Os serviços permanecem na rede Docker interna. Esta configuração é HTTP sem TLS; configure HTTPS quando tiver domínio.

O arquivo `.env.prod` contém os segredos locais da implantação, tem permissões restritas e não deve ser versionado. O repositório inclui apenas o modelo sem segredos `.env.prod.example`. Neste servidor, o `.env.prod` já foi gerado com chaves aleatórias; ajuste `DJANGO_ALLOWED_HOSTS` quando o IP público mudar ou quando adicionar domínio.

Instalar o Nginx uma vez no host e ativar a configuração do projeto:

```bash
sudo apt-get update && sudo apt-get install -y nginx
sudo install -m 0644 deploy/nginx/bordados.conf /etc/nginx/sites-available/bordados
sudo ln -sfn /etc/nginx/sites-available/bordados /etc/nginx/sites-enabled/bordados
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl enable --now nginx
```

Na Oracle Cloud, permita entrada TCP/80 no NSG ou Security List. No host, o UFW deve permitir HTTP; a imagem Oracle também carrega um `REJECT` global antes das chains do UFW, então a exceção persistente de TCP/80 deve ficar antes dele. Isso mantém a regra de SSH e não abre as portas dos containers:

```bash
sudo ufw allow 80/tcp
sudo cp -a /etc/iptables/rules.v4 /etc/iptables/rules.v4.bak
grep -qE '^-A INPUT .*--dport 80 -j ACCEPT' /etc/iptables/rules.v4 || sudo sed -i '/^-A INPUT -j REJECT/i -A INPUT -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT' /etc/iptables/rules.v4
sudo iptables -C INPUT -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT || sudo iptables -I INPUT 5 -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
```

Não abra as portas 8000, 4173 ou 5432.

Iniciar ou atualizar a produção:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Acompanhar logs e verificar os serviços:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f
```

Criar um usuário administrativo Django:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api python manage.py createsuperuser
```

A aplicação ficará disponível em `http://<IP-publico>/`. A API e o admin usam os caminhos `/api/` e `/admin/`. Para parar somente os containers de produção, sem remover o Nginx do host:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

Não use `down -v` a menos que queira apagar também os dados persistentes do PostgreSQL.

### Deploy automático pelo GitHub Actions

O workflow `Deploy Production` é acionado somente quando o workflow `CI` termina com sucesso para um `push` em `main`. Pull requests não publicam a aplicação. O deploy conecta ao servidor por SSH, busca o commit aprovado, avança o checkout de produção até esse SHA e executa `docker compose up -d --build`. Ao final, verifica se a página inicial responde por HTTP. O grupo de concorrência evita deploys simultâneos.

O servidor precisa ter Git e Docker Compose instalados, Nginx ativo, o checkout do repositório em uma branch `main` local, o arquivo `.env.prod` configurado e permissão para o usuário de deploy executar Docker. O `origin` desse checkout precisa permitir `git fetch` pelo próprio servidor: se o repositório for privado, configure uma chave SSH de leitura como Deploy key no repositório e aceite `github.com` em `known_hosts`. Por exemplo, gere a chave como usuário de deploy com `ssh-keygen -t ed25519 -C bordados-production-readonly -f ~/.ssh/bordados_github -N ''`, adicione o conteúdo de `~/.ssh/bordados_github.pub` em **Settings > Deploy keys** com acesso somente de leitura e configure o `origin` para usar essa identidade. Essa chave de leitura do GitHub é distinta da chave usada pelo Actions para entrar no servidor. O checkout não pode ter alterações rastreadas locais; o deploy para se encontrar modificações para evitar sobrescrevê-las.

No GitHub, crie o Environment `production` em **Settings > Environments**, restrinja as branches de deploy a `main` e cadastre nele estes secrets:

- `DEPLOY_HOST`: IP ou hostname SSH do servidor, sem esquema `http://`.
- `DEPLOY_USER`: usuário Linux que possui o checkout e pode executar Docker.
- `DEPLOY_SSH_KEY`: chave privada Ed25519 dedicada para o Actions conectar ao servidor.
- `DEPLOY_KNOWN_HOSTS`: linha(s) de chave(s) de host SSH do servidor, obtidas com `ssh-keyscan -H <IP-ou-host>` e verificadas por fingerprint usando um canal confiável antes de salvar.
- `DEPLOY_PATH`: caminho absoluto do checkout, por exemplo `/home/ubuntu/bordados-silvinha`.

Gere uma chave exclusiva para o Actions em uma máquina administrativa confiável e instale somente a chave pública no usuário de deploy, preservando as entradas existentes de `authorized_keys`:

```bash
ssh-keygen -t ed25519 -C github-actions-bordados-deploy -f bordados-deploy
ssh-copy-id -i bordados-deploy.pub <usuario>@<servidor>
```

Cadastre o conteúdo de `bordados-deploy` em `DEPLOY_SSH_KEY`; mantenha esse arquivo privado fora do repositório. Para `DEPLOY_KNOWN_HOSTS`, confira o fingerprint da saída de `ssh-keyscan` com a informação obtida no console ou em um canal confiável do provedor antes de adicioná-la ao Environment. Não desative a verificação da chave do servidor. Depois de mesclar alterações em `main`, acompanhe as execuções de `CI` e `Deploy Production` na aba **Actions**.

---

## Comandos úteis de desenvolvimento

### Ferramentas de teste

- **pytest** - Framework de testes [📖](https://pytest.org/)
- **Vitest** - Framework de testes do frontend [📖](https://vitest.dev/)

### Rodar testes

**Usar Makefile (recomendado):**

```bash
# Ver todos os comandos disponíveis
make help

# Rodar testes dentro do Docker Compose
make test

# Simular o pipeline de CI localmente
make ci
```

### Testar o CI e corrigir erros

Quando quiser validar exatamente o que o CI vai executar, siga esta ordem:

1. Rode `make ci` na raiz do projeto. Isso executa os testes automatizados dentro dos containers.
2. Se falhar no backend, rode `make test-backend` para ver o erro mais específico.
3. Se falhar no frontend, rode `make test-frontend` para ver o erro mais específico.
4. Corrija o arquivo indicado pelo erro e rode o comando que falhou de novo.
5. Quando os comandos separados passarem, rode `make ci` novamente para confirmar o fluxo completo.

Se quiser inspecionar manualmente os containers, use:

```bash
docker compose exec api pytest --tb=short
docker compose exec frontend npm run test -- --run
```

Se houver erro de ambiente, confirme antes que o arquivo `.env` da raiz existe e que `api/.env` e `app/.env` estão preenchidos.

**Com Docker:**

```bash
# Backend
docker compose exec api pytest --tb=short

# Frontend
docker compose exec frontend npm run test -- --run
```

### CI/CD Pipeline

A cada Push ou Pull Request, o GitHub Actions roda:
- ✅ Testes do backend com PostgreSQL
- ✅ Testes do frontend

Se falhar, o PR não pode ser mergeado até corrigir.

---

## 🛠️ Comandos Úteis de Desenvolvimento

### Docker Compose geral

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
│   ├── commerce/
│   │   ├── dashboard.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── tests/
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── Dockerfile
├── app/
│   ├── App.tsx
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── services/
│   │   ├── theme/
│   │   └── utils/
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
├── simulate-ci.sh
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
# Testes do backend dentro do container
docker compose exec api pytest --tb=short

# Testes do frontend dentro do container
docker compose exec frontend npm run test -- --run
```

### 4. Fazer commit e push

```bash
git add .
git commit -m "feat: descrição clara da sua mudança"
git push origin feature/minha-funcionalidade
```

### 5. Abrir Pull Request

O CI/CD rodará automaticamente no GitHub Actions, validando:
- ✅ Testes do backend com PostgreSQL
- ✅ Testes do frontend

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
