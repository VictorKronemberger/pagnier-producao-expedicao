# Operação e testes do painel

Atualizado em 27/10/2026. Manual do site: revisão 28.

A versão atual usa Next.js na Vercel e Turso em produção, com compatibilidade com Neon. Este checkout é a origem do código publicado; o painel local D1 é legado. Consulte [Vercel e Turso](VERCEL-TURSO.md).

## Fluxo de trabalho

1. Localize o pedido por SKU, número, cliente, OP ou nome do produto e confira os filtros.
2. Aguardando liberação depende dos itens no Nomus. Produtos de fabricação liberados com OP seguem para Na fila. Pedidos somente de revenda, totalmente liberados e com ausência de OP confirmada, seguem para Preparar envio. Pedidos mistos mantêm o fluxo de produção.
3. Acompanhe Produzindo. Alterar a etapa no painel não registra produção no ERP.
4. Em Conferir produtos, compare a quantidade da OP, a produção confirmada e a quantidade embalada. Sem confirmação não significa zero.
5. Escolha montagem direta, caixas menores, bags ou modo misto. Em Adicionar produto, digite SKU, nome ou OP e selecione a sugestão por clique ou pelas setas e Enter. Pesquisar não altera o item até a seleção; Escape fecha as opções. Confira o SKU e informe a quantidade.
6. Finalize as embalagens internas e distribua nas Caixas 40. Revise o conteúdo, pese e meça os volumes reais e confirme a conferência física.
7. Abra a documentação pelo pedido. Retome o packing list ou a invoice existente e confirme os dados herdados.
8. Use Pronto para envio enquanto aguarda a saída física. Registre a data real de despacho e o rastreio para concluir o envio. Baixar documentos não encerra o pedido.

O quadro tem seis etapas: Aguardando liberação, Na fila, Produzindo, Preparar envio, Pronto para envio e Enviados. A conferência acontece dentro do pedido.

## Dados reaproveitados

- O envio concentra caixas, produtos, medidas, pesos e rastreio; pedidos agrupados compartilham esse cadastro.
- O SKU do Nomus identifica produtos de fabricação e revenda, incluindo artesanatos, aplicadores, incensos e porta-rapé. O código fica em destaque e o nome abaixo. Códigos preenchidos manualmente são preservados.
- Produtos de 250 g, 500 g e 1 kg seguem diretamente para Caixa 40 somente quando todos os itens atendem à regra.
- Lote e validade usam a OP e o lote confirmado no Nomus. Valores manuais são preservados; a validade não é calculada pela criação da OP.
- Completar dados repetidos preenche campos documentais vazios da mesma OP, produto e unidade. Não substitui valores existentes nem propaga fontes divergentes.
- Invoices aproveitam os dados e produtos do pedido. Atualizações da origem exigem comparação; preços da mesma unidade e correções manuais são preservados.
- Uma invoice direta de pedido agrupado exige confirmar o destino; não herda automaticamente destinatário, AWB e volumes do embarque compartilhado.

## Documentos e manual

O packing list tem quatro etapas: Pedidos e destinatário, Itens e caixas, Dados do documento e Revisar e baixar. O PDF final exige resolver pendências e confirmar a revisão. O Excel editável contém Packing list, Produtos, Caixas e Guia e pendências, sem linhas ou colunas congeladas. Alterações no Excel não retornam ao painel.

Invoices FedEx e DHL continuam com um pedido por documento, em PDF e Excel. Conferência física e mudanças da origem impedem o PDF final quando houver pendências.

O manual organiza o trabalho por capítulos e apresenta explicações sobre as próprias imagens, com destaques e ampliação. Instruções completas ficam recolhidas. A revisão 28 mostra a busca automática na montagem de caixas e bags, a distinção pelo SKU e a seleção por teclado. As imagens usam somente dados fictícios.

## Salvamento e integração

Espere Salvo antes de sair ou exportar. As alterações são enviadas em sequência. Conflitos preservam o rascunho e não substituem automaticamente outra sessão; confira o aviso antes de recarregar.

As consultas ao Nomus são somente leitura. Base parcial pode incluir páginas, cadastros ou pedidos ainda sem confirmação. O painel não libera pedidos, baixa estoque, registra produção, fatura nem encerra OPs no ERP.

O histórico do pedido registra alterações salvas, com funcionário, horário e valores antes e depois. Atualizações do Nomus continuam em Novidades neste pedido.

Enviar código ao GitHub não transfere registros entre bancos. A implantação depende da configuração do projeto na Vercel; confira sua conclusão antes de anunciar a atualização do site.

## Verificações automatizadas

Na raiz deste checkout:

```powershell
npm test
npm run build
```

A bateria principal contém 55 verificações de regras, APIs, concorrência, persistência, integração simulada e exportação de documentos, usando fixtures e bancos isolados. Os relatórios ficam em `.sites-runtime/audit/`, ignorada pelo Git.

Os scripts de navegador que iniciam seu próprio Next ou servidor de componentes testam a versão atual sem acessar o banco operacional. Por exemplo:

```powershell
node scripts/check-manual-browser.mjs
node scripts/check-bags-browser.mjs
node scripts/check-board-live-browser.mjs
node scripts/check-order-history-browser.mjs
node scripts/check-product-autofill-browser.mjs
```

Os testes do Next requerem um build atual; os testes de componentes fazem seu próprio bundle. Todos requerem Microsoft Edge. Execute-os sequencialmente porque alguns compartilham portas. Scripts antigos que esperam uma prévia externa e o modo `--browser` do runner incluem caminhos legados; não os confunda com a bateria atual.

`check-bags-browser.mjs` cobre busca automática por nome e SKU, produtos de nomes iguais, seleção por clique e teclado, ausência de resultados, Escape, montagem, recarga, distribuição, retirada e visualização no celular. `check-manual-browser.mjs` percorre os capítulos, destaques sobre imagens, ampliação, busca e navegação no computador e no celular.

Falhas devem ser investigadas. Não remova uma validação para obter aprovação; atualize seletores somente quando a interface tiver mudado legitimamente, preservando a regra testada.

`check-document-read.mjs` é uma consulta real separada e somente de leitura; depende da conexão com o Nomus e não integra a bateria fictícia. Nunca envie credenciais, bancos, snapshots reais ou relatórios privados ao repositório.
