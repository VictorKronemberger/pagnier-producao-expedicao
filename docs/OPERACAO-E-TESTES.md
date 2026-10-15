# Painel de produção Pagnier

Execute iniciar-painel.ps1 e abra http://127.0.0.1:5173/signin-with-chatgpt?return_to=/.

O iniciador carrega a chave protegida pelo Windows para consultas GET ao Nomus. O acesso local simulado é destinado à análise neste computador.
A prioridade e os controles do quadro são salvos automaticamente no banco local. Espere Salvo antes de fechar.
O Manual de boas práticas está no menu do site.

Recorte por intervalo de criação da OP, etiquetas de empresas, entrada automática na fila, avisos de atualização do Nomus, produção interna KG e conferência da expedição estão disponíveis.
A consulta acontece por páginas enquanto o painel está aberto. A base inicial é parcial; confira a indicação de conexão/cobertura.
O download do PDF oficial ainda depende de suporte documentado da API Nomus.

Para publicar na Vercel, use a pasta irmã painel-producao-vercel e siga o README dela. Os bancos local e Vercel são separados.

## Envio, caixas e pedidos de venda

Envio e embalagem registra dimensões em cm, pesos em kg, conteúdo por OP e quantidade, lote e validade opcionais. O mesmo pedido pode ter várias caixas, e uma OP pode ser distribuída entre elas. Totais e pendências ajudam a revisar os dados. Todos esses campos são salvos automaticamente.

Após a saída física, use Atendido totalmente e enviado e registre transportadora, data do envio e código de rastreio. O packing list pode ser gerado em PDF; a consulta automática à transportadora ainda não está implementada. Nenhum desses controles altera o Nomus.

A aba Pedidos de venda mostra todos os pedidos capturados, incluindo os fora da fila de produção, com busca e paginação. A coluna Pedido de venda do quadro é reservada a pedidos em aberto confirmados sem OP. A captura inicial prioriza as páginas de pedidos, depois completa nomes e vínculos. Cobertura de pedidos não implica cobertura completa de OPs e cadastros.

O banco do painel guarda os dados de envio e a cópia permitida dos pedidos. Não é necessário um segundo banco para essas funções: D1 no ambiente local e Neon Postgres na versão Vercel. O banco local e o da Vercel são independentes; publicar o código não transfere as anotações locais. Para Vercel, configure DATABASE_URL e execute a migração já incluída antes de usar.

Testes adicionais: node scripts/check-shipping.mjs.

## Packing list PDF

Baseado na estrutura do modelo fornecido: cabeçalho, caixas, descrição/SKU/HS Code, tipo de embalagem, peso líquido unitário, quantidade, peso por linha, dimensões e totais. O arquivo é criado no navegador com pdfmake e fontes locais, sem enviar dados a serviços externos. A documentação da biblioteca está em https://pdfmake.github.io/docs/0.3/getting-started/client-side/.

Quantidade da OP e quantidade de embalagens são campos separados. Pesos documentais são calculados com gramas inteiras para evitar erros de ponto flutuante. Para unidades que não sejam kg, gramas ou contagem unitária, informe o conteúdo de cada embalagem na unidade da OP. Volume nunca é convertido automaticamente em peso.

O PDF final exige os campos mínimos do cabeçalho, dados completos das caixas e itens, totais consistentes, revisão manual e estado Salvo. Rascunhos têm marca dágua e lista de pendências. Campos opcionais do modelo devem ser preenchidos quando aplicáveis. A validação de HS Code é apenas de formato (6, 8 ou 10 dígitos); classificação e exigências externas devem ser confirmadas pelo responsável. Nenhuma assinatura é reproduzida.

Dados documentais podem ser preenchidos a partir do cadastro do cliente consultado no Nomus, com confirmação antes de substituir campos. Informações faltantes e dados comerciais do documento continuam manuais. Os dados confirmados são salvos no mesmo banco do painel. O acesso continua compartilhado; restringir a visualização à seção documental não cria permissões individuais por usuário.

Verificação: node scripts/check-packing.mjs (dados fictícios; PDFs de teste em .sites-runtime). A versão local também possui scripts/check-browser.mjs, com APIs simuladas e download do PDF pelo navegador.

## Escopo de empresa

A empresa Medicina Sagrada (identificador 2 confirmado no Nomus) está excluída da captura de conteúdo de pedidos, do catálogo e do quadro deste painel. A regra usa idEmpresa do pedido, independentemente do cliente ou da etiqueta Empresas. Somente identificadores técnicos mínimos são mantidos para impedir reentrada e resolver vínculos de OP. A sincronização continua exclusivamente GET. Nenhum pedido é apagado ou alterado no Nomus. Anotações antigas do painel são preservadas no banco e ficam fora da visualização.

Teste: node scripts/check-company-scope.mjs.

## Conferência, responsáveis e envios agrupados

A lista de expedição mostra a alocação calculada por OP, com caixas, quantidade embalada, saldo e alertas. A caixa de seleção manual foi removida; marcações históricas permanecem armazenadas. A revisão física continua sendo responsabilidade da expedição. Pedro, Romulo, Hannibal, Victor e Daniel estão disponíveis para identificar responsáveis, sem criar contas de acesso.

A seção Rastreio do envio reúne transportadora, código e data da saída. O código aparece nos cartões. Não há consulta automática de eventos da transportadora.

Cliente titular e pedidos do envio permite consultar o cadastro do Nomus e reunir até 50 pedidos do quadro em um único envio. A confirmação lista pedidos, clientes de origem e titular; diferenças são destacadas. Os clientes dos pedidos no ERP permanecem intactos. O envio compartilha caixas, rastreio e packing list. As caixas existentes são copiadas, identificadores repetidos são ajustados, e uma OP compartilhada é contada uma única vez. Controles de prioridade e etapa continuam por pedido. Não há desmembramento automático de agrupamentos.

Os dados ocupam o mesmo registro do banco existente; não é necessária uma nova migração ou outro banco. Para transferir o trabalho local à Vercel, ainda é necessário planejar a migração dos dados, pois publicar o código não copia o banco local.

O manual do menu foi refeito com o fluxo completo, desde a entrada dos pedidos até a documentação e o rastreio. Testes adicionais: scripts/check-allocation.mjs e scripts/check-groups.mjs.

Peso líquido automático: um único peso inequívoco no nome do produto (g ou kg) preenche o peso unitário. Exemplo: 10 g × 10 unidades = 0,100 kg. Kits, múltiplos pesos, separadores ambíguos e massas abaixo da precisão suportada não são inferidos. Correções manuais são preservadas.

O catálogo mantém pedidos antigos e já atendidos; a fila operacional mantém os trabalhos em andamento. A consulta periódica completa cadastros de todos os pedidos, sem limitar a busca de nomes aos pedidos ativos e sem reiniciar a paginação ao atingir 200 páginas. O parâmetro local de navegação ?aba=pedidos abre diretamente o catálogo.

## Área de packing lists

O menu Packing lists (/?aba=packing) centraliza os documentos fora dos cartões. Clique em Novo packing list, escolha um pedido, selecione os demais e confirme o destinatário. Revise Caixas e envio e depois Documento e PDF. Os envios existentes aparecem uma única vez por agrupamento, preservando caixas, rastreio e dados salvos. O atalho no cartão abre o envio correspondente nessa área. São mantidos os limites existentes de 50 pedidos e 100 caixas.

## Fluxo conectado e tutorial

Pedidos de venda abre o envio correspondente; Packing lists leva à conferência dos pedidos e ao tutorial contextual. Voltar uma etapa e os atalhos do PDF orientam a revisão sem recriar caixas. Novos documentos começam por pedidos sem envio; os demais são retomados na lista existente. Seleções de pedidos/destinatário precisam de confirmação e têm aviso antes de sair. Destinatário de agrupamentos é reaproveitado; atualizações preenchem campos vazios por padrão, com substituição explícita. País de destino acompanha alterações entre envio e documento quando não há divergência manual.

O Manual de boas práticas contém oito tutoriais sequenciais, índice, busca sem distinção de acentos, retorno à tela de origem e referências completas. Validação: scripts/check-flow.mjs e scripts/check-browser.mjs, com APIs simuladas.

Correção do escopo de empresa: IDs numéricos e textuais da empresa 2 são excluídos. Pedidos legados sem empresa confirmada ficam em espera, fora das projeções públicas, clientes documentais e quadro, até a consulta confirmar uma empresa permitida. Falhas de consulta não liberam o registro; novas tentativas são espaçadas. As anotações anteriores continuam preservadas no banco.

## Invoices FedEx / DHL

Área local Invoices FedEx / DHL (/?aba=invoices), com um pedido por documento. Modelos baseados nos dois PDFs fornecidos: blocos de remetente, destinatário e importador opcional, AWB, origem/destino, itens, pesos, valores, frete e declaração. Preços, destinatários de exemplo e assinaturas não são copiados. A invoice pode existir sem packing list; as fontes já importadas não são repetidas. Envios agrupados fornecem apenas os produtos do pedido escolhido, sem copiar caixas compartilhadas.

PDF final requer dados completos, salvamento e revisão; rascunho inclui pendências. XLSX editável inclui fórmulas, guia e pendências, sem reimportação automática ao site. Exportação no navegador com pdfmake e ExcelJS (https://github.com/exceljs/exceljs), sem envio do conteúdo a serviços de exportação. Invoices são persistidas no mesmo registro do quadro, com revisão concorrente e validação de escopo da empresa. O manual inclui o tutorial 9.

OPs de Medicina Sagrada e de produção interna em KG não exigem pedido de venda. Medicina Sagrada permanece fora do painel; produção interna em KG aparece em área própria, sem aviso de pendência. As demais OPs exigem pedido de venda vinculado no Nomus. A área Para vincular reúne essas pendências; o aviso na Produção abre a lista sem filtros. A correção é feita no ERP e confirmada pela consulta do painel, sem associação automática por produto ou cliente. O manual e o tutorial de produção descrevem a rotina.

O início do recorte é 01/10/2026 (fixo, definido pelo usuário). Pedidos sem OP anteriores a esse início ou sem data confirmada não são expostos no catálogo, quadro ou seleção documental. Pedidos com vínculo de produção permanecem preservados. A sincronização guarda dataCriacao do Nomus. Os filtros de criação das OPs usam esse mesmo limite; Sem data continua disponível para revisão. Preferências antigas de intervalo são ajustadas ao início. Histórico e documentos salvos não são apagados.

Além da empresa 2, a palavra Medicina na identificação do pedido ou no cliente vinculado exclui o pedido e suas OPs da área pública. A comparação ignora maiúsculas e acentos; a etiqueta manual do cartão não decide o escopo.

Avisos do Nomus agora exibem Campo / Antes / Agora para dados operacionais de OPs e pedidos, com até 30 ocorrências por pedido. Baselines separados para lista e detalhe evitam comparar representações distintas. Avisos antigos sem baseline são identificados; novos registros exibem os dados capturados. Alterações em outros campos continuam com aviso de ausência de detalhamento.

Interface simplificada: seis itens no menu; produção interna dentro de Produção; pendências de vínculo e de consulta reunidas. Visual do quadro preservado no padrão Trello: mesmas cores, menu lateral, cartões e colunas fixas com arrastar e soltar, inclusive colunas vazias e Enviados. Removida a faixa adicional de contadores, que repetia as colunas. O rodapé do cartão oferece o próximo passo sem acrescentar outro painel. Filtros e histórico ficam recolhidos. A edição de caixas e rastreio foi centralizada em Packing lists; a aba Envio do pedido é um resumo com atalho. Ações entre pedidos agrupados ficam em uma seção recolhível. Manual com início rápido e capítulos sob demanda. Dados, etapas persistidas, PDFs, Excel e regras de escopo foram preservados.

Exclusão de packing lists: ação por envio na lista, com confirmação e DELETE autenticado em /api/board. Remove atomicamente o envio compartilhado e as cópias ocultas dos membros, preservando os pedidos e invoices. Bloqueia exclusão com data de envio ou qualquer pedido em Enviados; verifica escopo e revisão para impedir sobrescrita concorrente. Baixar PDF não finaliza o envio.

Comparativo de quantidades: conforme a rotina informada pelo usuário, o realizado é registrado alterando qtde da OP. A sincronização preserva quantidadeProgramada (primeira captura disponível), quantidadeAnterior e quantidadeAlteradaEm; diferenças permanecem visíveis no cartão, em Geral e Conferência após marcar avisos como vistos. Não soma operações do roteiro nem infere produção pelo status. O histórico Antes/Agora continua independente. Consultas exploratórias confirmaram reporte e operações, mas nenhuma captura dessas fontes foi acrescentada, pois a rotina usa a quantidade da própria OP.


## Organização de caixas — 15/10/2026

A montagem usa modalidade persistida por embarque: sem caixas menores, com caixas menores ou misto explicitamente habilitado. Cadastros antigos inferem o caminho pelo conteúdo existente. Trocas incompatíveis com conteúdo já organizado são bloqueadas.

A lista de caixas seleciona um único editor. Conteúdo e peso/conferência ficam em etapas separadas; kg são convertidos para lb para consulta. Caixas menores prontas têm conteúdo protegido até escolher Editar conteúdo; as já distribuídas voltam ao preparo por Retirar para ajustar. Modelos reutilizáveis ficam no menu Configurações de caixas, fora do embarque.

Quantidade disponível considera caixas externas e menores em preparo. UI e normalização no servidor bloqueiam novos excessos; excessos históricos podem ser reduzidos e continuam visíveis para revisão. Salvamento e controle de revisão existentes são mantidos.

Validação desta interface: node scripts/check-assembly-clean-browser.mjs (Edge, APIs interceptadas, nenhum dado real alterado), node scripts/check-assembly-modes.mjs, node scripts/check-assembly-flow.mjs e node scripts/check-inner-boxes.mjs. O teste de navegador anterior contém seletores do layout anterior; o teste específico cobre a navegação de caixas atual.


Atualização da expedição: cada Caixa 40 possui estado persistente de montagem. A ação **Finalizar Caixa 40** a move de **Montar Caixa 40** para **Caixas 40 montadas**, onde ficam pesagem e conferência. **Voltar à montagem** permite corrigir o conteúdo; mudanças físicas exigem nova pesagem. Caixas antigas já pesadas permanecem na conferência.

O lote usa o nome da OP. A sincronização consulta somente GET `lotesSerie`, filtrado pelas OPs presentes nas caixas salvas, dentro do mesmo limite e bloqueio de consultas do painel. A validade usa `dataHoraValidade` do lote do produto/empresa correspondentes, sem cálculo pela criação da OP. Resultados sem validade são consultados novamente após 5 minutos; datas encontradas, após 1 hora. A consulta é paginada e não preenche datas ambíguas. Ajustes manuais são preservados e os campos continuam editáveis. OPs sintéticas de estoque não recebem lote automático.

Conteúdo por embalagem fica dispensado em UNID no padrão de 1 produto por unidade; conversões existentes permanecem visíveis. KG, G, L e outras unidades exibem explicações junto ao campo. Testes específicos: `node scripts/check-product-lots.mjs`, `node scripts/check-ready-boxes.mjs` e `node scripts/check-assembly-clean-browser.mjs`.


## Conferência e transportadora — 15/10/2026

Conferência com busca permanente por produto/OP/unidade (acentos ignorados e múltiplos termos), filtros Todos/A revisar/A embalar e 20 itens por página. Quantidades da OP, das Caixas 40 e saldo aparecem alinhadas; criação, quantidade programada e links das caixas ficam em Detalhes. A lista consulta todos os produtos do pedido, independentemente do filtro de datas do quadro.

Transportadora reutiliza o campo persistido do envio. FedEx/DHL aparecem nos cartões e no filtro Envio do quadro; agrupamentos compartilham a escolha. Sem escolha explícita, invoices vinculadas fornecem a indicação; fontes conflitantes aparecem em Múltiplas. A escolha não modifica invoices nem contrata frete.

Ajuda contextual disponível por mouse, foco do teclado e toque; Escape fecha a dica, com ajuste de posição dentro da largura da tela. Divergências permanecem visíveis. Manual de boas práticas revisão 05. Rótulos persistentes e resultados anunciados seguem as orientações [W3C para rótulos](https://www.w3.org/WAI/tutorials/forms/labels/) e [mensagens de estado](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html); isso não equivale a uma auditoria completa de acessibilidade.

Validação: `node scripts/check-shipping-carrier.mjs`, `node scripts/check-conference-browser.mjs`, `node scripts/check-assembly-clean-browser.mjs`, `node scripts/check-quantity-browser.mjs`, `node scripts/check-manual-browser.mjs`, TypeScript e build. Testes de navegador usam APIs simuladas, incluindo salvamento de transportadora sem perder caixas, seleção por FedEx/DHL, busca, paginação, atalhos e tela móvel.

A faixa Geral do pedido inclui Envio ao lado de Etiqueta e Empresa: DHL em amarelo e FedEx em roxo. A identificação usa a mesma transportadora da conferência e dos filtros, sem criar um segundo cadastro.

Logos locais em `public/carriers/`: [DHL](https://commons.wikimedia.org/wiki/File:DHL_Logo.svg) e [FedEx](https://commons.wikimedia.org/wiki/File:FedEx_Corporation_-_2016_Logo.svg), obtidas no Wikimedia Commons. Usadas para identificar a transportadora selecionada, preservando proporção e cores. O seletor nativo mantém o nome acessível ao teclado e leitores de tela.


Conferência — filtros avançados (manual revisão 06): situação da embalagem, tipo de divergência, unidade e Caixa 40 combináveis com busca e atalhos. Ordenação natural por produto/OP e maior saldo dentro de cada unidade, com valores desconhecidos ao final. Critérios ativos permanecem visíveis com o painel recolhido; limpar filtros mantém a busca. Filtrar caixa não muda os totais do pedido. Preferências desta lista são locais à conferência, sem gravações operacionais. Cobertura em `scripts/check-conference-browser.mjs`: combinações, resultado vazio, paginação, remoção individual, busca preservada, ordenação, ausência de gravações e celular.

A identificação do pedido mostra sua criação em DD/MM/AAAA ao lado do número no cartão, no cabeçalho e no catálogo. Usa `criacao` do pedido (origem Nomus `dataCriacao`), sem substituir pela data da OP. Ausência aparece como Sem data; título e nome acessível identificam a origem. Manual revisão 07.

Busca por pedido de venda (manual revisão 08): quadro e catálogo compartilham `matchesOrderSearch`. O número aceita prefixos PD/PV, espaços/separadores e zeros à esquerda, mantendo a busca textual por cliente, OP e produto. Filtros ativos continuam aplicados.
