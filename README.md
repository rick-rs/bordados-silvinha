# BordadosApp - Sistema de Gestão de Bordados

## Instalação

```bash
# Subir a aplicação com Docker Compose
docker compose up -d

# Parar a aplicação
docker compose down
```

Sistema web completo para gestão de um atelier de bordados, permitindo o controle de pedidos, clientes, produtos, catálogo e estoque de materiais.

## Funcionalidades

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

## Tecnologias

## Estrutura do Projeto

## Modelo de Dados

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
