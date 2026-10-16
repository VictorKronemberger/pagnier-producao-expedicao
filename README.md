# Pagnier — produção e expedição

Versão atual preparada para **Next.js + Vercel + Neon PostgreSQL**, mantendo pedidos, produção, embalagem, documentação, login por funcionário e chat. O repositório é privado e pertence a `VictorKronemberger/pagnier-producao-expedicao`.

## Publicação

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
