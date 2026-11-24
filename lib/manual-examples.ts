export type ManualExample = {scenario:string;actions:string[];result:string;image?:string;caption?:string};
export const manualExamples:Record<string,ManualExample> = {
  "overview": {
    "scenario": "Você começou o turno e precisa localizar um pedido.",
    "actions": [
      "Abra Produção e busque o número do pedido. Confira cliente e data ao lado do número.",
      "Veja a coluna atual e abra o cartão para consultar orientações e responsáveis.",
      "Siga para Expedição quando os produtos estiverem disponíveis."
    ],
    "result": "Você sabe qual pedido está atendendo e qual é a próxima atividade.",
    "image": "quadro.png",
    "caption": "Quadro atualizado com pedidos fictícios. As seis colunas representam as etapas do trabalho."
  },
  "handoff": {
    "scenario": "Victor conferiu as caixas, mas saiu antes de preencher o número da invoice.",
    "actions": [
      "Abra o packing list existente e confira o nome da conferência física.",
      "A próxima ação leva a Dados do documento. Informe a invoice confirmada e confira os demais campos.",
      "Identifique quem revisará o documento, aguarde Salvo e faça a revisão final."
    ],
    "result": "O envio continua com as mesmas caixas. Não é necessário remontar ou criar outro cadastro.",
    "image": "packing-dados.png",
    "caption": "Etapa Dados do documento: o envio já tem caixas conferidas e aguarda completar as referências."
  },
  "orders": {
    "scenario": "Um pedido tem dois itens: um liberado com OP e outro aguardando liberação.",
    "actions": [
      "Localize o pedido em Na fila.",
      "Abra o aviso no cartão para identificar o item ainda pendente.",
      "Prepare somente o que estiver confirmado e acompanhe a liberação do restante no Nomus."
    ],
    "result": "O pedido permanece visível na fila e a pendência do segundo item continua identificada."
  },
  "production": {
    "scenario": "A quantidade da OP mudou de 100 para 80 unidades.",
    "actions": [
      "Abra Novidades neste pedido para comparar Antes e Agora.",
      "Confira com a produção qual quantidade está disponível de fato.",
      "Consulte Produzido em Conferir produtos; a mudança de 100 para 80 não prova que 80 foram produzidas."
    ],
    "result": "Você separa alteração da programação de quantidade efetivamente produzida."
  },
  "conference": {
    "scenario": "A OP tem 10 unidades, a produção confirmou 7 e há 4 em Caixas 40.",
    "actions": [
      "Leia Na OP: 10; Produzido: 7; Em Caixas 40: 4.",
      "Falta embalar mostra 6, pois considera o total programado menos as caixas. Ainda faltam produzir 3.",
      "Confira fisicamente as 3 produzidas ainda fora das caixas antes de embalar."
    ],
    "result": "Produção parcial não é confundida com falta de consulta. Se aparecer Sem confirmação, verifique o Nomus antes de concluir.",
    "image": "conferencia.png",
    "caption": "Exemplo no sistema: programação, produção confirmada e embalagem aparecem separadas."
  },
  "boxes": {
    "scenario": "Um produto do pedido tem 20 unidades. Você quer criar três menores com 5 unidades cada e depois reorganizar os volumes.",
    "actions": [
      "Em Mais ações (…) → Criar menores preenchidas, escolha o produto, 3 embalagens e 5 unidades por embalagem. Confira 15 unidades no total e clique em Criar preenchidas. A primeira Caixa 40 é criada junto.",
      "As três colunas aparecem preenchidas com 5 unidades. Falta embalar mostra as 5 restantes do pedido. Corrija qualquer coluna digitando; Desfazer reverte a última edição.",
      "Para reorganizar, abra Mais ações (…) → Mover menores em lote, selecione duas colunas e escolha Nova Caixa 40. As duas menores levam suas 10 unidades; o saldo do pedido continua igual.",
      "Distribua as 5 unidades restantes, confira os demais produtos e conclua cada Caixa 40. Abra Pesos e detalhes, informe os valores reais e confirme a conferência física."
    ],
    "result": "As menores e as Caixas 40 foram montadas na mesma tela, sem cadastrar o mesmo conteúdo duas vezes.",
    "image": "planilha-caixas.png",
    "caption": "Planilha integrada com dados fictícios: produtos nas linhas, menores nas colunas e total da Caixa 40 ao lado. As ações extras ficam recolhidas."
  },
  "packing": {
    "scenario": "Dois pedidos viajarão juntos para o mesmo endereço de entrega.",
    "actions": [
      "Abra um envio existente e vá a Pedidos e destinatário.",
      "Em Adicionar outros pedidos ao envio, selecione o segundo pedido e confirme o agrupamento.",
      "Confira titular, endereço e caixas do conjunto antes de continuar."
    ],
    "result": "Um packing list reúne os pedidos e seus volumes, sem duplicar o cadastro.",
    "image": "packing-pedidos.png",
    "caption": "Os pedidos confirmados ficam visíveis; a inclusão de outros pedidos fica recolhida até ser necessária."
  },
  "reuse": {
    "scenario": "Um envio já tem uma caixa montada e será acrescentado outro pedido.",
    "actions": [
      "Pesquise e abra o envio que já existe.",
      "Inclua e confirme o novo pedido mantendo o destinatário, se ele continuar correto.",
      "Confira códigos, conteúdo e pesos do conjunto e refaça a conferência física quando exigida."
    ],
    "result": "A documentação usa o mesmo envio atualizado.",
    "image": "packing-lista.png",
    "caption": "A lista mostra o destinatário, os pedidos e a próxima ação para retomar cada envio."
  },
  "document": {
    "scenario": "Você precisa conferir os dados no Excel antes de emitir o PDF.",
    "actions": [
      "Na etapa Revisar e baixar, espere Salvo e clique em Baixar Excel editável.",
      "Abra Produtos: 2 pacotes × 5 kg resultam em 10 kg líquidos. Em Caixas, confira o peso bruto medido, por exemplo 11 kg.",
      "Se corrigir algo na planilha, corrija também o painel. Resolva pendências e marque a revisão antes do PDF final."
    ],
    "result": "Você tem uma cópia .xlsx editável, com quatro abas e totais calculados, além do PDF revisado.",
    "image": "packing-exportar.png",
    "caption": "Revisar e baixar reúne os totais, a confirmação da revisão e as opções Excel, rascunho e PDF."
  },
  "invoices": {
    "scenario": "Um pedido será enviado diretamente por DHL.",
    "actions": [
      "Abra Invoices, escolha o modelo DHL e vincule somente esse pedido.",
      "Aproveite os dados do envio e revise endereço, produtos, pesos, valores e frete.",
      "Confirme a revisão para emitir o PDF; use Excel editável quando precisar de uma planilha."
    ],
    "result": "A invoice comercial corresponde ao pedido escolhido; o packing list descreve a distribuição dos volumes."
  },
  "dispatch": {
    "scenario": "A transportadora retirou as caixas hoje.",
    "actions": [
      "No envio existente, registre transportadora, rastreio e data efetiva da retirada.",
      "Confira se todo o pedido foi atendido e se as caixas estão alocadas e conferidas.",
      "Mova para Enviados quando o pedido inteiro estiver concluído."
    ],
    "result": "A saída real fica registrada. Apenas baixar PDF ou Excel não altera a etapa do cartão."
  },
  "cleanup": {
    "scenario": "Foi criado um packing list por engano e o envio ainda não saiu.",
    "actions": [
      "Espere Salvo, localize o documento na lista e use Excluir.",
      "Leia a confirmação antes de continuar. Caixas e produtos permanecem no envio.",
      "Se precisar de novo documento, use Novo packing list e selecione o envio existente."
    ],
    "result": "Somente o documento escolhido é retirado. Arquivos já baixados no computador permanecem."
  },
  "recovery": {
    "scenario": "A tela mostra Sem confirmação na produção e Não salvo no topo.",
    "actions": [
      "Não interprete Sem confirmação como zero produzido. Consulte o horário e a origem em Detalhes.",
      "Mantenha a tela aberta e use Tentar novamente para o salvamento.",
      "Em conflito com outra sessão, preserve suas edições antes de recarregar a versão compartilhada."
    ],
    "result": "Você distingue falha de consulta de falta de produção e evita perder alterações não salvas."
  }
};
