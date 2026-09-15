# Perfil de Acessibilidade

## Arquitetura analisada

- Frontend: React 18 + TypeScript, Vite, React Router; páginas por feature em `app/src/features`, componentes compartilhados em `app/src/components/ui` e AppShell para navegação.
- Estilos: Tailwind e variáveis da paleta em `app/src/theme/global.css`.
- Backend: Django 4.2 + DRF, app `commerce`, ModelViewSets e serializers, router `/api/`.
- Banco: PostgreSQL via `DATABASE_URL`; migrations do Django.
- Usuário: `commerce.Usuario`, separado do usuário administrativo Django; senha com suporte legado e hash Django.
- Login anterior: validava a senha e retornava somente dados; o frontend guardava o usuário em localStorage. Não existia credencial de autenticação do usuário comercial.

A implementação mantém essa estrutura. `AccessibilityProfile` possui relação um para um com `Usuario` e criação automática no login ou consulta. O login agora retorna uma credencial Bearer assinada pelo Django, com validade de sete dias, vinculada ao usuário ativo e à senha atual. Trocar a senha invalida a credencial e exige novo login. Logout remove a credencial local; não há revogação individual no servidor. Use HTTPS fora do ambiente local. As permissões dos demais recursos e o modo público de desenvolvimento existentes não foram redesenhados; os endpoints de acessibilidade exigem sempre a credencial comercial.

## API

Todas as operações usam `/api/accessibility-profile/` e `Authorization: Bearer <token>`.

- `GET`: consulta ou cria o perfil atual com padrões.
- `PATCH`: atualização parcial, com validação estrita.
- `POST`: restaura todos os padrões.

Não existe parâmetro de usuário: o proprietário é obtido da credencial. Campos desconhecidos (incluindo `user`) são rejeitados. `text_size` aceita `standard`, `large`, `extra_large`; os demais campos aceitam apenas booleanos JSON. Os padrões são `standard` e todos os booleanos `false`.

## Frontend e persistência

Acesse **Perfil → Configurar acessibilidade** (`/perfil/acessibilidade`). O provider central aplica atributos `data-a11y-*` ao elemento HTML e o CSS global interpreta as preferências. Tamanhos rem ampliam a interface existente; Arial fornece a opção de fonte legível sem downloads externos.

O login inclui as preferências, aplicadas antes da navegação. Um cache por ID de usuário guarda apenas configurações confirmadas e é aplicado antes da renderização inicial. O provider sincroniza com o backend antes de mostrar a área autenticada. O cache não substitui o banco e não é utilizado como identidade. Sessões antigas sem credencial exigem novo login.

Alterações são otimistas. Controles ficam indisponíveis durante salvamento para evitar respostas fora de ordem; falhas desfazem a alteração e mostram uma ação de recarregamento. Respostas antigas são descartadas após troca de sessão. Logout restaura a interface padrão sem apagar as preferências do banco. A redução de movimentos do sistema é respeitada mesmo quando o perfil está no padrão.

## Executar e demonstrar

1. Aplicar migrations: `cd api && python manage.py migrate` (ou `docker compose exec api python manage.py migrate`). O Compose já aplica migrations ao iniciar.
2. Iniciar API e frontend conforme README; fazer login novamente para obter a credencial.
3. Abrir Perfil → Configurar acessibilidade; demonstrar tamanhos, contraste, fonte, espaçamento e destaques na pré-visualização.
4. Navegar a outra página para demonstrar aplicação global.
5. Sair e entrar com a mesma conta; confirmar restauração. Outra conta deve manter suas próprias configurações.
6. Demonstrar Restaurar configurações padrão.
7. Simular indisponibilidade da API durante uma alteração: conferir mensagem e reversão.
8. Usar Tab/Shift+Tab, Enter e Espaço para operar controles; conferir foco e link Pular para o conteúdo.

## Verificação e limites

Testes de API cobrem credenciais reais de login, valores padrão, atualização de todas as opções, novo login, reset, isolamento entre duas contas, criação tardia, valores inválidos, usuário inativo, senha alterada e credenciais adulteradas/expiradas.

Foram adotados controles nativos, labels, fieldset, regiões de status/alerta, foco visível, navegação nomeada, salto ao conteúdo, contraste reforçado e redução de movimentos. Referência: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), especialmente teclado, foco, contraste, redimensionamento e espaçamento. Isso não constitui certificação de conformidade de toda a aplicação. Valide com leitores de tela reais e dispositivos usados na apresentação; nenhum leitor de tela simulado foi criado.


### Resultado da validação local

- Migration aplicada em SQLite temporário; `makemigrations --check --dry-run` sem alterações pendentes.
- Backend: 43 testes passaram (suíte existente e novos testes).
- Frontend: lint sem avisos, build TypeScript/Vite aprovado e três testes existentes passaram.
- Navegador: todas as opções, pré-visualização, novo login com preferências restauradas, reset e falha/recuperação da API verificados.
- O PostgreSQL configurado no Compose não foi alterado: o Docker não estava acessível. Aplique a migration no ambiente usado para apresentação.
