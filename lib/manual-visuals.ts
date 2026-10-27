export type ManualVisual = {image:string; width:number; height:number; title:string; text:string; target:[number,number,number,number]};
const sizes:Record<string,[number,number]>={"conferencia-sku":[1200,1100],"historico":[1200,1000],"quadro":[1900,1000],"montar-caixas":[1200,1200],"modalidades":[1200,1200],"bag-conteudo":[1200,1200]};
const scenes:Record<string,Array<[string,string,string,[number,number,number,number]]>> = {
  "overview": [
    [
      "quadro",
      "Encontre o pedido",
      "Digite o número, cliente, OP ou produto na busca.",
      [
        295,
        80,
        1395,
        45
      ]
    ],
    [
      "quadro",
      "Veja a etapa atual",
      "As colunas mostram o caminho da liberação até o envio.",
      [
        24,
        170,
        1850,
        56
      ]
    ],
    [
      "quadro",
      "Abra o cartão",
      "Clique no pedido para acessar Geral, Expedição e Documentos.",
      [
        346,
        235,
        273,
        141
      ]
    ],
    [
      "quadro",
      "Ações de apoio",
      "Mais reúne Pendências, Arquivados, Modelos de caixas e Manual.",
      [
        611,
        14,
        61,
        36
      ]
    ],
    [
      "quadro",
      "Confira a gravação",
      "O visto confirma Salvo. Aguardando gravação, Salvando ou falhas precisam de atenção antes de sair.",
      [
        1811,
        80,
        32,
        46
      ]
    ],
    [
      "historico",
      "Consulte quem alterou e o que mudou",
      "Abra Histórico do pedido e expanda um registro para comparar Antes e Depois. Somente alterações salvas a partir desta atualização aparecem aqui.",
      [
        154,
        374,
        898,
        290
      ]
    ]
  ],
  "orders": [
    [
      "quadro",
      "Busque pedido ou cliente",
      "Confira o cliente e os produtos antes de começar.",
      [
        295,
        80,
        1395,
        45
      ]
    ],
    [
      "quadro",
      "Pedido não apareceu?",
      "Revise Filtros e o período de criação; use Limpar filtros quando necessário.",
      [
        1705,
        80,
        90,
        46
      ]
    ],
    [
      "quadro",
      "Confira as OPs",
      "O cartão mostra quantas ordens estão vinculadas. Abra-o para conferir cada item.",
      [
        355,
        336,
        90,
        30
      ]
    ],
    [
      "quadro",
      "Revenda liberada",
      "Pedidos só de revenda, totalmente liberados e sem OP, seguem para Preparar envio. Pedidos mistos mantêm a produção.",
      [
        960,
        170,
        290,
        56
      ]
    ]
  ],
  "production": [
    [
      "quadro",
      "Organize a prioridade",
      "Use as setas do cartão para ajustar a ordem de trabalho.",
      [
        548,
        378,
        64,
        38
      ]
    ],
    [
      "quadro",
      "Começou a produzir?",
      "Use Iniciar produção quando a equipe realmente começar. Confira antes as liberações parciais.",
      [
        355,
        379,
        120,
        37
      ]
    ],
    [
      "conferencia",
      "Quantidade alterada",
      "O aviso compara a programação anterior e a atual. Isso não confirma que o produto já foi produzido.",
      [
        344,
        686,
        260,
        29
      ]
    ],
    [
      "conferencia",
      "Compare com o produzido",
      "Confira a quantidade produzida e os produtos físicos antes de preparar as caixas.",
      [
        840,
        574,
        129,
        162
      ]
    ]
  ],
  "conference": [
    [
      "conferencia",
      "Localize o produto ou a OP",
      "Em Expedição → Conferir produtos, use esta busca.",
      [
        334,
        453,
        918,
        51
      ]
    ],
    [
      "conferencia",
      "Identifique a conferência",
      "Selecione o responsável e a transportadora.",
      [
        829,
        340,
        424,
        68
      ]
    ],
    [
      "conferencia",
      "Compare as quatro quantidades",
      "Produzido: 7. Na OP: 10. Em caixas: 4. Falta embalar: 6; ainda faltam produzir 3.",
      [
        839,
        572,
        413,
        166
      ]
    ],
    [
      "conferencia",
      "Confira antes de montar",
      "Compare com os produtos físicos; só depois continue para a montagem das caixas.",
      [
        970,
        805,
        282,
        44
      ]
    ]
  ],
  "boxes": [
    [
      "modalidades",
      "Escolha como embalar",
      "Use Com caixas menores ou Com bags para artesanatos. O modo misto permite juntar os dois tipos e produtos avulsos.",
      [
        123,
        235,
        954,
        170
      ]
    ],
    [
      "bag-conteudo",
      "Prepare a bag",
      "Clique em Nova bag, selecione o artesanato e informe a quantidade real. Cada bag tem sua identificação.",
      [
        418,
        462,
        638,
        145
      ]
    ],
    [
      "bag-conteudo",
      "Confira e finalize a bag",
      "Depois de conferir, finalize a bag e use Distribuir nas Caixas 40. O saldo controla as quantidades já separadas.",
      [
        401,
        829,
        157,
        42
      ]
    ],
    [
      "montar-caixas",
      "Selecione a caixa menor",
      "Cada cartão corresponde a uma caixa. Confira o conteúdo da caixa selecionada.",
      [
        97,
        453,
        258,
        104
      ]
    ],
    [
      "montar-caixas",
      "Informe o conteúdo real",
      "Selecione o produto e a quantidade. Em Revisar dados do produto, confira lote, validade e peso.",
      [
        425,
        779,
        631,
        120
      ]
    ],
    [
      "montar-caixas",
      "Finalize cada caixa menor",
      "Confira fisicamente antes de finalizar. Depois acomode as menores em Montar Caixa 40.",
      [
        412,
        1122,
        208,
        43
      ]
    ],
    [
      "montar-caixas",
      "Pese, meça e confira",
      "Depois de finalizar a Caixa 40, abra Caixas 40 montadas, informe peso bruto e medidas e confirme a conferência física.",
      [
        766,
        219,
        328,
        48
      ]
    ],
    [
      "conferencia-sku",
      "Confira primeiro o SKU",
      "O código em destaque identifica o produto. O nome fica abaixo como apoio. Compare o SKU e a quantidade com o conteúdo físico da caixa.",
      [
        112,
        288,
        475,
        70
      ]
    ]
  ],
  "packing": [
    [
      "packing-pedidos",
      "Confira os pedidos do envio",
      "O pedido selecionado aparece aqui. Confirme que pertence ao mesmo envio.",
      [
        195,
        615,
        217,
        78
      ]
    ],
    [
      "packing-pedidos",
      "Junte outro pedido",
      "Abra Adicionar outros pedidos ao envio, selecione e confirme o agrupamento.",
      [
        195,
        701,
        272,
        26
      ]
    ],
    [
      "packing-pedidos",
      "Confira o destinatário",
      "Valide titular e endereço real de entrega antes de continuar.",
      [
        195,
        792,
        1195,
        123
      ]
    ],
    [
      "packing-pedidos",
      "Revise as caixas do conjunto",
      "Em Itens e caixas, confira todos os volumes. Se o conjunto mudou, refaça a conferência física.",
      [
        496,
        451,
        293,
        60
      ]
    ]
  ],
  "reuse": [
    [
      "packing-lista",
      "Encontre o envio existente",
      "Busque por pedido, cliente ou número da invoice.",
      [
        170,
        266,
        600,
        64
      ]
    ],
    [
      "packing-lista",
      "Continue do ponto em que parou",
      "Abra a próxima ação do cartão; mantenha o mesmo envio.",
      [
        185,
        571,
        590,
        42
      ]
    ],
    [
      "packing-pedidos",
      "Inclua pedidos com conferência",
      "Adicione o pedido e confirme o destinatário. Revise o novo conjunto de caixas.",
      [
        195,
        701,
        272,
        26
      ]
    ]
  ],
  "document": [
    [
      "packing-dados",
      "Complete os campos destacados",
      "Preencher leva ao campo pendente. Confira também países, comprador, transporte e condições reais do envio.",
      [
        1161,
        636,
        229,
        43
      ]
    ],
    [
      "packing-exportar",
      "Confira os totais",
      "Compare caixas, unidades, peso líquido e peso bruto com o envio físico.",
      [
        195,
        442,
        1195,
        100
      ]
    ],
    [
      "packing-exportar",
      "Marque a revisão",
      "Confirme somente depois de revisar os dados e sua correspondência com as caixas.",
      [
        194,
        620,
        662,
        27
      ]
    ],
    [
      "packing-exportar",
      "Baixe o Excel editável",
      "São quatro abas, sem células congeladas. Alterações feitas no Excel precisam ser repetidas no painel.",
      [
        874,
        660,
        170,
        41
      ]
    ],
    [
      "packing-exportar",
      "Emita o PDF",
      "Resolva as pendências, aguarde Salvo e baixe o PDF final. Baixar não registra despacho.",
      [
        1207,
        660,
        183,
        41
      ]
    ]
  ],
  "invoices": [
    [
      "invoice-envio",
      "Selecione um único pedido",
      "Retome a invoice existente ou crie uma nova. Confirme o pedido desta encomenda.",
      [
        234,
        843,
        1117,
        45
      ]
    ],
    [
      "invoice-envio",
      "Revise as partes e referências",
      "Abra esta etapa para conferir remetente, destinatário, endereço, datas e transporte.",
      [
        513,
        395,
        278,
        46
      ]
    ],
    [
      "invoice-produtos",
      "Confira os dados importados",
      "Aproveite os dados e produtos disponíveis; compare as mudanças antes de aplicar uma atualização.",
      [
        394,
        540,
        189,
        42
      ]
    ],
    [
      "invoice-produtos",
      "Preencha o que falta",
      "Use o atalho Preencher para ir ao campo pendente. Confira quantidades, pesos, valores, frete e volumes.",
      [
        1087,
        472,
        265,
        42
      ]
    ],
    [
      "invoice-produtos",
      "Revise antes de exportar",
      "Nesta etapa, resolva pendências e confirme a revisão para emitir PDF ou Excel. Se editar a planilha, atualize também o painel.",
      [
        1074,
        395,
        278,
        46
      ]
    ]
  ],
  "dispatch": [
    [
      "invoice-envio",
      "Registre a saída real",
      "Na invoice direta, abra Pedidos e envio → Registrar data de envio, somente após o despacho.",
      [
        251,
        489,
        1084,
        66
      ]
    ],
    [
      "invoice-envio",
      "Informe a data da retirada",
      "Use a data em que a mercadoria saiu. No packing list, registre também transportadora e rastreio no próprio envio.",
      [
        250,
        575,
        355,
        66
      ]
    ],
    [
      "quadro",
      "Conclua em Enviados",
      "Mova o cartão só quando todo o pedido estiver alocado e conferido. Baixar documentos não move o cartão.",
      [
        1580,
        170,
        293,
        56
      ]
    ]
  ],
  "cleanup": [
    [
      "packing-lista",
      "Localize o documento correto",
      "Confira pedido e destinatário antes de excluir.",
      [
        186,
        420,
        590,
        126
      ]
    ],
    [
      "packing-lista",
      "Exclua somente o rascunho",
      "Clique em Excluir e leia a confirmação. Pedidos, caixas e rastreio permanecem; documentos finalizados ficam protegidos.",
      [
        685,
        621,
        104,
        26
      ]
    ],
    [
      "packing-lista",
      "Confira a lista",
      "Após confirmar, veja se o documento saiu da lista. A exclusão não remove os arquivos já baixados.",
      [
        170,
        346,
        440,
        40
      ]
    ]
  ],
  "handoff": [
    [
      "packing-dados",
      "Veja quem conferiu",
      "Leia o responsável pela conferência física e pela revisão documental.",
      [
        282,
        313,
        448,
        31
      ]
    ],
    [
      "packing-dados",
      "Siga a próxima ação",
      "Continue no mesmo envio; não é necessário remontar as caixas.",
      [
        195,
        365,
        1195,
        66
      ]
    ],
    [
      "packing-dados",
      "Complete a pendência",
      "Preencha a invoice confirmada, revise os dados herdados e aguarde Salvo.",
      [
        195,
        809,
        592,
        45
      ]
    ],
    [
      "packing-exportar",
      "Faça sua própria revisão",
      "Um responsável anterior não dispensa conferir o documento antes de marcar e baixar.",
      [
        194,
        620,
        662,
        27
      ]
    ]
  ],
  "recovery": [
    [
      "quadro",
      "Abra as pendências",
      "Use Mais → Pendências. Se faltar vínculo da OP, corrija o pedido e o item na origem, no Nomus.",
      [
        611,
        14,
        61,
        36
      ]
    ],
    [
      "quadro",
      "Confira a consulta do Nomus",
      "Veja horário e avisos. Base parcial significa leitura incompleta; Sem confirmação não significa zero.",
      [
        1814,
        135,
        65,
        21
      ]
    ],
    [
      "quadro",
      "Preserve o que não foi salvo",
      "Em falha, use Tentar novamente. Em conflito, preserve suas edições antes de recarregar pelo menu de três pontos.",
      [
        1810,
        80,
        65,
        46
      ]
    ]
  ]
};
export const manualVisuals:Record<string,ManualVisual[]> = Object.fromEntries(Object.entries(scenes).map(([key,items])=>[key,items.map(([image,title,text,target])=>({image:image+".png",width:sizes[image]?.[0]??1600,height:sizes[image]?.[1]??1000,title,text,target}))]));
