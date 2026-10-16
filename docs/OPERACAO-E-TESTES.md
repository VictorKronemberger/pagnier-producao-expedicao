> Versão Vercel + Neon: execute `npm test` para 40 verificações de regras e APIs, incluindo PostgreSQL em memória e transferência de dados. O runner `--browser` usa o Next na porta 5174 e o teste atualizado de login/chat. Os outros scripts de navegador citados abaixo são do painel local legado. Consulte [publicação e migração](VERCEL-NEON.md).

# Operação e testes do painel

Atualizado em 15/10/2026. Manual do site: revisão 19.

## Fluxo de trabalho

1. Localize o pedido pelo número, cliente, OP ou produto. Confira a data e os filtros ativos.
2. Aguardando liberação depende da situação dos itens no Nomus. Liberado com OP entra em Na fila; pedidos mistos continuam mostrando os itens pendentes.
3. Acompanhe Produzindo e prepare o envio quando os produtos estiverem disponíveis. Alterar a etapa do painel não registra um apontamento no ERP.
4. Em Conferir produtos, compare quantidade da OP, produção confirmada e quantidade embalada. Sem confirmação não significa zero produzido.
5. Monte as caixas, finalize cada Caixa 40 e confira os volumes físicos em Caixas 40 montadas. Peso bruto exige pesagem real.
6. Abra a documentação pelo próprio pedido. O packing list retoma a primeira pendência. Uma invoice existente é aberta diretamente quando há apenas uma para o pedido; havendo várias, a lista fica restrita àquele pedido.
7. Após a saída física, registre a data de despacho e o rastreio. Enviados exige conferência atual, alocação completa e data real de saída. Baixar documentos não encerra o pedido.

O quadro tem cinco etapas: Aguardando liberação, Na fila, Produzindo, Preparar envio e Enviados. A conferência acontece dentro do pedido; não existem colunas adicionais Bloqueados ou A conferir.

## Dados reaproveitados

- O envio concentra caixas, produtos, medidas, pesos e rastreio. Pedidos agrupados compartilham esse cadastro.
- Produtos de 250 g, 500 g e 1 kg seguem diretamente para Caixa 40 somente quando todos os itens do envio atendem à regra. Outros tamanhos mantêm a escolha de modalidade.
- Lote e validade usam a OP e o lote confirmado no Nomus. Valores manuais são preservados.
- Em Itens e caixas, Completar dados repetidos preenche campos documentais vazios da mesma OP, produto e unidade. Não substitui valores existentes nem propaga campos com fontes divergentes. Quantidades, pesos, lotes e validades não são copiados por essa ação.
- Selecionar o pedido da invoice aproveita dados disponíveis e produtos juntos. Aproveitar dados e produtos atualiza o mesmo documento; mudanças da origem exigem comparação. Preços da mesma unidade e correções manuais são preservados.
- Uma invoice direta de pedido agrupado não recebe automaticamente destinatário, AWB ou volumes do embarque compartilhado. O destino da encomenda direta precisa ser confirmado.
- Conferir caixas na expedição abre diretamente a montagem ou as caixas montadas, sem exigir passar novamente pela conferência de produtos.

## Documentos e manual

O packing list possui quatro etapas: Pedidos e destinatário, Itens e caixas, Dados do documento e Revisar e baixar. O PDF final exige pendências resolvidas e revisão explícita. O Excel editável contém Packing list, Produtos, Caixas e Guia e pendências. Edições da planilha não retornam automaticamente ao painel.

Invoices FedEx e DHL continuam sendo um pedido por documento, com PDF e Excel. A conferência física e as alterações de origem bloqueiam o PDF final quando houver pendências.

O manual apresenta um índice cronológico, acesso rápido, exemplos com dados fictícios e imagens ampliáveis. No computador há índice lateral durante a leitura. Anterior e Próximo capítulo permanecem no início e no fim; no celular a navegação é compacta.

## Salvamento e integração

Espere Salvo antes de sair ou exportar. O salvamento envia as alterações em sequência; conflitos preservam o rascunho na tela e não sobrescrevem automaticamente outra sessão. Não salvo requer verificar a mensagem e tentar novamente ou preservar as edições antes de recarregar.

As consultas ao Nomus são somente leitura e acontecem por etapas enquanto o painel estiver aberto. Base parcial indica cobertura incompleta, incluindo páginas e cadastros ainda pendentes; não significa sincronização total do ERP. Confira o horário da consulta. O painel não libera pedidos, baixa estoque, registra produção, fatura ou encerra OPs no Nomus.

Os dados operacionais locais e o ambiente publicado usam bancos separados. Enviar código ao GitHub não publica automaticamente o sistema nem transfere os registros. Consulte o README para implantação.

## Bateria de testes

Requer Node e dependências instaladas. Execute na raiz do projeto:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/check-system.mjs
```

Para incluir as telas, inicie a prévia em `http://127.0.0.1:5173` e tenha Microsoft Edge instalado:

```powershell
node scripts/check-system.mjs --browser
```

A bateria contém 36 verificações de regras/API e 10 cenários de navegador. Usa dados fictícios, banco em memória ou APIs interceptadas; não altera registros no ERP nem o banco operacional. Testa quantidades, conversões, lotes, liberação, estoque, agrupamentos, caixas, conferência, atualização sem duplicação, PDFs/Excel, exclusão, salvamento, conflitos, manual e celular.

Os resultados ficam em `.sites-runtime/audit/system-results.json`; cada cenário tem seu próprio log. Essa pasta é ignorada pelo Git. Um teste que falhe deve ser investigado: não remova a validação para obter um resultado positivo. Mudanças legítimas da interface exigem atualizar os seletores mantendo a regra testada.

`check-integration.mjs` usa a rota real com dependências simuladas e verifica autenticação, origem, dados inválidos, gravação/recarga, conflito e banco indisponível. Ele não faz requisições de gravação ao servidor operacional.

`check-document-read.mjs` é uma verificação separada, somente de leitura, da consulta real a destinatários. Não integra a bateria fictícia, pois depende da conexão e disponibilidade do Nomus.

Após alterações, interrompa somente a prévia deste projeto e execute:

```powershell
node scripts/run-framework.mjs build
```

Reinicie a prévia depois. O iniciador local `iniciar-painel.ps1`, quando disponível, carrega a credencial protegida no Windows sem publicá-la. Não envie chaves, bancos, snapshots reais ou relatórios privados ao repositório.
