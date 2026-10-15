export const manual = [
  {"category": "documents", "title": "Como baixar o packing list em Excel", "text": "Abra Packing lists → envio existente → Revisar e baixar → Baixar Excel editável. Aguarde Salvo. As caixas precisam estar conferidas fisicamente. A planilha contém Packing list, Produtos, Caixas e Guia e pendências. Dados documentais incompletos são sinalizados na planilha e não impedem a cópia editável. O PDF final exige resolver as pendências e confirmar a revisão. Alterações no Excel não voltam ao painel; atualize também o sistema se precisar gerar aqui um PDF com os mesmos dados. Nenhum download registra o despacho."},
  {"category":"documents","title":"Packing list: fluxo e continuidade entre funcionários","text":"A lista separa A preparar, Prontos para revisão e Despachados. Pesquise pelo pedido, cliente ou invoice. Ao abrir um envio existente, o painel retoma a primeira pendência dos dados salvos. Siga 1. Pedidos e destinatário → 2. Itens e caixas → 3. Dados do documento → 4. Revisar e baixar. A próxima ação e os nomes da conferência das caixas e da revisão documental ajudam outro funcionário a continuar. Consulte as explicações nos ícones de ajuda. Confirme ou descarte seleções de pedidos antes de sair; aguarde Salvo para encerrar o trabalho. Etapas preenchidas não significam PDF emitido. Quem finalizar deve revisar o documento e marcar a confirmação final. Mudanças físicas exigem nova conferência das caixas. Excluir um rascunho preserva os volumes, o destinatário e os dados do envio."},
  {"category":"expedition","title":"Quantidade atendida pela produção","text":"Em Conferir produtos, Atendido pela produção mostra a quantidade produzida na última operação do roteiro da OP no Nomus, sem somar etapas intermediárias. Na OP continua mostrando a quantidade programada atual e Em Caixas 40 continua mostrando o conteúdo das caixas. Falta embalar mantém o saldo da OP menos o conteúdo das Caixas 40. Produção pendente indica zero na última operação; Produção parcial indica quantidade menor que a OP e mostra quanto falta produzir; Produção concluída indica quantidade igual ou maior que a OP. Consultando Nomus indica dados ainda não consultados; Sem confirmação indica que a consulta não confirmou um valor, sem afirmar que a produção está pendente. Zero só aparece quando informado pelo Nomus. Os dados são consultados em lotes para os produtos da página visível, enquanto o painel estiver aberto. Em Detalhes, confira o horário da consulta e a operação utilizada. Essa coluna não confirma baixa de estoque nem o atendimento comercial do pedido. Pedidos separados do estoque não exibem essa coluna."},
  {"category":"expedition","title":"Caixa 40 automática para 250 g, 500 g e 1 kg","text":"Quando todos os itens do envio têm peso explícito de 250 g, 500 g ou 1 kg na descrição, a montagem abre diretamente em Montar Caixa 40 e não permite criar caixas menores. A verificação inclui itens do pedido ainda sem OP e todos os pedidos agrupados. Outros tamanhos, pesos desconhecidos ou descrições ambíguas mantêm a escolha de modalidade. Caixas menores já registradas são preservadas para revisão; novos produtos vão direto para a Caixa 40. Consulte o ícone de ajuda ao lado da modalidade para ver essa regra."},
  {"category":"production","title":"Etapas do quadro simplificado","text":"O quadro mostra Aguardando liberação → Na fila → Produzindo → Preparar envio → Enviados. Pedidos anteriormente bloqueados aparecem em Produzindo com o aviso Impedimento registrado; confira a orientação do supervisor e use Retomar produção quando o impedimento estiver resolvido. Pedidos que estavam em Conferir aparecem em Preparar envio. A conferência dos produtos continua dentro do pedido, em Expedição → Conferir produtos. As anotações, caixas e registros anteriores são preservados."},
  {"category":"start","title":"Menu superior do sistema","text":"A barra superior reúne Produção, Pedidos de venda, Packing lists, Invoices, Pendências, Caixas e Manual. No celular, deslize o menu na horizontal para acessar as demais opções. No computador, o tipo de produção, a busca e os filtros compartilham a mesma faixa abaixo do título. No celular, os controles se ajustam à largura da tela. Caixas abre os modelos reutilizáveis; a montagem continua dentro de cada envio."},
  {
    "category": "production",
    "title": "Aguardando liberação e Na fila",
    "text": "A primeira coluna do quadro, Aguardando liberação, reúne os pedidos ainda pendentes no Nomus. Havendo itens liberados e OP gerada, o pedido entra em Na fila na próxima consulta, inclusive se a liberação for parcial. No cartão, abra o aviso para ver quais itens ainda não foram liberados; a aba Geral também mostra produto, item e quantidade. Se há itens atendidos e outros ainda pendentes, o pedido com OP permanece na fila e o aviso Atendimento pendente identifica os itens restantes pela situação do Nomus. A quantidade exibida é a pedida, não um saldo calculado. Sem OP, o pedido liberado continua em Pedidos de venda aguardando sua criação. Pedidos já em produção, conferência ou expedição mantêm a etapa e os registros. Consultando liberação indica dados ainda não confirmados. Pedidos já na fila permanecem visíveis na etapa salva, com esse aviso; novos pedidos aguardam no catálogo. Pedidos de venda mantém o catálogo completo enquanto a consulta está incompleta. A liberação é feita no Nomus, sem alterações no ERP pelo painel."
  },
  {
    "category": "start",
    "title": "Busca, filtros e atalhos",
    "text": "Use / ou Ctrl/Cmd + K para focar a busca. F abre os filtros quando você não está digitando. Busque pelo número do pedido de venda, cliente, OP ou produto. Para PD 012345, a busca aceita 12345, 012345, PD012345 ou PV 12345; zeros à esquerda, espaços e o prefixo PD/PV não impedem encontrar o número. A mesma busca funciona em Pedidos de venda e respeita os filtros ativos do quadro. Remova um filtro pelo X sem perder os demais. A data ao lado do número no cartão, no cabeçalho do pedido e em Pedidos de venda é a criação do pedido no Nomus. Sem data indica que ela ainda não está disponível; a data da OP não é usada em seu lugar. O intervalo permitido começa em 01/10/2026; Sem data separa OPs sem criação confirmada. O filtro não reduz as caixas ou itens já salvos no envio. Em Filtros → Envio, escolha FedEx, DHL, Outras, A definir ou Múltiplas. Remover o filtro volta a exibir os demais pedidos."
  },
  {
    "category": "start",
    "title": "Responsáveis e acesso compartilhado",
    "text": "Responsável pela conferência, pela embalagem e pela revisão identificam funções diferentes. A lista inclui Pedro, Romulo, Hannibal, Victor e Daniel; nomes anteriores são preservados. Esses campos não criam contas nem bloqueiam edição por cargo. Use orientações do supervisor para tarefas e impedimentos."
  },
  {
    "category": "production",
    "title": "Medicina e produção interna em KG",
    "text": "Medicina Sagrada permanece fora do painel, considerando empresa e a palavra Medicina na identificação do pedido ou no cliente. OPs internas em KG podem ficar sem pedido e aparecem em Produção → Interna em KG, sem aviso de vínculo. As demais OPs precisam de pedido e item corretos."
  },
  {
    "category": "production",
    "title": "Pedidos de estoque sem OP",
    "text": "Em Pedidos de venda, use Separar do estoque quando os produtos estiverem disponíveis e o Nomus confirmar que não há OP. O pedido entra em Preparar envio com seus produtos, seguindo a mesma montagem de caixas, agrupamento e documentação. A ação identifica a forma de atendimento; não confirma saldo nem baixa estoque no Nomus. Mudanças nos itens exigem revisão das caixas."
  },
  {
    "category": "production",
    "title": "O que significa a diferença entre 100 e 80",
    "text": "Programada é a quantidade da primeira captura disponível, e atual é a quantidade da OP consultada no Nomus. Não é uma medição independente da produção realizada. Alterações anteriores à primeira captura não são recuperadas. Marcar como visto não apaga a diferença nem o histórico; são mantidas até 30 ocorrências recentes por pedido."
  },
  {
    "category": "expedition",
    "title": "Busca e números na conferência",
    "text": "Busque produto, OP ou unidade; a busca aceita vários termos e ignora acentos. Todos, A revisar e A embalar filtram a lista, sem confirmar a contagem física. As contagens desses botões representam o pedido inteiro; o resultado da busca aparece ao lado. A lista mostra 20 produtos por página. O botão Filtros abre situação da embalagem (sem, parcial ou total), divergência (qualquer, quantidade alterada, excesso ou dados incompletos), unidade e Caixa 40. Os critérios se combinam com a busca e os atalhos. Os filtros ativos permanecem visíveis mesmo com o painel recolhido e podem ser removidos individualmente. Limpar filtros preserva a busca; Mostrar todos os produtos também limpa a busca. A ordenação pode seguir produto, número da OP ou maior saldo por unidade; saldos desconhecidos ficam no fim de sua unidade. O filtro Caixa seleciona os produtos daquele volume, mantendo os totais do pedido nas colunas. Totalmente embalado não significa conferência física concluída. Em Caixas 40 considera produtos diretos e caixas menores já acomodadas; menores ainda em preparo não entram nesse total. Uma mudança de quantidade no Nomus não representa, por si só, falta física. Abra Detalhes para ver a origem e localizar a caixa."
  },
  {
    "category": "expedition",
    "title": "Como definir FedEx ou DHL",
    "text": "Na aba Geral do pedido, use Envio ao lado de Etiqueta e Empresa para identificar DHL ou FedEx. Ao selecionar DHL ou FedEx, a logo identifica o envio no campo e no cartão. A mesma escolha aparece em Expedição → Conferir produtos, no campo Transportadora. Essa escolha fica salva no envio e aparece no cartão e no filtro Envio do quadro. Pedidos agrupados compartilham a escolha. Sem transportadora definida, o painel usa FedEx ou DHL das invoices vinculadas; se houver as duas, o filtro indica Múltiplas até você definir o envio. Escolher a transportadora não contrata frete nem altera invoices: revise o documento separadamente."
  },
  {
    "category": "start",
    "title": "Onde estão os textos de ajuda?",
    "text": "As explicações da conferência, quantidade por embalagem, lote, validade e peso sugerido ficam nos ícones de ajuda. Passe o mouse, use Tab para chegar ao ícone ou toque no celular. Escape fecha a dica. Os avisos de divergência continuam visíveis para orientar a correção."
  },
  {
    "category": "expedition",
    "title": "Quantidade, unidades embaladas e peso",
    "text": "Quantidade segue a unidade da OP. Unidades embaladas conta pacotes ou frascos; Conteúdo por embalagem informa quanto produto vai em cada um. Exemplo: OP em KG, quatro pacotes de 250 g → 4 unidades embaladas, conteúdo 0,250 e quantidade total 1 kg. OP em L, dez frascos de 100 ml → conteúdo 0,100 e quantidade total 1 litro. Em UNID, 10 unidades equivalem a 10 produtos no padrão de 1 por unidade; o campo de conteúdo fica dispensado. Peso líquido por unidade é informado em kg e não é o peso da embalagem vazia. Para litros, confirme o peso por pesagem."
  },
  {
    "category": "expedition",
    "title": "Caixa maior, peso líquido, bruto e tara",
    "text": "Só a caixa maior conta como volume documental. O líquido soma os produtos uma vez; o bruto é obtido pesando a caixa pronta. A tara inclui embalagens vazias e proteções. Pesos claros no nome do produto podem ser sugeridos; correções manuais são preservadas. Peso e medidas não garantem encaixe: confira espaço, fragilidade e empilhamento."
  },
  {
    "category": "expedition",
    "title": "Corrija sem perder o conteúdo",
    "text": "Em Caixas 40 montadas, selecione a caixa e use Voltar à montagem. Ela retorna à área de criação com seus produtos. Para uma menor já acomodada, Retirar para ajustar devolve a embalagem inteira com o conteúdo. Ajuste, finalize e confira novamente. Mudanças físicas exigem nova pesagem; alterações documentais exigem revisão do documento. Caixas só são excluídas vazias."
  },
  {
    "category": "expedition",
    "title": "Para onde vai a Caixa 40 finalizada?",
    "text": "Montar Caixa 40 reúne somente caixas em criação. Ao clicar em Finalizar Caixa 40, ela sai dessa aba e aparece em Caixas 40 montadas para pesagem e conferência posterior. O conteúdo permanece salvo. Finalizar não equivale a conferir fisicamente nem a despachar. Para corrigir, use Voltar à montagem; não crie outra caixa para substituir o mesmo volume."
  },
  {
    "category": "expedition",
    "title": "Lote e validade automáticos",
    "text": "Ao selecionar a OP, o lote é preenchido com seu número. A validade vem do lote correspondente ao produto e à empresa no Nomus, durante a sincronização. Aguarde Salvo e mantenha o painel aberto para receber a consulta. A data de criação da OP não é usada como validade. Se o campo continuar vazio, confira o lote no Nomus e informe a validade confirmada. Ajustes manuais são preservados. Em separações do estoque sem OP, informe o lote manualmente."
  },
  {
    "category": "expedition",
    "title": "Onde configurar os modelos de caixa?",
    "text": "Abra Configurações de caixas no menu do painel para cadastrar modelos, medidas, limite de peso e tara. Na montagem, escolha o modelo em Modelo para novas caixas antes de criar a Caixa 40. Alterar o cadastro do modelo vale para novas caixas; confira os dados das caixas já existentes. A pesagem real continua sendo feita em Caixas 40 montadas."
  },
  {
    "category": "documents",
    "title": "Qual documento e qual formato usar",
    "text": "Packing list descreve volumes e pode reunir pedidos; o site gera seu PDF. Invoice FedEx/DHL é comercial, contém um pedido e pode ser exportada em PDF ou Excel editável. Escolha conforme a operação; um não substitui automaticamente o outro. O PDF oficial do pedido de venda continua sendo gerado no Nomus."
  },
  {
    "category": "documents",
    "title": "Limites e seleção de agrupamentos",
    "text": "Um envio aceita até 50 pedidos e 100 caixas. Pedidos já agrupados ficam fixos; não há desmembramento automático e um pedido não participa de dois agrupamentos. Uma OP vinculada a mais de um pedido é considerada uma única vez. Confirme ou descarte seleções pendentes antes de sair."
  },
  {
    "category": "documents",
    "title": "Reaproveitamento, códigos e valores",
    "text": "Consulta de destinatário preenche campos vazios por padrão. Substituir dados existentes exige revisão e confirmação. Descrição, SKU e HS Code podem ser reaproveitados entre itens da mesma OP. O formato do HS Code é validado, mas sua classificação deve ser confirmada pelo responsável. Na invoice, alterações da origem aparecem em Revisar atualização e impedem o PDF final até a comparação. Aplicar atualização substitui as linhas importadas, preserva itens manuais e preços da mesma unidade. Se a unidade comercial mudar, preencha novamente o preço. Preços dos PDFs de exemplo não são importados, e moedas não são convertidas."
  },
  {
    "category": "shipping",
    "title": "O que finaliza um documento",
    "text": "Data de envio no envio ou pedido do envio em Enviados impede excluir packing list e invoice vinculados. A data de envio da própria invoice também a protege. Data de exportação, emissão, assinatura ou download não registram a saída. Excluir um packing list em preparação retira o documento da lista e preserva caixas, agrupamento, destinatário e rastreio. Use Novo packing list e Recriar packing list para reutilizá-los. Enviados exige conferência física atual, alocação completa e data real de despacho. A assinatura permanece para preenchimento."
  },
  {
    "category": "support",
    "title": "O que o sistema altera no Nomus",
    "text": "A integração é somente leitura. Prioridades, etapas, notas, caixas, documentos e rastreio são salvos no painel. O site não baixa estoque, fatura pedidos, encerra OPs nem altera o cadastro do Nomus. Exportar CSV considera os pedidos visíveis; informações ausentes podem depender da conclusão das consultas."
  }
];
