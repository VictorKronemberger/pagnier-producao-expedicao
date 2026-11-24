export const manualEdition = {revision:"33",updatedAt:"24/11/2026"};
export const manualCategories = [
  {
    "id": "start",
    "title": "Comece aqui",
    "description": "Entenda a sequência de trabalho e os sinais da tela."
  },
  {
    "id": "production",
    "title": "Pedidos e produção",
    "description": "Localize o pedido, organize a fila e acompanhe as OPs."
  },
  {
    "id": "expedition",
    "title": "Conferência e embalagem",
    "description": "Confira os produtos, monte as caixas e revise os volumes."
  },
  {
    "id": "documents",
    "title": "Documentação",
    "description": "Escolha packing list ou invoice e reaproveite os dados conferidos."
  },
  {
    "id": "shipping",
    "title": "Envio e encerramento",
    "description": "Registre a saída física e mantenha a lista de documentos organizada."
  },
  {
    "id": "support",
    "title": "Pendências e ajuda",
    "description": "Resolva vínculos, falhas de consulta e problemas de salvamento."
  }
];

export const tutorials = [
  {
    "id": "overview",
    "category": "start",
    "title": "Primeiro dia: entenda o fluxo do sistema",
    "target": "board",
    "action": "Abrir quadro",
    "before": "Use esta orientação no início do trabalho ou para treinar alguém da equipe.",
    "steps": [
      {
        "title": "Siga a ordem da operação",
        "text": "Localize o pedido → acompanhe a produção, quando houver → confira os produtos → monte as caixas → revise os volumes → prepare os documentos → registre a saída.",
        "short": "Encontre o pedido. Depois acompanhe a produção, confira, embale, prepare os documentos e registre o envio."
      },
      {
        "title": "Identifique pelo SKU",
        "short": "Use o SKU em destaque para identificar o produto; o nome aparece como apoio.",
        "text": "O SKU é capturado do cadastro do produto no Nomus e acompanha pedidos, OPs, caixas, bags e documentos. As buscas aceitam o código completo. Enquanto um código não está disponível, o produto é identificado pelo nome. Campos vazios dos registros existentes são completados quando a origem é confirmada; códigos preenchidos manualmente são preservados."
      },
      {
        "title": "Entenda o quadro de produção",
        "short": "Aguardando liberação → Na fila → Produzindo → Preparar envio → Pronto para envio → Enviados.",
        "text": "Aguardando liberação reúne pedidos ainda não prontos para entrar no fluxo. Produtos de fabricação liberados com OP vão para Na fila. Pedidos somente de revenda, totalmente liberados e sem OP confirmada, vão direto para Preparar envio. Liberações parciais mantêm os itens pendentes identificados no cartão. No topo ficam Produção, Pedidos, Packing lists e Invoices; Mais reúne Pendências, Arquivados, Modelos de caixas e Manual."
      },
      {
        "title": "Encontre as ações recolhidas",
        "short": "Mais abre as telas de apoio. Seu nome abre tema e saída; os três pontos abrem recarga e exportação.",
        "text": "A busca e Filtros ficam visíveis. Clique em Pedidos de clientes para alternar para Interna em KG. Os menus funcionam no computador e no celular; Escape fecha o menu e devolve o foco ao controle."
      },
      {
        "title": "Use o cartão do pedido",
        "text": "Geral reúne etapa, responsáveis e orientações. Expedição reúne conferência e montagem. Documentos reúne os atalhos para documentação.",
        "short": "Abra o cartão: Geral mostra o pedido; Expedição reúne conferência e caixas; Documentos leva aos arquivos."
      },
      {
        "title": "Preencha o que a tela destaca",
        "text": "Preencher indica informação ausente; Revisar indica algo a corrigir. Clique no botão com o nome do campo para abri-lo. Campos opcionais continuam opcionais.",
        "short": "Clique em Preencher ou Revisar para ir ao campo que precisa de atenção."
      },
      {
        "title": "Confirme o salvamento",
        "text": "Aguarde o sinal de confirmação de salvamento antes de sair, exportar ou excluir. Passe o mouse no sinal para ler Salvo. Aguardando gravação e Salvando indicam que ainda há trabalho pendente. Não salvo ou Sem sincronização exige conferir o aviso antes de continuar.",
        "short": "Espere a confirmação de salvamento. Aguardando gravação, Salvando e falhas continuam visíveis."
      },
      {
        "title": "Consulte o histórico do pedido",
        "short": "Abra Histórico do pedido para ver quem alterou, quando e os valores antes e depois.",
        "text": "O histórico fica recolhido no cartão. Abra um registro para comparar Antes e Depois; Carregar anteriores mostra eventos mais antigos. Só entram alterações salvas no painel a partir desta atualização. O nome vem do funcionário conectado. Alterações do Nomus continuam em Novidades neste pedido."
      },
      {
        "title": "Saiba de onde vêm os dados",
        "short": "O Nomus é consultado por etapas; veja o horário e os avisos de consulta.",
        "text": "A consulta é de leitura. O painel salva a organização, as caixas e os documentos, mas não libera pedidos nem registra produção no Nomus. Com o painel aberto e visível, as consultas atualizam os dados em ciclos. Base parcial ou Sem confirmação não significa quantidade zero."
      }
    ],
    "done": "Você identificou o pedido e sabe em qual etapa ele está.",
    "next": [
      "orders"
    ],
    "code": "POP-01",
    "owner": "Equipe operacional e supervisor",
    "objective": "Executar a operação na sequência correta.",
    "records": "Pedido identificado, etapa do cartão e indicação Salvo.",
    "deviation": "Se não souber a etapa atual, confira o cartão e as orientações do supervisor antes de continuar."
  },
  {
    "id": "handoff",
    "category": "start",
    "title": "Continuar o trabalho de outro funcionário",
    "target": "packing",
    "action": "Abrir packing lists",
    "before": "Use na troca de turno ou quando precisar assumir um envio em andamento.",
    "steps": [
      {
        "title": "Encontre o mesmo envio",
        "short": "Busque pelo pedido, cliente ou invoice; abra o registro existente.",
        "text": "Confira os pedidos vinculados e o destinatário. Evite criar outro packing list para continuar um que já existe."
      },
      {
        "title": "Leia a próxima ação e os responsáveis",
        "short": "Veja quem conferiu as caixas e quem está indicado para revisar o documento.",
        "text": "A faixa Próxima ação identifica a primeira pendência nos dados salvos. Os nomes indicam as funções registradas; não são uma assinatura nem impedem outra pessoa de continuar."
      },
      {
        "title": "Continue da etapa indicada",
        "short": "Complete a pendência, confira os dados herdados e espere Salvo.",
        "text": "Se o colega deixou uma seleção de pedidos sem confirmar no navegador dele, ela ainda não é um agrupamento salvo. Trabalhe com os pedidos confirmados no registro compartilhado e verifique com o supervisor se faltar informação."
      },
      {
        "title": "Faça sua própria revisão final",
        "short": "Antes de baixar o PDF, revise o conjunto e marque a confirmação.",
        "text": "Identifique corretamente o responsável pela revisão em Dados do documento. Uma etapa preenchida ou um nome anterior não dispensa sua conferência. Se alterar caixas, pesos ou medidas, volte à conferência física."
      }
    ],
    "done": "O envio foi retomado no mesmo cadastro, com dados revisados e salvamento concluído.",
    "next": [
      "document"
    ],
    "code": "POP-13",
    "owner": "Funcionário que assume a atividade",
    "objective": "Permitir continuidade sem duplicar envios nem presumir conferências.",
    "records": "Dados salvos no envio e responsáveis informados para cada função.",
    "deviation": "Se faltar informação, consulte a orientação do supervisor e registre a pendência; não estime pesos, validade ou quantidade produzida."
  },
  {
    "id": "orders",
    "category": "production",
    "title": "Localize e confira o pedido",
    "target": "sales",
    "action": "Abrir pedidos de venda",
    "before": "Tenha o número do pedido ou o nome do cliente.",
    "steps": [
      {
        "title": "Procure o pedido",
        "text": "Use a busca no quadro ou em Pedidos de venda. Confira cliente, produtos e quantidades antes de abrir um envio.",
        "short": "Busque pelo pedido ou cliente e confira os produtos."
      },
      {
        "title": "Confira o recorte de datas",
        "text": "Pedidos sem OP entram no catálogo a partir de 01/09/2026. No quadro, o filtro considera a criação das OPs. Pedidos com OP vinculada são preservados; mudar o filtro não altera o conteúdo dos envios.",
        "short": "Se o pedido não aparecer, confira os filtros de data."
      },
      {
        "title": "Verifique os vínculos",
        "text": "Produtos de fabricação precisam da OP ligada ao pedido e ao item correto no Nomus. Para falhas de vínculo, abra Mais → Pendências. Artesanatos e outros produtos de revenda podem seguir sem OP quando classificados e liberados. Não associe OPs por semelhança de nome.",
        "short": "Confira o vínculo quando houver produção. Revenda liberada pode seguir sem OP."
      },
      {
        "title": "Identifique o que já existe",
        "text": "Retome caixas e documentos existentes. Pedidos compostos apenas por Mercadoria para revenda ou Produtos para revenda entram automaticamente em Preparar envio quando todos os itens estão liberados ou atendidos parcialmente, seus dados estão completos e a ausência de OP está confirmada. Pedidos mistos seguem o fluxo de produção. Separar do estoque continua disponível para os demais atendimentos confirmados de estoque. Essa escolha não registra baixa no Nomus.",
        "short": "Revenda liberada segue para Preparar envio. Se já houver caixas ou documentos, continue no mesmo cadastro."
      }
    ],
    "done": "Cliente, pedido e origem dos produtos foram conferidos.",
    "next": [
      "production"
    ],
    "code": "POP-02",
    "owner": "Supervisor ou responsável pelo pedido",
    "objective": "Validar pedido, cliente e vínculos antes de iniciar o trabalho.",
    "records": "Pedido e itens consultados; OPs e vínculos confirmados no Nomus.",
    "deviation": "Pedido, cliente ou vínculo divergente: regularize na origem e aguarde a consulta. Não crie outro pedido para contornar a pendência."
  },
  {
    "id": "production",
    "category": "production",
    "title": "Organize e acompanhe a produção",
    "target": "board",
    "action": "Abrir produção",
    "before": "Use este procedimento para pedidos com OP vinculada.",
    "steps": [
      {
        "title": "Defina a prioridade",
        "text": "O supervisor organiza os cartões pelas setas ou arrastando, seleciona responsáveis e registra orientações. Etiquetas Urgente, Atenção e Normal sinalizam a necessidade, sem mudar a ordem automaticamente. Use Aguardando documentação na aba Geral para identificar pedidos que dependem dos documentos. Depois de preparar os documentos, troque para Documentação concluída. As duas etiquetas aparecem no cartão e podem ser selecionadas no filtro Etiqueta do quadro.",
        "short": "Organize os cartões na ordem em que a equipe deve trabalhar."
      },
      {
        "title": "Atualize a etapa real",
        "text": "Antes de produzir, confira a coluna Aguardando liberação, à esquerda de Na fila. O pedido entra em Na fila quando há itens liberados e OP gerada. Na liberação parcial, confira no aviso do cartão quais itens continuam pendentes. Use Na fila → Produzindo → Preparar envio → Pronto para envio. Quando o pedido estiver preparado, arraste o cartão para Pronto para envio ou escolha essa etapa em Mover para. Ele permanece aguardando a saída; a etapa Enviados mantém as validações de conferência e envio. Registre impedimentos nas orientações do supervisor. Os atalhos Iniciar produção e Concluir produção alteram a etapa do painel.",
        "short": "Liberado com OP entra em Na fila. Na liberação parcial, confira os itens pendentes no cartão antes de produzir."
      },
      {
        "title": "Confira as mudanças do Nomus",
        "text": "Abra Novidades neste pedido para comparar Produto, Quantidade e Unidade das OPs nas colunas Antes e Agora. Marcar como visto confirma a leitura; não altera os dados do Nomus.",
        "short": "Abra Novidades neste pedido para ver o que mudou."
      },
      {
        "title": "Revise diferenças de quantidade",
        "text": "Se a OP passou de 100 para 80 no Nomus, o painel compara a quantidade atual com a primeira captura disponível. Confira a diferença e ajuste a preparação do envio ao que realmente existe.",
        "short": "Compare a quantidade atual da OP com a anterior antes de preparar o envio."
      },
      {
        "title": "Arquive pedidos antigos",
        "short": "Arquive em Outras ações e consulte ou restaure em Mais → Arquivados.",
        "text": "No cartão ou em Pedidos, abra Outras ações e escolha o motivo de arquivamento. Preencha a observação quando necessária e confirme. O arquivamento é manual e compartilhado, preserva os dados e não depende de concluir as etapas. Consulte o histórico ou restaure em Mais → Arquivados, enquanto o pedido estiver disponível na base consultada. Nenhuma dessas ações altera o Nomus."
      }
    ],
    "done": "Os produtos estão disponíveis para conferência e as diferenças foram verificadas.",
    "next": [
      "conference"
    ],
    "code": "POP-03",
    "owner": "Supervisor e equipe de produção",
    "objective": "Disponibilizar os produtos previstos e identificar diferenças de quantidade.",
    "records": "Prioridade, etapa, responsável e orientações no cartão; quantidades da OP e histórico consultado. O arquivamento registra motivo, data e responsável e pode ser revertido em Arquivados.",
    "deviation": "Em caso de impedimento, registre a orientação no pedido. Para cartões com impedimento anterior, revise as notas e use Retomar produção. Ajuste a quantidade da OP no Nomus conforme a rotina real e confira a atualização antes de embalar."
  },
  {
    "id": "conference",
    "category": "expedition",
    "title": "Confira os produtos antes de embalar",
    "target": "board",
    "action": "Abrir quadro para conferir",
    "before": "Tenha os produtos disponíveis para comparar com o pedido e as OPs.",
    "steps": [
      {
        "title": "Localize o produto",
        "text": "No cartão, abra Expedição → Conferir produtos. Busque por nome, número da OP ou unidade, com ou sem acentos. Todos os produtos do pedido ficam disponíveis, independentemente do recorte de datas do quadro. Listas maiores têm 20 itens por página.",
        "short": "Abra Expedição → Conferir produtos e use Buscar produto ou OP."
      },
      {
        "title": "Identifique o responsável e o envio",
        "text": "Selecione o responsável e a transportadora planejada: FedEx, DHL, Carregamento ou Outra transportadora. Você também pode definir a etiqueta de envio na aba Geral, ao lado de Etiqueta e Empresa. O quadro permite filtrar por Envio. Pedidos agrupados compartilham a transportadora; quando ela não foi definida, o painel consulta as invoices vinculadas.",
        "short": "Selecione o responsável e a transportadora. Use Filtros → Envio no quadro para localizar FedEx ou DHL."
      },
      {
        "title": "Leia as quatro quantidades",
        "short": "Produzido é a quantidade confirmada pela produção. Na OP é o programado. Em Caixas 40 é o embalado. Falta embalar é OP menos caixas.",
        "text": "A quantidade produzida vem da última operação do roteiro da OP no Nomus; etapas intermediárias não são somadas. Produção pendente significa zero confirmado; parcial significa menos que a OP; concluída significa igual ou maior. Consultando Nomus ou Sem confirmação não permite concluir se houve produção. Abra Detalhes para ver operação e horário da consulta. Falta embalar continua sendo o saldo da OP menos Caixas 40, não o saldo do que já foi produzido. Pedidos separados do estoque mostram No pedido e não têm essa coluna de produção."
      },
      {
        "title": "Encontre o que precisa conferir",
        "short": "Use A revisar, A embalar ou Filtros. Compare sempre com os produtos físicos.",
        "text": "Filtros combinam situação da embalagem, divergência, unidade e Caixa 40. Ordene por produto, número da OP ou maior saldo na mesma unidade. A contagem dos atalhos considera o pedido inteiro; a busca e a paginação restringem a visualização. Caixas menores ainda fora da Caixa 40 não entram no total embalado."
      },
      {
        "title": "Consulte a ajuda e avance",
        "text": "Passe o mouse sobre o ícone de ajuda, navegue pelo teclado ou toque nele no celular para ver explicações. Escape fecha a dica. Alertas que exigem correção permanecem visíveis. Depois da conferência física, use Continuar para montagem das caixas.",
        "short": "Use os ícones de ajuda quando precisar. Após conferir fisicamente, continue para a montagem."
      }
    ],
    "done": "Produtos e quantidades foram conferidos e o responsável está identificado.",
    "next": [
      "boxes"
    ],
    "code": "POP-04",
    "owner": "Responsável pela conferência",
    "objective": "Confirmar identidade, unidade e quantidade dos produtos antes de embalar.",
    "records": "Responsável e transportadora planejada no painel; divergências registradas nas orientações.",
    "deviation": "Produto trocado, falta ou excesso: interrompa a montagem do item divergente, identifique a causa e confira novamente. Para remessa parcial, registre somente o que será enviado."
  },
  {
    "id": "boxes",
    "category": "expedition",
    "title": "Monte caixas menores e Caixa 40 na planilha",
    "target": "board",
    "action": "Abrir expedição pelo cartão",
    "before": "Confira os produtos e abra o pedido → Expedição → Montar caixas → Planilha do pedido. Use Abrir tela da planilha para trabalhar com mais espaço.",
    "steps": [
      {
        "title": "Escolha a modalidade",
        "short": "Use Com caixas menores, Com bags ou montagem direta. O modo misto permite combinar os três.",
        "text": "A planilha fica disponível diretamente em Montar caixas, sem precisar preparar as menores em outra etapa. Quando todos os produtos forem de 250 g, 500 g ou 1 kg, o painel mantém a montagem direta automática. Embalagens anteriores continuam preservadas."
      },
      {
        "title": "Crie a Caixa 40 junto com as menores",
        "short": "Digite a primeira quantidade em Nova menor ou Nova bag. A embalagem já nasce dentro da Caixa 40.",
        "text": "A planilha já mostra os produtos do pedido. Na coluna Nova menor ou Nova bag, a primeira quantidade positiva cria a embalagem dentro da Caixa 40 selecionada. Se não existir uma maior, as duas são criadas juntas. Continue na mesma coluna para incluir outros produtos. A próxima coluna Nova menor permite começar outra embalagem. Nova Caixa 40 abre outro destino, sem criar menores vazias. A tela abre na primeira Caixa 40 em montagem. Selecione outra no alto quando necessário; Todas fica disponível para a visão geral. O botão Adicionar caixas menores ou Adicionar bags continua disponível para criar várias colunas vazias; nesse botão, Quantidade é o número de embalagens."
      },
      {
        "title": "Digite as quantidades do pedido",
        "short": "Cada linha é um produto/OP e cada coluna é uma caixa menor, bag ou Caixa 40 direta.",
        "text": "Confira o SKU e digite a quantidade real na unidade da OP. Nova menor é apenas um espaço de criação: 0, campo vazio ou valor rejeitado não criam caixas. Cada coluna criada corresponde a uma menor já vinculada à maior. A tabela é a referência do conteúdo; o total da Caixa 40 acompanha a digitação. Ver produtos, na lateral, abre o detalhamento somente quando necessário. No celular, a quantidade do pedido fica abaixo do produto para deixar a coluna editável visível. Pedido mostra a quantidade prevista; Falta embalar desconta tudo já distribuído, inclusive embalagens sem Caixa 40. Tab avança para a próxima caixa e Enter para o próximo produto. Apagar ou digitar 0 retira aquele item. A busca aceita SKU, produto e OP; Só falta embalar mostra o que ainda precisa distribuir ou revisar."
      },
      {
        "title": "Preencha em lote, cole ou duplique",
        "short": "Em Mais ações (…), use Criar menores preenchidas para repetir um produto em várias embalagens.",
        "text": "Na criação preenchida, escolha o produto, o número de embalagens e a quantidade por embalagem. Confira o total e o saldo antes de criar. A maior é criada junto quando necessário; falta de saldo rejeita o lote inteiro. Desfazer reverte a última ação da planilha, incluindo digitação, colagem, criação e movimentação, enquanto não houver outras mudanças na montagem. A colagem segue as linhas e colunas visíveis e deve caber na página e nas caixas existentes. Use Todas para distribuir entre Caixas 40. Se qualquer valor for inválido ou ultrapassar o pedido, o intervalo inteiro é rejeitado. Duplicar repete produtos, quantidades e dados na mesma Caixa 40, quando houver saldo. Confira lotes e validade da cópia. Se a mesma OP tiver vários lotes dentro da mesma embalagem, use Revisar itens para preservar a separação."
      },
      {
        "title": "Escolha o destino sem refazer o conteúdo",
        "short": "Selecione a menor e escolha a Caixa 40 na lateral. Em Todas, o destino fica no topo de cada coluna.",
        "text": "Para transferir várias, abra Mais ações (…) → Mover menores em lote, marque as colunas, escolha o destino e clique em Mover selecionadas. A lista permite mover a embalagem inteira para outra Caixa 40, criar uma nova ou deixá-la Sem Caixa 40. Produtos, quantidades e dados acompanham a mudança; a menor continua editável na planilha enquanto a maior estiver em montagem. O saldo do pedido não muda por uma transferência. Remover embalagem vazia retira apenas uma menor sem itens. Uma Caixa 40 montada precisa ser reaberta antes de receber ou mover embalagens."
      },
      {
        "title": "Entenda quantidade e conteúdo por embalagem",
        "short": "Em UNID, o padrão é 1 produto por unidade. Em KG, quatro pacotes de 250 g correspondem a 1 kg.",
        "text": "Abra Lotes e dados dos produtos na planilha. Em Revisar dados do produto, Unidades embaladas é o número de pacotes ou frascos. Conteúdo por embalagem é quanto produto existe dentro de cada um, na unidade da OP: para pacotes de 250 g e OP em KG, informe 0,250; quatro pacotes somam 1 kg. Para OP em L, dez frascos de 100 ml usam conteúdo 0,100 e somam 1 litro. Em UNID, o padrão é 1 produto por unidade e o campo fica dispensado; conversões já cadastradas continuam visíveis. Esse conteúdo não é o número de caixas. Informe o peso líquido por unidade em kg separadamente; não transforme litros em peso sem pesagem."
      },
      {
        "title": "Confira lote e validade",
        "short": "O lote é preenchido com a OP; a validade vem do lote no Nomus. Confira ambos e ajuste se necessário.",
        "text": "Abra Lotes e dados dos produtos na planilha. Em Revisar dados do produto, o lote recebe o número da ordem, como OP5981. A validade é consultada no Nomus para o lote correspondente ao produto e à empresa. Aguarde o salvamento e a sincronização com o painel aberto. A data não é calculada pela criação da OP. Se continuar vazia, confira a validade no sistema e preencha manualmente quando confirmada. Valores já informados manualmente são preservados. Produtos separados do estoque sem OP exigem a identificação manual do lote."
      },
      {
        "title": "Conclua a Caixa 40 na própria planilha",
        "short": "Confira as colunas e o total na lateral; clique em Concluir Caixa 40 uma única vez para a maior e suas menores.",
        "text": "Não deixe menores vazias: preencha ou remova as que não serão usadas. A Caixa 40 recebe o status Montada e suas quantidades ficam bloqueadas. Ela continua visível na planilha. Para corrigir, use Reabrir Caixa 40 e edite as mesmas colunas. Essa conclusão não substitui a conferência física nem registra despacho. Mudanças no conteúdo ou na composição exigem nova pesagem e conferência."
      },
      {
        "title": "Confira pesos, medidas e detalhes",
        "short": "Clique em Pesos e detalhes da Caixa 40 para abrir os dados da caixa concluída.",
        "text": "Pese a caixa pronta com produtos, embalagens e proteções. Informe o peso bruto em kg e as dimensões externas em cm. A conversão para lb é automática. O peso líquido soma os produtos. Tara inclui embalagens vazias e proteções; limite e tara ficam recolhidos. Caixa 40 é o nome do modelo, não uma medida. Lotes e dados dos produtos abre o formulário detalhado. Para usar a montagem anterior, selecione Formulário por produto; os mesmos dados são preservados."
      },
      {
        "title": "Confirme a conferência física e aguarde Salvo",
        "short": "Compare as caixas reais em Conferir caixas montadas e use Conferi as caixas físicas.",
        "text": "Identifique o responsável em Conferir produtos. Confira produtos, lotes, quantidades, pesos e medidas. Caixas 40 em montagem, menores sem a maior e outras pendências impedem a confirmação. A planilha salva pelo mesmo fluxo do pedido: aguarde Salvo antes de sair. Só depois siga para os documentos."
      }
    ],
    "done": "Conteúdo, peso e medidas foram revisados e a conferência física está confirmada.",
    "next": [
      "packing",
      "invoices"
    ],
    "code": "POP-05",
    "owner": "Equipe de expedição e responsável pela conferência",
    "objective": "Montar volumes rastreáveis, com conteúdo e pesagem corretos.",
    "records": "Produtos por caixa, quantidades, lotes e validades informados, caixas em montagem ou finalizadas, pesos, medidas e conferência física com responsável e data.",
    "deviation": "Quantidades acima do pedido são bloqueadas. Use Reabrir Caixa 40 para corrigir uma montada. Embalagens sem Caixa 40 precisam de destino. Mudanças físicas exigem nova pesagem e conferência. Se a OP tiver vários lotes na mesma embalagem, revise no formulário. Preserve as edições enquanto o indicador mostrar falha ou espera de gravação."
  },
  {
    "id": "packing",
    "category": "documents",
    "title": "Packing list: reúna pedidos e destinatário",
    "target": "packing",
    "action": "Abrir packing lists",
    "before": "Use este caminho para o documento de volumes, inclusive quando vários pedidos viajam juntos.",
    "steps": [
      {
        "title": "Localize o envio e veja a próxima ação",
        "short": "Pesquise pedido, cliente ou invoice. Use A preparar, Prontos para revisão ou Despachados.",
        "text": "Abra o envio existente para retomar a primeira pendência dos dados salvos. A faixa Próxima ação orienta a continuidade. Use Novo packing list somente quando ainda não houver documento para aquele envio; caixas existentes são reaproveitadas."
      },
      {
        "title": "Etapa 1 — Pedidos e destinatário",
        "short": "Confira os pedidos selecionados. Para incluir outros, abra Adicionar outros pedidos ao envio.",
        "text": "Selecione somente pedidos que viajarão juntos. Confirme ou descarte a seleção antes de mudar de etapa ou sair. A escolha de pedidos sozinha ainda não confirma o agrupamento."
      },
      {
        "title": "Confirme o destinatário",
        "text": "Consulte clientes no Nomus, escolha o titular e o endereço correto. Use Confirmar titular e reunir pedidos. Uma consulta, sozinha, não substitui dados já salvos.",
        "short": "Confira quem receberá a mercadoria e confirme o titular e o endereço."
      },
      {
        "title": "Confira as caixas reunidas",
        "text": "O agrupamento aproveita as caixas existentes. Se os pedidos, as OPs ou as caixas mudaram, abra a expedição e confira novamente o conjunto antes de documentar. Aguarde Salvo.",
        "short": "Revise as caixas reunidas. Se o conjunto mudou, faça uma nova conferência."
      }
    ],
    "done": "Pedidos e destinatário estão confirmados e as caixas do conjunto foram conferidas.",
    "next": [
      "document"
    ],
    "code": "POP-06",
    "owner": "Responsável pela documentação e conferência",
    "objective": "Definir os pedidos e o destinatário do envio compartilhado.",
    "records": "Pedidos agrupados, titular, endereço e caixas no mesmo envio.",
    "deviation": "Destinatário ou pedidos incorretos: não confirme a seleção. Se o conjunto físico mudar, volte à expedição e refaça a conferência."
  },
  {
    "id": "reuse",
    "category": "documents",
    "title": "Atualize um envio existente sem duplicar",
    "target": "packing",
    "action": "Abrir envios existentes",
    "before": "Use quando precisar acrescentar pedidos ou corrigir o destinatário de um envio já criado.",
    "steps": [
      {
        "title": "Abra o mesmo envio",
        "text": "Abra o envio existente em Packing lists. Use Itens e caixas para consultar os volumes; siga o atalho Abrir expedição quando precisar corrigir conteúdo físico. Os pedidos agrupados compartilham o mesmo cadastro.",
        "short": "Abra o envio que já existe."
      },
      {
        "title": "Acrescente pedidos, se necessário",
        "text": "Marque os pedidos adicionais e use Confirmar pedidos e manter destinatário. Não é necessário consultar novamente o titular já confirmado.",
        "short": "Para incluir pedidos, selecione-os e confirme mantendo o destinatário, quando ele continuar o mesmo."
      },
      {
        "title": "Atualize o endereço com revisão",
        "text": "Consultar / atualizar destinatário preenche campos vazios por padrão. Para substituir dados do mesmo titular, marque a opção de substituição. Ao trocar de titular, leia a confirmação e confira os campos ausentes.",
        "short": "Consulte o destinatário e confira o endereço antes de aplicar mudanças."
      },
      {
        "title": "Confirme o novo conjunto",
        "text": "Revise os códigos das caixas, que podem ser ajustados se houver repetição. Mudanças físicas exigem nova conferência. Uma seleção ainda não confirmada deve ser confirmada ou descartada antes de sair.",
        "short": "Confira as caixas e aguarde Salvo. Se houve mudança física, refaça a conferência."
      }
    ],
    "done": "As alterações estão salvas no envio existente e o conjunto foi revisado.",
    "next": [
      "document"
    ],
    "code": "POP-07",
    "owner": "Responsável pela documentação",
    "objective": "Atualizar o envio existente sem duplicar dados ou volumes.",
    "records": "Destinatário e pedidos atualizados no mesmo cadastro de envio.",
    "deviation": "Se houver seleção pendente, confirme ou descarte antes de sair. Verifique os códigos ajustados das caixas e confira novamente alterações físicas."
  },
  {
    "id": "document",
    "category": "documents",
    "title": "Packing list: revise e baixe PDF ou Excel",
    "target": "packing",
    "action": "Abrir documentação do packing list",
    "before": "Abra o envio existente em Packing lists. Siga as quatro etapas no alto da tela; a faixa Próxima ação aponta o que falta.",
    "steps": [
      {
        "title": "Etapa 1 — Pedidos e destinatário",
        "short": "Confira os pedidos do envio, o titular e o endereço real de entrega.",
        "text": "Consulte o destinatário quando necessário e confirme as alterações. Se houver seleção de pedidos pendente, confirme ou descarte antes de avançar. Ao reunir novos volumes, refaça a conferência física do conjunto."
      },
      {
        "title": "Etapa 2 — Itens e caixas",
        "short": "Confira descrição documental, HS Code, embalagem, unidades e pesos. Lote e validade continuam no cadastro interno.",
        "text": "As caixas precisam da conferência física na Expedição. Se faltar essa confirmação, use o atalho para conferir. Para ajustes físicos, volte à montagem; depois pese e confira novamente. Dados documentais não substituem a contagem física. Se a mesma OP estiver em várias caixas, use Completar dados repetidos para aproveitar apenas os campos documentais vazios. Correções existentes, quantidades, pesos, lotes e validades são preservados; dados divergentes não são propagados."
      },
      {
        "title": "Etapa 3 — Dados do documento",
        "short": "Confira invoice, países, comprador/importador, destinatário, transporte e condições reais do envio.",
        "text": "Informações complementares aparece antes de Destinatário e entrega. Preencha comprador/importador diferente, referências e contatos quando aplicáveis. Confira países de origem e destino, Incoterm, pagamento, pré-transporte, local de recebimento, voo/navio, portos e destino final. Cada envio usa seus próprios dados; os exemplos não são padrões. Opcionais sem aplicação podem ficar vazios. O responsável pela revisão fica registrado internamente."
      },
      {
        "title": "Etapa 4 — Revisar e baixar",
        "short": "Confira destinatário, caixas, unidades e pesos. Resolva as pendências e aguarde Salvo.",
        "text": "Baixar rascunho permite verificar a apresentação. Para o PDF final, marque a confirmação da revisão e use Baixar packing list PDF. Ao editar dados ou reabrir o envio, a confirmação deve ser feita novamente. Prontos para revisão significa dados completos, não que alguém já revisou ou enviou o PDF."
      },
      {
        "title": "Se precisar de planilha, baixe o Excel",
        "short": "Baixar Excel editável gera quatro abas, todas sem linhas ou colunas congeladas.",
        "text": "A aba Packing list reúne dados das partes, transporte, condições comerciais, totais e produtos por caixa. Dimensões, pesos e unidades aparecem junto de cada caixa. Produtos e Caixas alimentam as fórmulas da principal; Guia e pendências reúne as orientações. Não há coluna duplicada de quantidade. OP, SKU, lote, validade e nomes internos dos funcionários não integram esse layout de exportação. Após salvar e conferir as caixas, o Excel pode ser baixado com pendências documentais sinalizadas; o PDF final exige resolvê-las e confirmar a revisão."
      },
      {
        "title": "Mantenha os dados consistentes",
        "short": "Edições no Excel não voltam automaticamente ao painel. Baixar um arquivo não registra despacho.",
        "text": "Para emitir no painel um PDF com uma alteração feita no Excel, atualize também os campos do site. Fórmulas recalculam pesos líquidos e totais; o peso bruto exige pesagem real. Se inserir linhas, confira os intervalos das fórmulas. Registre saída e rastreio somente após o despacho físico."
      }
    ],
    "done": "O arquivo corresponde às caixas conferidas. O PDF final foi revisado; a planilha editável identifica eventuais pendências.",
    "next": [
      "dispatch"
    ],
    "code": "POP-08",
    "owner": "Responsável pela documentação e revisão",
    "objective": "Emitir o packing list correspondente aos volumes conferidos.",
    "records": "Dados do documento salvos, responsável pela revisão e arquivos PDF ou Excel baixados. A confirmação final é solicitada novamente ao reabrir.",
    "deviation": "Pendência de cálculo, código, destinatário ou volume: corrija antes de emitir a versão final. Se mudar conteúdo, peso ou medidas, retorne à conferência física."
  },
  {
    "id": "invoices",
    "category": "documents",
    "title": "Invoice FedEx ou DHL: um pedido por documento",
    "target": "invoices",
    "action": "Abrir invoices",
    "before": "Use para encomenda direta ao cliente. Confira fisicamente os produtos e volumes antes de emitir.",
    "steps": [
      {
        "title": "Crie ou retome a invoice",
        "text": "O atalho do pedido abre diretamente sua invoice quando existe apenas uma. Se houver várias, mostra a lista daquele pedido. Nova invoice aproveita o pedido de origem; o menu Invoices abre a lista geral. Cada documento continua contendo um pedido.",
        "short": "Abra Invoice pelo pedido para retomar a existente. Se não houver, crie Nova invoice."
      },
      {
        "title": "Selecione o pedido e reaproveite dados",
        "text": "Ao selecionar o pedido, destinatário, referências e produtos disponíveis são aproveitados juntos. Aproveitar dados e produtos completa campos vazios e permite revisar mudanças na origem, preservando preços da mesma unidade e correções manuais. Em envio agrupado, a invoice direta usa os produtos do pedido escolhido: destinatário, AWB e volumes compartilhados não são copiados automaticamente, pois a encomenda direta pode ter outro destino. Se faltar conferência física, use Conferir caixas na expedição para ir diretamente à montagem ou às caixas montadas.",
        "short": "Selecionar o pedido já aproveita dados e produtos disponíveis. Se aparecer Revisar atualização, compare as mudanças antes de aplicá-las."
      },
      {
        "title": "Confira endereços e referências",
        "text": "Revise remetente, destinatário, comprador quando diferente, número, datas, AWB, moeda e países. Consulte o destinatário no Nomus ou preencha manualmente. Dados aplicados do cadastro preenchem campos vazios; confira o endereço de entrega real.",
        "short": "Confira remetente, destinatário, endereço, datas e referência do transporte."
      },
      {
        "title": "Preencha produtos e valores",
        "text": "Confira descrição, HS Code/NCM, SKU, identificação, embalagem, quantidade, unidade, peso por unidade e valor unitário. Informe o total de volumes físicos separadamente e o frete, inclusive 0 quando não houver cobrança.",
        "short": "Confira produtos, quantidades, pesos, valores, frete e total de volumes."
      },
      {
        "title": "Revise e exporte",
        "text": "Em Revisar e exportar, confira responsável, cargo, local e data da declaração. Resolva as pendências, aguarde Salvo e confirme a revisão para baixar o PDF final. Rascunho PDF e Excel editável permitem revisar dados ainda incompletos após o salvamento.",
        "short": "Resolva as pendências, aguarde Salvo e revise antes de baixar o PDF. O Excel fica disponível para edição."
      },
      {
        "title": "Mantenha as versões consistentes",
        "text": "Alterações no Excel não retornam automaticamente ao site. Atualize o painel para gerar um novo PDF ou exporte pelo Excel. Ao inserir linhas na planilha, confira os intervalos das fórmulas. O download não registra despacho.",
        "short": "Se alterar o Excel, atualize também o painel antes de gerar um novo PDF por ele."
      }
    ],
    "done": "O documento foi revisado para o único pedido e corresponde aos volumes reais.",
    "next": [
      "dispatch"
    ],
    "code": "POP-09",
    "owner": "Responsável pela documentação e revisão",
    "objective": "Emitir a invoice FedEx ou DHL correta para um único pedido.",
    "records": "Invoice salva com pedido, destinatário, itens, valores e arquivos PDF ou Excel exportados.",
    "deviation": "Pedido, preço, peso ou destinatário divergente: corrija e revise novamente. Se editar a planilha, atualize também o painel quando precisar gerar o PDF por ele."
  },
  {
    "id": "dispatch",
    "category": "shipping",
    "title": "Registre a saída e o rastreio",
    "target": "packing",
    "action": "Abrir envios e rastreio",
    "before": "Faça este registro somente depois da saída física da mercadoria.",
    "steps": [
      {
        "title": "Envio com packing list",
        "text": "Abra Packing lists → Itens e caixas → Após o despacho: registrar rastreio. Preencha transportadora, código e data efetiva do envio. O registro é compartilhado entre pedidos agrupados.",
        "short": "Após o despacho, abra o packing list e registre transportadora, rastreio e data de envio."
      },
      {
        "title": "Envio direto por invoice",
        "text": "Abra a invoice → Pedidos e envio → Registrar data de envio. Informe a data efetiva do despacho. A data de exportação e a data da invoice são campos documentais separados.",
        "short": "Para invoice direta, abra Pedidos e envio → Registrar data de envio."
      },
      {
        "title": "Atualize os cartões enviados",
        "text": "No cartão, em Geral, mova o pedido para Enviados somente quando estiver totalmente atendido e enviado. Em remessas parciais, confira o saldo antes de encerrar o pedido. Baixar PDF ou preencher rastreio não muda essa etapa automaticamente.",
        "short": "Registre a data de despacho, confira os volumes e o saldo. Enviados só aceita pedidos completamente alocados e conferidos."
      },
      {
        "title": "Acompanhe pelo registro existente",
        "text": "Consulte o rastreio salvo e faça correções no mesmo envio. Não crie outra caixa ou outro packing list para corrigir um campo. O painel ainda não consulta automaticamente os eventos da transportadora.",
        "short": "Consulte e corrija os dados no mesmo envio, sem criar outro cadastro."
      }
    ],
    "done": "A saída real está registrada, com data e rastreio quando aplicável, e as etapas estão atualizadas.",
    "next": [
      "cleanup"
    ],
    "code": "POP-10",
    "owner": "Equipe de expedição e responsável pelo envio",
    "objective": "Registrar a saída física e manter o acompanhamento do pedido.",
    "records": "Data efetiva de envio, transportadora, rastreio quando aplicável e etapa do cartão.",
    "deviation": "Sem saída física, não registre o despacho. Em remessa parcial, confira o saldo e não marque o pedido inteiro como totalmente enviado antes de sua conclusão."
  },
  {
    "id": "cleanup",
    "category": "shipping",
    "title": "Exclua somente documentos não finalizados",
    "target": "packing",
    "action": "Abrir packing lists",
    "before": "Aguarde Salvo e confira qual documento deseja remover.",
    "steps": [
      {
        "title": "Identifique o rascunho",
        "text": "Na lista de Packing lists ou Invoices FedEx / DHL, procure Excluir. Documentos com data de envio ou pedido do envio na coluna Enviados ficam protegidos. A data de envio registrada na própria invoice também bloqueia sua exclusão.",
        "short": "Na lista de documentos, procure Excluir. Documentos finalizados ficam protegidos."
      },
      {
        "title": "Confira o que será removido",
        "text": "Excluir packing list retira o documento da lista e limpa sua referência de emissão; caixas, produtos, agrupamento, destinatário e rastreio permanecem. Novo packing list permite selecionar esse envio e recriar o documento sem remontar caixas. Excluir invoice remove apenas aquela invoice.",
        "short": "Excluir remove o documento escolhido. As caixas, pedidos e o rastreio são preservados."
      },
      {
        "title": "Confirme ou cancele",
        "text": "Leia a confirmação. Cancelar preserva tudo. A exclusão confirmada não pode ser desfeita. Arquivos PDF ou Excel já baixados não são apagados do computador.",
        "short": "Leia a confirmação. Cancele se tiver dúvida: a exclusão confirmada não pode ser desfeita."
      },
      {
        "title": "Confira o resultado",
        "text": "Verifique se o documento saiu da lista. Em conflito com outra sessão, recarregue e confira antes de tentar novamente. O servidor também verifica se a exclusão é permitida.",
        "short": "Confira se o documento saiu da lista. Em caso de conflito, recarregue antes de tentar novamente."
      }
    ],
    "done": "Somente o documento escolhido foi removido e os demais registros foram preservados.",
    "next": [],
    "code": "POP-11",
    "owner": "Responsável pelo documento",
    "objective": "Remover cadastros não finalizados sem afetar outros registros.",
    "records": "Lista de documentos atualizada após a exclusão confirmada.",
    "deviation": "Documento finalizado: mantenha o registro. Não apague a data de envio nem altere a etapa apenas para liberar a exclusão. Em conflito ou erro, recarregue para conferir o resultado."
  },
  {
    "id": "recovery",
    "category": "support",
    "title": "Resolva pendências e falhas de salvamento",
    "target": "unlinked",
    "action": "Abrir pendências",
    "before": "Use quando um pedido não aparece, falta vínculo ou a tela indica Não salvo.",
    "steps": [
      {
        "title": "Identifique o tipo de pendência",
        "text": "Abra Mais → Pendências. Falta vincular o pedido exige correção no Nomus; Aguardando confirmação depende da consulta. O contador de Mais e da opção Pendências indica OPs sem vínculo no recorte permitido. Abrir a tela não elimina a pendência.",
        "short": "Abra Mais → Pendências e veja se falta vínculo ou se o sistema aguarda a consulta."
      },
      {
        "title": "Corrija o vínculo na origem",
        "text": "No Nomus, vincule a OP ao pedido e ao item correto. Volte ao painel, aguarde a consulta e confira o resultado. O site não cria nem corrige vínculos no ERP.",
        "short": "Se faltar vínculo, corrija o pedido e o item da OP no Nomus."
      },
      {
        "title": "Confira a cobertura da consulta",
        "text": "Base parcial indica leitura ainda incompleta. As consultas acontecem por etapas enquanto o painel está aberto e visível; em falha, a última informação conhecida permanece disponível.",
        "short": "Aguarde a consulta confirmar os dados. Base parcial significa que a leitura ainda não terminou."
      },
      {
        "title": "Recupere o salvamento",
        "text": "Se aparecer Não salvo, mantenha a tela aberta e use Tentar novamente. Aguardando gravação e Salvando indicam trabalho ainda pendente. Em conflito entre sessões, preserve suas edições e use Recarregar quadro no menu de três pontos para conferir a versão compartilhada. Recarregar não realiza uma nova consulta ao Nomus; use o indicador do ERP para isso.",
        "short": "Não salvo: tente novamente. Em conflito, preserve suas edições antes de recarregar pelo menu de três pontos."
      },
      {
        "title": "Confira a última captura",
        "short": "Consulte o horário da captura e use Atualizar quando precisar antecipar a consulta.",
        "text": "O horário ao lado do indicador do Nomus mostra a última etapa capturada. Atualizar antecipa uma etapa paginada; uma captura em andamento é compartilhada pela equipe. Dados já carregados permanecem salvos. Falhas preservam a captura anterior e espaçam as tentativas. A carga inicial concluída é reutilizada; consultas periódicas continuam necessárias para identificar alterações. OPs canceladas aparecem em Pendências, na lista de canceladas, e não contam como pendências de vínculo."
      }
    ],
    "done": "A pendência foi corrigida na origem ou você identificou o que ainda depende de consulta ou salvamento.",
    "next": [],
    "code": "POP-12",
    "owner": "Responsável pela pendência, com apoio do supervisor",
    "objective": "Restabelecer vínculos e salvamento antes de retomar o fluxo.",
    "records": "Vínculo corrigido no Nomus e confirmado na consulta, ou salvamento concluído no painel.",
    "deviation": "Se a consulta não concluir ou o salvamento falhar, preserve as informações e mantenha a pendência identificada. Não avance com dados cuja confirmação ainda está faltando."
  }
];
