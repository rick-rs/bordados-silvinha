# TODO - Requisitos Pendentes

Guia temporario para acompanhar os requisitos ainda nao contemplados totalmente.
Quando tudo estiver concluido, este arquivo pode ser removido.

## Produto e Funcionalidades Locais

### Catalogo
- [x] Criar tela de cadastro de novo produto/item de catalogo.
- [x] Expor e editar `tempo_estimado` no frontend.

### Pedidos
- [x] Registrar historico automatico de status com status anterior, status novo e data da alteracao.
- [x] Adicionar indicador e campo de urgencia no cadastro, edicao, listagem, detalhe e dashboard.
- [x] Bloquear mudanca de status quando o pedido estiver `Entregue` ou `Cancelado`.
- [x] Registrar entrega com data real e observacoes.
- [x] Exigir motivo ao cancelar pedido.
- [x] Registrar motivo de cancelamento no historico/status do pedido.
- [x] Criar campo explicito `local_bordado` nos itens do pedido.
- [x] Reforcar no backend que todo pedido deve ter forma de pagamento.
- [x] Validar no backend que o prazo de entrega seja futuro em relacao a data do pedido.

### Prazos e Alertas
- [x] Exibir alertas visuais para pedidos com prazo proximo em ate 3 dias.
- [x] Diferenciar visualmente pedidos proximos do prazo e pedidos atrasados.
- [x] Exibir urgentes com indicador visual claro.

### Dashboard
- [x] Incluir pedidos por status.
- [x] Incluir pedidos urgentes.
- [x] Incluir pagamentos pendentes.
- [x] Revisar se todos os cards e listas refletem dados atualizados ao acessar.

### Listagem e Filtros
- [x] Adicionar paginacao na listagem de pedidos.
- [x] Adicionar filtro de pedidos por periodo.
- [x] Adicionar filtro de pedidos por canal de origem.

### Estoque
- [x] Criar tela de cadastro de material.
- [x] Criar fluxo de entrada e saida de estoque.
- [x] Exibir historico de movimentacoes de estoque.

### Usuarios e Senhas
- [x] Garantir que criacao/edicao de usuarios nunca salve senha pura.
- [x] Revisar fluxo de troca de senha para usar hash criptografico no backend.

### Qualidade e Performance Local
- [ ] Medir carregamento das principais telas e validar meta de ate 3 segundos.
- [ ] Revisar queries/listagens para evitar carregamento excessivo conforme volume crescer.

## Deploy e Infraestrutura

Itens separados porque, por enquanto, o foco esta no ambiente local.

- [ ] Configurar HTTPS no ambiente de producao.
- [ ] Planejar deploy em servico de nuvem.
- [ ] Garantir disponibilidade 24/7 em producao.
- [ ] Configurar variaveis seguras para ambiente produtivo.
- [ ] Revisar pipeline de CI/CD para build, testes e deploy.
