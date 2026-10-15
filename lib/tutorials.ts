export const manualEdition = {revision:"04",updatedAt:"15/10/2026"};
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
    "title": "Como começar",
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
        "text": "Aguarde Salvo antes de sair, exportar ou excluir. Consulte Pendências e ajuda se houver falha ou conflito entre sessões.",
        "short": "Antes de sair, espere aparecer Salvo."
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
        "text": "Pedidos sem OP entram no catálogo a partir de 01/10/2026. No quadro, o filtro considera a criação das OPs. Pedidos com OP vinculada são preservados; mudar o filtro não altera o conteúdo dos envios.",
        "short": "Se o pedido não aparecer, confira os filtros de data."
      },
      {
        "title": "Verifique os vínculos",
        "text": "Uma OP comum deve estar vinculada ao pedido e ao item correto no Nomus. Se faltar vínculo, consulte Pendências. Não associe somente por semelhança de produto ou cliente.",
        "short": "Confira se a OP está ligada ao pedido correto. Se faltar vínculo, abra Pendências."
      },
      {
        "title": "Identifique o que já existe",
        "text": "Se o pedido já tiver caixas ou documento, retome o cadastro existente. Se os produtos saem do estoque, use Separar do estoque no catálogo: o pedido entra em Conferir sem OP. Aguarde a confirmação de vínculo e os itens completos no Nomus antes dessa ação.",
        "short": "Se já houver caixas ou documento, abra o cadastro existente."
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
        "text": "O supervisor organiza os cartões pelas setas ou arrastando, seleciona responsáveis e registra orientações. Etiquetas Urgente, Atenção e Normal sinalizam a necessidade, sem mudar a ordem automaticamente.",
        "short": "Organize os cartões na ordem em que a equipe deve trabalhar."
      },
      {
        "title": "Atualize a etapa real",
        "text": "Use Na fila → Produzindo → Conferir. Use Bloqueados quando existir um impedimento. Os atalhos Iniciar produção e Concluir produção alteram a etapa do painel.",
        "short": "Mova o pedido conforme o trabalho: Na fila, Produzindo e Conferir. Use Bloqueados quando necessário."
      },
      {
        "title": "Confira as mudanças do Nomus",
        "text": "Abra Novidades neste pedido para comparar Campo, Antes e Agora. Marcar como visto confirma a leitura; não altera os dados do Nomus.",
        "short": "Abra Novidades neste pedido para ver o que mudou."
      },
      {
        "title": "Revise diferenças de quantidade",
        "text": "Se a OP passou de 100 para 80 no Nomus, o painel compara a quantidade atual com a primeira captura disponível. Confira a diferença e ajuste a preparação do envio ao que realmente existe.",
        "short": "Compare a quantidade atual da OP com a anterior antes de preparar o envio."
      }
    ],
    "done": "Os produtos estão disponíveis para conferência e as diferenças foram verificadas.",
    "next": [
      "conference"
    ],
    "code": "POP-03",
    "owner": "Supervisor e equipe de produção",
    "objective": "Disponibilizar os produtos previstos e identificar diferenças de quantidade.",
    "records": "Prioridade, etapa, responsável e orientações no cartão; quantidades da OP e histórico consultado.",
    "deviation": "Em caso de impedimento, use Bloqueados e registre a orientação. Ajuste a quantidade da OP no Nomus conforme a rotina real e confira a atualização antes de embalar."
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
        "title": "Abra a conferência",
        "text": "No cartão, entre em Expedição → 1. Conferir produtos. Ainda não é necessário criar caixas.",
        "short": "No cartão, abra Expedição → Conferir produtos."
      },
      {
        "title": "Identifique o responsável",
        "text": "Selecione quem está realizando a conferência e compare produtos, unidades e quantidades. Revise também mudanças detectadas no Nomus.",
        "short": "Selecione o responsável e compare produtos e quantidades com o que está disponível."
      },
      {
        "title": "Resolva divergências",
        "text": "Confira faltas e excessos antes de embalar. Remessas parciais são possíveis; registre nas caixas somente a quantidade realmente preparada.",
        "short": "Resolva faltas, excessos ou produtos trocados. Prepare somente o que será enviado."
      },
      {
        "title": "Avance para a montagem",
        "text": "Use Continuar para montagem das caixas. A distribuição dos produtos aparecerá conforme as caixas forem preenchidas.",
        "short": "Clique em Continuar para montagem das caixas."
      }
    ],
    "done": "Produtos e quantidades foram conferidos e o responsável está identificado.",
    "next": [
      "boxes"
    ],
    "code": "POP-04",
    "owner": "Responsável pela conferência",
    "objective": "Confirmar identidade, unidade e quantidade dos produtos antes de embalar.",
    "records": "Responsável pela conferência no cartão e divergências registradas nas orientações.",
    "deviation": "Produto trocado, falta ou excesso: interrompa a montagem do item divergente, identifique a causa e confira novamente. Para remessa parcial, registre somente o que será enviado."
  },
  {
    "id": "boxes",
    "category": "expedition",
    "title": "Monte e confira as caixas",
    "target": "board",
    "action": "Abrir expedição pelo cartão",
    "before": "Conclua a conferência dos produtos antes de iniciar a montagem.",
    "steps": [
      {
        "title": "Escolha a modalidade",
        "short": "Escolha Sem caixas menores ou Com caixas menores. Selecione uma caixa por vez.",
        "text": "Em Expedição → Montar caixas, escolha Sem caixas menores ou Com caixas menores. Habilite o modo misto somente se o envio combinar os dois tipos. A modalidade fica salva no embarque."
      },
      {
        "title": "Monte a Caixa 40 com produtos diretos",
        "short": "Em Montar Caixa 40, use Nova Caixa 40 → Adicionar produto. Selecione a OP e informe a quantidade.",
        "text": "Na modalidade Sem caixas menores, abra Montar Caixa 40, crie a caixa e adicione os produtos que estão fisicamente nela. Essa aba mostra somente caixas em criação. Confira o saldo em Produtos a distribuir; quantidades acima do disponível são bloqueadas."
      },
      {
        "title": "Acomode caixas menores, quando houver",
        "short": "Prepare e finalize cada caixa menor. Em Montar Caixa 40, escolha a maior e use Colocar nesta caixa.",
        "text": "Na modalidade Com caixas menores, abra Caixas menores → Nova caixa menor, adicione os produtos e use Conferir e finalizar caixa menor. Depois, em Montar Caixa 40, crie ou selecione a maior, escolha uma das Caixas menores prontas e clique em Colocar nesta caixa. Somente o modo misto permite misturar menores e produtos avulsos."
      },
      {
        "title": "Entenda quantidade e conteúdo por embalagem",
        "short": "Em UNID, o padrão é 1 produto por unidade. Em KG, quatro pacotes de 250 g correspondem a 1 kg.",
        "text": "Em Revisar dados do produto, Unidades embaladas é o número de pacotes ou frascos. Conteúdo por embalagem é quanto produto existe dentro de cada um, na unidade da OP: para pacotes de 250 g e OP em KG, informe 0,250; quatro pacotes somam 1 kg. Para OP em L, dez frascos de 100 ml usam conteúdo 0,100 e somam 1 litro. Em UNID, o padrão é 1 produto por unidade e o campo fica dispensado; conversões já cadastradas continuam visíveis. Esse conteúdo não é o número de caixas. Informe o peso líquido por unidade em kg separadamente; não transforme litros em peso sem pesagem."
      },
      {
        "title": "Confira lote e validade",
        "short": "O lote é preenchido com a OP; a validade vem do lote no Nomus. Confira ambos e ajuste se necessário.",
        "text": "Em Revisar dados do produto, o lote recebe o número da ordem, como OP5981. A validade é consultada no Nomus para o lote correspondente ao produto e à empresa. Aguarde o salvamento e a sincronização com o painel aberto. A data não é calculada pela criação da OP. Se continuar vazia, confira a validade no sistema e preencha manualmente quando confirmada. Valores já informados manualmente são preservados. Produtos separados do estoque sem OP exigem a identificação manual do lote."
      },
      {
        "title": "Finalize e separe as caixas prontas",
        "short": "Clique em Finalizar Caixa 40. Ela sai de Montar Caixa 40 e aparece em Caixas 40 montadas.",
        "text": "Depois de completar os produtos e quantidades, clique em Finalizar Caixa 40. A caixa sai da área de criação e permanece salva em Caixas 40 montadas para conferência posterior. Finalizar a caixa não confirma a conferência física nem registra o despacho. Para corrigir uma caixa finalizada, selecione-a em Caixas 40 montadas e use Voltar à montagem. Para corrigir uma menor já acomodada, use Retirar para ajustar; ela volta com seus produtos. Finalize novamente após os ajustes."
      },
      {
        "title": "Pese e meça as caixas montadas",
        "short": "Em Caixas 40 montadas, selecione cada caixa e informe dimensões em cm e peso bruto real em kg.",
        "text": "Pese a caixa pronta, incluindo produtos, embalagens e proteções. Registre dimensões externas em cm e peso bruto em kg; a conversão para lb é automática. O peso líquido soma os produtos. Limite de peso e tara ficam recolhidos; a tara inclui embalagens vazias e proteções. Caixa 40 é o nome do modelo, não uma medida. Cadastros de modelos ficam no menu Configurações de caixas, fora da montagem. Mudanças físicas no conteúdo exigem nova pesagem."
      },
      {
        "title": "Confirme a conferência física",
        "short": "Em Conferir caixas montadas, compare o cadastro com as caixas reais e clique em Conferi as caixas físicas.",
        "text": "Na aba Caixas 40 montadas, revise o conteúdo, os pesos e as medidas. Em Conferir caixas montadas, compare o resumo com os volumes físicos e use Conferi as caixas físicas. Identifique o responsável em Conferir produtos. Caixas 40 ainda em montagem, menores fora da maior e outras pendências impedem a confirmação. Depois, siga para os documentos. Aguarde Salvo antes de sair."
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
    "deviation": "Para corrigir uma caixa finalizada, use Voltar à montagem. Corrija faltas, excessos ou embalagens fora da maior, finalize novamente e confira. Mudanças físicas exigem nova pesagem. Validade ausente deve ser confirmada no Nomus; não use a data de criação da OP como validade."
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
        "title": "Retome ou crie o envio",
        "text": "Em Packing lists, procure Documentos e envios existentes. Se já houver caixas, abra esse envio. Use Novo packing list somente para um pedido ainda sem envio cadastrado.",
        "short": "Procure o envio existente. Use Novo packing list somente se ainda não houver envio cadastrado."
      },
      {
        "title": "Selecione os pedidos",
        "text": "Em Pedidos e destinatário, marque os pedidos que viajarão juntos. Confira cada cliente e quem receberá fisicamente a mercadoria.",
        "short": "Selecione os pedidos que viajarão juntos."
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
        "text": "Localize o packing list existente. Use Ver os pedidos deste envio → Abrir expedição para corrigir caixas; os pedidos agrupados compartilham o mesmo cadastro.",
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
    "title": "Packing list: revise e gere o PDF",
    "target": "packing",
    "action": "Abrir documentação do packing list",
    "before": "Tenha pedidos, destinatário e caixas conferidos. Para invoice FedEx/DHL, use o procedimento próprio desta categoria.",
    "steps": [
      {
        "title": "Revise os itens",
        "text": "Abra Dados dos itens. Confira descrição documental, SKU quando houver, HS Code confirmado e tipo de embalagem. Use os atalhos da expedição se precisar corrigir conteúdo ou quantidade.",
        "short": "Confira descrição, código e embalagem dos produtos."
      },
      {
        "title": "Complete o documento",
        "text": "Em Revisar e exportar → Completar dados do documento, confira número, exportador, destinatário, comprador quando diferente, países, referências, transporte e condições comerciais aplicáveis.",
        "short": "Em Revisar e exportar, complete os dados do documento e do destinatário."
      },
      {
        "title": "Confira os totais",
        "text": "Revise caixas, unidades, peso líquido, peso bruto e volume externo. Corrija as pendências; o resumo verifica preenchimento e cálculos, mas a conferência física cabe à equipe.",
        "short": "Confira caixas, quantidades e pesos. Resolva as pendências."
      },
      {
        "title": "Revise a versão final",
        "text": "Baixar rascunho permite conferir a apresentação. Para a versão final, resolva as pendências, aguarde Salvo e confirme a revisão. Em agrupamentos, confira também titular e pedidos.",
        "short": "Baixe um rascunho se quiser conferir a apresentação. Depois confirme a revisão."
      },
      {
        "title": "Baixe o PDF",
        "text": "Clique em Baixar packing list PDF. Uma alteração exige nova revisão. Baixar o documento não registra a saída nem move os cartões para Enviados.",
        "short": "Aguarde Salvo e clique em Baixar packing list PDF."
      }
    ],
    "done": "O PDF corresponde ao envio conferido e está pronto para acompanhar a operação.",
    "next": [
      "dispatch"
    ],
    "code": "POP-08",
    "owner": "Responsável pela documentação e revisão",
    "objective": "Emitir o packing list correspondente aos volumes conferidos.",
    "records": "Dados documentais salvos e PDF revisado para o envio.",
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
        "text": "Em Invoices FedEx / DHL, procure uma existente ou escolha o modelo e clique em Nova invoice. Cada documento contém exatamente um pedido.",
        "short": "Abra Invoices FedEx / DHL e escolha um documento existente ou Nova invoice."
      },
      {
        "title": "Selecione o pedido e reaproveite dados",
        "text": "Em Pedidos e envio, escolha o pedido permitido. Aproveitar dados do envio e Aproveitar produtos / caixas reutilizam informações existentes. Em envio agrupado, somente os produtos do pedido escolhido são aproveitados; as caixas compartilhadas não são copiadas automaticamente. Se a origem mudar, abra Revisar atualização, compare Antes e Depois e aplique a atualização. As linhas importadas são substituídas sem duplicar produtos; preços de outra unidade comercial precisam de novo preenchimento.",
        "short": "Selecione um pedido e aproveite os dados. Se aparecer Revisar atualização, compare as mudanças antes de aplicá-las."
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
        "text": "Abra Packing lists → Dados dos itens → Após o despacho: registrar rastreio. Preencha transportadora, código e data efetiva do envio. O registro é compartilhado entre pedidos agrupados.",
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
        "text": "Falta vincular o pedido exige correção no Nomus. Aguardando confirmação depende da consulta. O número verde na aba Pendências conta OPs sem vínculo no recorte permitido; abrir a aba não elimina a pendência.",
        "short": "Abra Pendências e veja se falta vínculo ou se o sistema ainda aguarda a consulta."
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
        "text": "Se aparecer Não salvo, mantenha a tela aberta e use Tentar novamente. Se outra sessão mudou o quadro, preserve suas edições e recarregue para conferir a versão compartilhada antes de continuar.",
        "short": "Se aparecer Não salvo, mantenha a tela aberta e tente novamente. Em conflito, preserve suas edições antes de recarregar."
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
