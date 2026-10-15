# Pagnier — produção e expedição

Código do sistema de produção e expedição, salvo para VictorKronemberger em 15/10/2026.

Inclui pedidos, ordens de produção, caixas menores, Montar Caixa 40, Caixas 40 montadas, conferência física, lote e validade consultados no Nomus, packing list, invoices em PDF/Excel e Manual de boas práticas revisão 13, conferência com busca e filtros de envio FedEx/DHL.

## Estado desta cópia

Esta é a versão atual do painel local, baseada em React, Vinext e Cloudflare D1. O envio ao GitHub salva o código; não publica o site e não migra o banco. A adaptação atualizada para Vercel + Neon será uma etapa separada. Não importe esta versão diretamente como projeto Next.js convencional no Vercel.

Credenciais, arquivos de execução e banco local ficam fora do repositório. A base inicial de pedidos foi substituída por uma estrutura vazia. Os dados operacionais continuam no computador de origem. Ao conectar o Nomus, o sistema consulta pedidos por etapas; anotações, caixas e documentos existentes precisam de migração do banco para aparecer em outra instalação.

## Executar localmente

1. Instale Node.js 22.13 ou superior.
2. Execute `npm ci`.
3. Defina `NOMUS_API_KEY` no ambiente do processo, usando a chave fornecida pelo Nomus.
4. Execute `npm run dev` e acesse `http://127.0.0.1:5173`.

O ambiente local possui autenticação de desenvolvimento. Não o exponha diretamente na internet. A publicação precisa de acesso privado e banco configurados.

## Validação

- `npm run build`
- `node scripts/check-ready-boxes.mjs`
- `node scripts/check-product-lots.mjs`
- `node scripts/check-assembly-flow.mjs`
- `node scripts/check-sync.mjs`

As verificações de navegador usam Edge e dados simulados. Consulte [operação e testes](docs/OPERACAO-E-TESTES.md) para detalhes das funções.

## Hospedagem planejada

Neon PostgreSQL tem plano gratuito e integração com Vercel. O plano Hobby do Vercel é para uso pessoal não comercial; uso empresarial exige um plano compatível. Nenhuma hospedagem ou assinatura é criada pelo envio deste código ao GitHub.

- https://neon.com/pricing
- https://vercel.com/docs/plans/hobby

A integração do painel com o Nomus é somente leitura. Alterações de prioridade, caixas, documentos e rastreio são gravadas no banco do painel.

Liberação de pedidos (manual revisão 09): a situação de cada item vem de `itensPedido.status`, conforme a [documentação oficial do Nomus](https://atendimento.nomus.com.br/hc/pt-br/articles/35195264156187-Pedido). Status 1 aguarda liberação; 2 e 3 permitem entrada em Na fila quando existe OP vinculada. Pedidos parciais com OP entram na fila, mostrando os itens pendentes no cartão e na aba Geral. Sem OP ficam fora da fila. Status desconhecido aguarda consulta; registros antigos ganham status durante as consultas paginadas ou de detalhe. Etapas já iniciadas e seus dados são preservados. A API bloqueia novas transições de pedidos sem liberação confirmada. Integração permanece somente GET no ERP. Testes: `node scripts/check-order-release.mjs` e `node scripts/check-release-browser.mjs` (servidor local, APIs simuladas).

Correção da classificação e navegação superior (manual revisão 10): pedidos legados recuperam status dos fatos salvos somente quando quantidade, produto e fontes coincidem. Situação desconhecida preserva a visibilidade de quem já estava na fila, sem liberar novas transições. A consulta recente atualiza a página 1 de pedidos a cada 5 minutos, respeitando o intervalo compartilhado e mantendo a paginação histórica. Pedidos mistos com itens atendidos e abertos recebem aviso com os itens pendentes; a quantidade exibida é a pedida, pois a API não informa saldo específico da produção. O menu superior substitui a barra lateral, preservando todos os destinos, com navegação horizontal no celular. `check-release-browser.mjs` cobre regressão de visibilidade, catálogo, atendimento misto, navegação e celular.

Quadro simplificado (manual revisão 12): Aguardando liberação é a primeira coluna, ao lado de Na fila, seguida por Produzindo, Preparar envio e Enviados. Pendentes sem OP continuam visíveis e pesquisáveis. A liberação vem do Nomus; arrastar não libera pedidos. Etapas persistidas Bloqueado e Concluído são preservadas, mas exibidas em Produzindo (com aviso e Retomar produção) e Preparar envio, respectivamente. A conferência dos produtos permanece em Expedição. A URL antiga `?aba=release` abre o quadro unificado. Navegação superior preservada.

Design do quadro (manual revisão 13): barra superior clara, estado ativo em verde discreto, tipo de produção e busca/filtros na mesma faixa no computador. As cinco colunas ocupam a largura disponível; os cartões priorizam pedido, cliente, situação e próximo passo, com menos repetição e estados vazios discretos. Navegação e quadro mantêm rolagem horizontal no celular.

A montagem direciona automaticamente para Caixa 40 os envios compostos apenas por produtos de 250 g, 500 g ou 1 kg, considerando itens do pedido e pedidos agrupados. Caixas menores anteriores são preservadas para revisão. As cinco colunas do quadro usam vidro fosco, com cartões opacos e alternativa para transparência reduzida. Manual: revisão 14.

Conferir produtos mostra a quantidade produzida na última operação da OP, com situação pendente/parcial/concluída e saldo a produzir. Consultas GET em lotes priorizam os produtos visíveis, usam cache e preservam valores anteriores em falhas; dados ausentes não viram zero. A data e a operação aparecem em Detalhes. Logo substituída pela imagem original fornecida pelo usuário. Manual: revisão 15.

Packing list e manual (revisão 18): fluxo em quatro etapas com retomada pela primeira pendência, filtros de preparo/revisão/despacho e identificação de responsáveis. Exportação Excel editável com abas Packing list, Produtos, Caixas e Guia e pendências; códigos e lotes preservam zeros iniciais e pesos/totais usam fórmulas. O PDF final mantém a conferência física e a confirmação da revisão. O manual inclui 13 exemplos práticos, continuidade entre funcionários e seis imagens do sistema com dados fictícios. Validação: build, TypeScript, `check-flow.mjs`, `check-packing.mjs`, `check-packing-workflow.mjs`, `check-packing-excel.mjs` e `check-packing-workflow-browser.mjs` (Edge, APIs simuladas, download XLSX, revisão obrigatória e layout móvel).

O manual apresenta capítulos numerados na sequência da operação, leitura ampliada, posição no guia e botões Anterior/Próximo capítulo no início e no fim. Dúvidas avulsas também oferecem acesso ao capítulo correspondente. A verificação de navegador percorre os 13 capítulos e confirma a navegação no computador e no celular.
