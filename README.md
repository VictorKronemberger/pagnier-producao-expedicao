# Pagnier — produção e expedição

Versão atual preparada para **Next.js + Vercel, com Turso libSQL ou Neon PostgreSQL**, mantendo pedidos, produção, embalagem, documentação, login por funcionário e chat. O repositório é privado e pertence a `VictorKronemberger/pagnier-producao-expedicao`.

## Banco de dados: Turso

O ambiente de produção usa **Turso libSQL**, com `DATABASE_PROVIDER=turso`, `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`. Em 19/10/2026, o usuário autorizou começar com um banco novo, sem importar os dados do Neon. Cada funcionário deve selecionar seu nome e criar um novo PIN em **Primeiro acesso**; os dados do Nomus são carregados gradualmente depois da entrada no painel. Mensagens e alterações manuais antigas não são reconstruídas pela captura do ERP.

Siga o [manual Vercel + Turso](docs/VERCEL-TURSO.md). O código mantém compatibilidade com Neon para instalações existentes; configure o provedor explicitamente em cada ambiente. As credenciais são privadas e não ficam no GitHub.

A versão inclui cache validado por revisão para o estado Nomus, respostas menores quando nada mudou, cache dos resumos de chat invalidado por novas mensagens/leituras, paginação por índice e espera progressiva nas falhas das consultas automáticas. Testes em memória: `npm run test:turso` e `npm run test:api:turso`.

## Publicação com Neon (origem / compatibilidade)

Siga o [manual Vercel + Neon](docs/VERCEL-NEON.md). A entrega prepara o código; não cria serviços, publica o site nem transfere dados automaticamente.

1. Crie um banco Neon e configure `DATABASE_URL` e `NOMUS_API_KEY` em `.env.local`.
2. Execute `npm ci` e `npm run db:migrate` com Node.js 24.
3. Para continuar os dados locais, exporte o SQLite e importe em um banco novo seguindo o manual.
4. Importe este repositório na Vercel como **Next.js**, raiz `./`, build `npm run build` e Node.js 24.x.
5. Configure as duas variáveis no ambiente Production, publique e confira os fluxos do manual.

A autenticação usa nome e PIN, conforme escolha do usuário. Dados e mensagens exigem sessão válida; a tela de login e o primeiro cadastro de um nome ficam acessíveis pela URL. Não depende de autenticação ChatGPT nem das variáveis `DASHBOARD_USER`/`DASHBOARD_PASSWORD` da adaptação antiga.

## Origem do código e dos dados

Este checkout passa a ser a origem da versão Vercel. `painel-producao/` conserva a instalação local D1 e seus dados. A pasta `painel-producao-vercel/` é antiga e não deve substituir esta versão. Não copie pastas inteiras entre esses ambientes.

Credenciais, banco local, backups e dados reais do ERP não fazem parte do Git. `lib/production-snapshot.json` permanece vazio. O banco de produção é independente: atualizar código não transfere dados. Os arquivos legados de Cloudflare/Sites e as migrações SQLite `drizzle/` foram preservados como referência/testes e não fazem parte do build Next.js ativo.

## Alterações compartilhadas entre usuários

O painel consulta a revisão do quadro a cada três segundos enquanto a aba está visível e consulta novamente ao voltar à aba, focar a janela ou recuperar a conexão. Sem mudanças, a API retorna apenas a revisão, sem reenviar o quadro e o snapshot do ERP. Exclusões, movimentos, documentos e edições salvas aparecem nas outras sessões automaticamente.

Edições em registros diferentes são combinadas. Se duas pessoas alterarem o mesmo pedido, documento ou a ordem da fila de formas incompatíveis, o salvamento pausa com aviso e preserva o rascunho local. O usuário pode copiar o que deseja manter e recarregar a versão compartilhada. Pedidos e seus envios são tratados como uma unidade para impedir que uma edição antiga restaure um packing list excluído. A revisão também é conferida no servidor antes das validações e na gravação.

Validação: `node scripts/check-board-live.mjs` e `npm run test:api:turso`. Após `npm run build`, `node scripts/check-board-live-browser.mjs` usa duas sessões de Edge, respostas fictícias e um servidor próprio na porta 5177 para conferir exclusão, edição, mudança de etapa, conflitos, retorno à aba, reconexão e o cabeçalho responsivo. Não acessa banco real ou ERP.

## Tema do painel

O botão de sol/lua no login e no cabeçalho alterna entre modo claro e escuro. Na primeira visita, o tema acompanha a preferência do sistema; a escolha manual fica salva neste navegador e sincroniza entre abas. O tema cobre os formulários, cartões, janelas e chat. A impressão mantém o modo claro e os arquivos PDF/Excel não são alterados.

O cabeçalho reúne os controles na mesma linha em telas largas e mantém os filtros ativos junto à contagem de pedidos. No modo escuro, a logo original aparece em branco com fundo transparente.

Validação isolada do tema: após `npm run build`, execute `node scripts/check-theme-browser.mjs` no Windows com Edge instalado. O teste usa dados fictícios e um servidor próprio na porta 5175, sem acesso ao ERP ou banco.

## Arquivamento de pedidos

A área **Arquivados** reúne os pedidos retirados da fila, com busca, motivo, data e funcionário responsável. Em Pedidos de venda e no detalhe do pedido, a ação fica em **Outras ações → Arquivar pedido…** e abre uma confirmação com foco inicial em Cancelar. O motivo **Pedido excluído no Nomus** exige marcar que a exclusão foi conferida no ERP. Produção, etapa, notas, caixas, agrupamentos, packing lists e invoices são preservados. Restaurar pede confirmação, devolve o pedido aos ativos e não recria registros no Nomus. Arquivamentos anteriores continuam visíveis mesmo sem data/motivo registrados.

O servidor grava o responsável e o horário a partir da sessão e confere a revisão do quadro. O endpoint `POST /api/board` organiza somente o painel. O estado arquivado e os metadados aparecem nas outras sessões pelo mecanismo de sincronização compartilhada.

A [documentação de pedidos do Nomus](https://atendimento.nomus.com.br/hc/pt-br/articles/35195264156187-Pedido) descreve consulta individual e paginação, mas não define uma resposta que comprove exclusão. Ausência após uma varredura completa e falhas na consulta individual geram **Aguardando confirmação**, sem apagar ou arquivar automaticamente. O catálogo permite filtrar esses pedidos. Uma resposta válida posterior remove o aviso. Exclusão confirmada pelo funcionário fica identificada no arquivo, com alerta de revisão quando há produção ou documentos vinculados.

Validação isolada: `node scripts/check-order-archive.mjs`, `npm run test:api:turso` e, após o build, `node scripts/check-order-archive-browser.mjs` (Windows/Edge, porta 5178, duas sessões e dados fictícios).

**Carregamento** é uma opção da transportadora do envio, na aba Geral e na conferência da Expedição, com categoria própria no filtro do quadro. A escolha é compartilhada entre pedidos agrupados. Os modelos documentais de invoice continuam sendo FedEx e DHL.

## Atendimento comercial e produção

A aba Geral destaca o resumo da produção usando o mesmo cálculo da coluna Produzido na Expedição. Só confirma conclusão quando todas as OPs do pedido têm quantidade produzida igual ou maior que a prevista. A situação comercial fica recolhida em Ver situação do pedido no Nomus, com aparência neutra; apenas itens aguardando liberação mantêm o aviso amarelo. Um item Liberado pode ter a produção concluída; a quantidade produzida vem da última operação da OP e é exibida em Conferir produtos. O aviso mostra o horário da consulta do próprio pedido. Abrir um pedido prioriza sua consulta GET direta quando ela tem mais de cinco minutos; a atualização manual consulta o pedido aberto, respeitando bloqueios e intervalos existentes.

Para uma revisão completa autorizada, `npm run db:capture-nomus -- --refresh --production` percorre novamente os pedidos e OPs do recorte e consulta as quantidades produzidas de todas as OPs não canceladas em lotes, incluindo as que estão fora da página visível. A rotina também reconsulta individualmente os pedidos visíveis que não apareceram na paginação. Se o Nomus recusar a consulta, o pedido fica identificado como não confirmado e seus registros são preservados. `--verify-orders` repete apenas essa conferência de pedidos ainda não confirmados, sem reiniciar uma paginação já concluída. A rotina salva progresso, preserva os dados anteriores em falhas e não altera o ERP. Sem `--production`, mantém a captura de pedidos/OPs. A cobertura do painel começa em 01/09/2026.

## Captura do Nomus e ordens canceladas

O horário da última captura e o ícone de atualizar ficam na linha de status existente, junto à contagem de pedidos. Nas demais áreas, ficam nas ações do cabeçalho. Clicar no horário mostra a data completa, o fuso de Brasília e eventuais avisos, sem deslocar o conteúdo. O ícone de atualizar antecipa a próxima consulta GET, sem aguardar o intervalo automático de 22 segundos. A integração continua por páginas: uma captura não confirma que toda a base foi revisada. Chamadas simultâneas compartilham um bloqueio; cliques manuais têm intervalo de 10 segundos e falhas mantêm a espera de um minuto. Os dados e o horário confirmado são preservados em falhas.

Em Pendências, “Ordens canceladas” reúne as OPs cujo status no Nomus é explicitamente `Cancelada`, com os pedidos vinculados quando conhecidos. Elas ficam fora da contagem de correções de vínculo e da lista de produção interna; o status ausente não é tratado como cancelamento. Status já registrados são recuperados do histórico local, e novas canceladas aparecem conforme a captura percorre as páginas. Busca e filtros de data se aplicam também a essa seção.

Testes isolados: `node scripts/check-vercel-api.mjs`, `node scripts/check-op-status.mjs` e, após o build, `node scripts/check-nomus-browser.mjs` (Windows/Edge, porta 5176). Usam dados fictícios, sem consultar ou modificar o ERP real.

## Desenvolvimento e validação

```powershell
npm ci
npm run db:migrate
npm run dev
```

Acesse `http://127.0.0.1:5174`. O painel local antigo permanece na porta 5173. Configure `.env.local` com um banco de desenvolvimento separado; nunca rode testes operacionais contra produção.

```powershell
npm run build
npm run check
npm test
npm run test:postgres
node scripts/check-vercel-api.mjs
node scripts/check-team-chat.mjs
node scripts/check-documentation-ready.mjs
```

Os testes PostgreSQL usam PGlite (PostgreSQL em memória), sem Neon real. O teste de APIs valida login, sessão, bloqueio anônimo, origem, concorrência e chat. `scripts/check-team-chat-browser.mjs` usa Edge e o Next local na porta 5174, com APIs interceptadas e dados fictícios. Os demais scripts de navegador anteriores apontam para o painel legado; consulte [operação e testes](docs/OPERACAO-E-TESTES.md).

A conexão hospedada ao Neon e o comportamento da publicação precisam de conferência após configurar os serviços. A integração Nomus permanece somente leitura.

## Histórico funcional preservado

Liberação de pedidos (manual revisão 09): a situação de cada item vem de `itensPedido.status`, conforme a [documentação oficial do Nomus](https://atendimento.nomus.com.br/hc/pt-br/articles/35195264156187-Pedido). Status 1 aguarda liberação; 2 e 3 permitem entrada em Na fila quando existe OP vinculada. Pedidos parciais com OP entram na fila, mostrando os itens pendentes no cartão e na aba Geral. Sem OP ficam fora da fila. Status desconhecido aguarda consulta; registros antigos ganham status durante as consultas paginadas ou de detalhe. Etapas já iniciadas e seus dados são preservados. A API bloqueia novas transições de pedidos sem liberação confirmada. Integração permanece somente GET no ERP. Testes: `node scripts/check-order-release.mjs` e `node scripts/check-release-browser.mjs` (servidor local, APIs simuladas).

Correção da classificação e navegação superior (manual revisão 10): pedidos legados recuperam status dos fatos salvos somente quando quantidade, produto e fontes coincidem. Situação desconhecida preserva a visibilidade de quem já estava na fila, sem liberar novas transições. A consulta recente atualiza a página 1 de pedidos a cada 5 minutos, respeitando o intervalo compartilhado e mantendo a paginação histórica. Pedidos mistos com itens atendidos e abertos recebem aviso com os itens pendentes; a quantidade exibida é a pedida, pois a API não informa saldo específico da produção. O menu superior substitui a barra lateral, preservando todos os destinos, com navegação horizontal no celular. `check-release-browser.mjs` cobre regressão de visibilidade, catálogo, atendimento misto, navegação e celular.

Quadro simplificado (manual revisão 12): Aguardando liberação é a primeira coluna, ao lado de Na fila, seguida por Produzindo, Preparar envio e Enviados. Pendentes sem OP continuam visíveis e pesquisáveis. A liberação vem do Nomus; arrastar não libera pedidos. Etapas persistidas Bloqueado e Concluído são preservadas, mas exibidas em Produzindo (com aviso e Retomar produção) e Preparar envio, respectivamente. A conferência dos produtos permanece em Expedição. A URL antiga `?aba=release` abre o quadro unificado. Navegação superior preservada.

Design do quadro (manual revisão 13): barra superior clara, estado ativo em verde discreto, tipo de produção e busca/filtros na mesma faixa no computador. As cinco colunas ocupam a largura disponível; os cartões priorizam pedido, cliente, situação e próximo passo, com menos repetição e estados vazios discretos. Navegação e quadro mantêm rolagem horizontal no celular.

A montagem direciona automaticamente para Caixa 40 os envios compostos apenas por produtos de 250 g, 500 g ou 1 kg, considerando itens do pedido e pedidos agrupados. Caixas menores anteriores são preservadas para revisão. As cinco colunas do quadro usam vidro fosco, com cartões opacos e alternativa para transparência reduzida. Manual: revisão 14.

Conferir produtos mostra a quantidade produzida na última operação da OP, com situação pendente/parcial/concluída e saldo a produzir. Consultas GET em lotes priorizam os produtos visíveis, usam cache e preservam valores anteriores em falhas; dados ausentes não viram zero. A data e a operação aparecem em Detalhes. Logo substituída pela imagem original fornecida pelo usuário. Manual: revisão 15.

Packing list e manual (revisão 18): fluxo em quatro etapas com retomada pela primeira pendência, filtros de preparo/revisão/despacho e identificação de responsáveis. Exportação Excel editável com abas Packing list, Produtos, Caixas e Guia e pendências; códigos e lotes preservam zeros iniciais e pesos/totais usam fórmulas. O PDF final mantém a conferência física e a confirmação da revisão. O manual inclui 13 exemplos práticos, continuidade entre funcionários e seis imagens do sistema com dados fictícios. Validação: build, TypeScript, `check-flow.mjs`, `check-packing.mjs`, `check-packing-workflow.mjs`, `check-packing-excel.mjs` e `check-packing-workflow-browser.mjs` (Edge, APIs simuladas, download XLSX, revisão obrigatória e layout móvel).

O manual apresenta capítulos numerados na sequência da operação, leitura ampliada, posição no guia e botões Anterior/Próximo capítulo no início e no fim. Dúvidas avulsas também oferecem acesso ao capítulo correspondente. A verificação de navegador percorre os 13 capítulos e confirma a navegação no computador e no celular.

Auditoria e redução de retrabalho (manual revisão 19): seleção do pedido aproveita dados e produtos juntos na invoice, com comparação ao atualizar e preservação de campos manuais. Destinatário, AWB e volumes de agrupamentos não são copiados para encomendas diretas. Atalhos retomam a invoice existente, a pendência do packing list e a conferência correta das caixas. Campos documentais repetidos podem ser completados nas linhas vazias da mesma OP sem alterar dados físicos. O manual recebeu nova abertura, atalhos por tarefa, índice lateral na leitura e navegação compacta no celular. A bateria `node scripts/check-system.mjs --browser` reúne 36 verificações de regras/API e 10 cenários de navegador, todos isolados dos dados operacionais. Consulte [operação e testes](docs/OPERACAO-E-TESTES.md).

## Chat interno da equipe

O botão Mensagens abre um painel lateral recolhível. O ícone de conversa em cada cartão abre o histórico daquele pedido. A conversa geral recebe recados da equipe; @ seguido do nome menciona um funcionário. O botão de referência anexa um pedido clicável à mensagem. Conversas com menções e mensagens não lidas aparecem primeiro na seleção de pedidos.

Antes de abrir os quadros, entre com seu nome e PIN. No primeiro acesso, escolha Primeiro acesso e crie um PIN de 4 a 8 números. Quem já criou um PIN no chat reutiliza o mesmo. Cada funcionário reutiliza o próprio PIN em outros navegadores. A sessão dura 30 dias; o nome e a opção Sair ficam no cabeçalho para trocar de funcionário em computadores compartilhados. As APIs do painel também exigem essa identificação e registram o funcionário nas alterações salvas. Na versão Vercel, essa identificação substitui a autenticação da plataforma anterior. As conversas são visíveis à equipe; não há mensagens privadas nesta versão.

Mensagens, contas e leituras são compartilhadas entre acessos ao mesmo banco PostgreSQL, em tabelas próprias, sem alterar os dados do quadro. O PIN é armazenado como hash com salt; cookies de sessão são HttpOnly. As mensagens não lidas são verificadas logo após entrar e periodicamente enquanto o site está aberto, mesmo com o chat recolhido. O botão Mensagens ganha destaque, contador e sinal de menções; o título da aba também mostra o contador. Não há som ou abertura automática. Se a sessão expirar, a tela de entrada reaparece e preserva as edições abertas até o mesmo funcionário entrar novamente. O envio pode ser repetido após falha de rede sem duplicar a mensagem.

Na versão Vercel, `npm run db:migrate` prepara todas as tabelas PostgreSQL. Não execute as migrações SQLite `drizzle/` no Neon. Veja o [manual de publicação e transferência](docs/VERCEL-NEON.md). Enviar código ao GitHub não transfere mensagens, PINs ou sessões.

Validação do chat: `node scripts/check-team-chat.mjs` (Node.js 22.13+ com `node:sqlite`); o teste usa somente banco em memória. `node scripts/check-team-chat-browser.mjs` usa o preview local, Edge e dados simulados; faz apenas leitura de diagnóstico na API real e mantém os envios de teste em memória.

Os PDs conhecidos são relacionados ao ID interno do pedido no Nomus. O arquivamento automático exige ausência em duas varreduras completas, sequenciais e sem falhas, seguida de duas consultas individuais com HTTP 400, 404 ou 410, separadas por pelo menos um minuto. O HTTP 400 genérico observado no Nomus não é prova isolada de exclusão: por isso o motivo registrado é **Não localizado no Nomus**. Páginas duplicadas/incompletas, falhas de autenticação, limite de consultas, indisponibilidade e pedidos apenas atendidos/cancelados não confirmam ausência. A verificação roda na sincronização existente enquanto o painel está aberto; não há tarefa agendada independente. A gravação usa as revisões do Nomus e do quadro para preservar edições concorrentes, mantendo notas, etapas e documentos. Uma restauração manual é respeitada até uma nova sequência de presença e ausência do mesmo pedido.

A sincronização executa até cinco GETs sequenciais por rodada, com três segundos entre as consultas adicionais e orçamento de tempo para encerrar antes do limite da requisição. Cada etapa é persistida sob a mesma reserva no banco; outras sessões recebem o progresso e não duplicam a varredura. A paginação válida é retomada, enquanto cursores antigos sem evidência desde a primeira página são reiniciados uma única vez. Falhas individuais 400/404/410 de PDs conhecidos recebem espera própria e não bloqueiam a lista inteira; autenticação, indisponibilidade e Retry-After continuam impondo espera global. As duas varreduras e duas consultas individuais continuam obrigatórias para arquivamento automático. Os detalhes do indicador Nomus exibem a próxima página, pendências e horário da última varredura completa.
