# Migrar de Neon para Turso preservando os dados

O painel suporta Turso **libSQL/SQLite** por `@libsql/client/web`, sem réplica local ou arquivos de banco na Vercel. A seleção é explícita: `DATABASE_PROVIDER=turso`. Sem essa variável, continua usando Neon; uma falha do Turso nunca faz o aplicativo gravar no Neon como alternativa.

A migração foi preparada e testada com dados fictícios. Criar o banco, configurar credenciais, exportar os dados reais e realizar a troca são etapas separadas. O banco atual não é apagado. O diretório `painel-producao/` continua sendo a instalação D1 legada e não deve receber os arquivos de conexão da Vercel.

## 1. Preparar o destino

Crie um banco Turso do tipo **libSQL** e um token com permissão de leitura/escrita. Mantenha o destino sem uso até concluir a importação. O SDK e o esquema desta versão foram validados para libSQL; um banco do novo motor Turso exige avaliação específica.

Configure em `.env.local` do checkout `pagnier-producao-expedicao/`:

```dotenv
DATABASE_PROVIDER=neon
DATABASE_URL=conexao_atual_do_neon
TURSO_DATABASE_URL=libsql://endereco_entregue_pelo_turso
TURSO_AUTH_TOKEN=token_do_banco
NOMUS_API_KEY=chave_existente_do_nomus
```

Use os valores reais somente no ambiente privado. Não use `NEXT_PUBLIC_` para nenhuma credencial. O token do Turso não substitui a chave do Nomus. Não altere `DATABASE_PROVIDER` antes de transferir e verificar os dados.

```powershell
npm ci
npm run db:migrate:turso
```

A migração cria tabelas e índices em uma transação, registra checksum e pode ser repetida. Não transfere registros nem ocorre automaticamente em requisições ou no build.

## 2. Exportar o Neon atual

Pare as edições da equipe e aguarde o indicador **Salvo**. Mantenha a operação pausada da exportação até a troca de ambiente: os dois bancos não sincronizam entre si.

```powershell
npm run db:export-neon
```

A exportação usa uma transação somente leitura com snapshot consistente e grava `backups/neon-<numero>.json`. Preserva quadro, pedidos capturados, anotações, documentos/caixas, hashes/salts dos PINs, mensagens e marcadores de leitura. Sessões são descartadas na migração: cada pessoa entra novamente com o PIN existente.

Se o Neon recusar conexões por cota excedida, a exportação para sem criar um backup incompleto. Será necessário restabelecer a leitura no Neon ou obter um backup atual verificável. Não use silenciosamente o SQLite local antigo: ele pode não conter as alterações feitas na Vercel. Não apague o Neon ou as credenciais da origem antes de validar a transferência.

O backup contém dados privados e hashes dos PINs, está ignorado pelo Git e deve ficar protegido. Ele não é o `lib/production-snapshot.json` público do código, que permanece vazio.

## 3. Importar e conferir

Primeiro valide o arquivo, sem tocar no destino:

```powershell
npm run db:import-turso -- "backups/neon-<numero>.json"
```

Depois importe:

```powershell
npm run db:import-turso -- "backups/neon-<numero>.json" --apply
```

O importador confere o checksum, tipos e tabelas; exige todas as tabelas operacionais vazias; preserva IDs; valida contagens; executa a importação em um único batch transacional. Qualquer erro de SQL reverte a importação. Não divide a transferência em commits parciais. Caso o backup exceda limites de requisição do serviço, o processo falha e deve ser planejado para esse volume, sem reduzir a proteção automaticamente.

Se a conexão cair após o envio, o resultado pode ter sido confirmado no servidor: confira as contagens antes de repetir. Repetições em um destino preenchido são recusadas. Nunca apague dados do destino para forçar uma nova importação.

## 4. Trocar a conexão da aplicação

Somente após importar e verificar:

1. Altere `DATABASE_PROVIDER=turso` em `.env.local` e teste o painel local com `npm run dev`.
2. Configure `DATABASE_PROVIDER=turso`, `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no ambiente **Production** do projeto Vercel. Mantenha `NOMUS_API_KEY`.
3. Realize o deploy quando a troca estiver autorizada. Enviar código ao GitHub não é confirmação de migração ou de publicação.
4. Confira login com PIN existente, mensagens, pedidos, caixas e documentos. Faça uma alteração controlada e confirme a persistência após recarregar antes de retomar o trabalho da equipe.

Não use o banco de produção para previews ou testes automatizados. Se houver necessidade de voltar ao Neon após novas gravações no Turso, é preciso conciliar os dados; simplesmente trocar a variável perderia a visibilidade dessas novas alterações.

## Otimizações incluídas

- Cliente HTTP reutilizado por instância do servidor; nenhuma conexão por componente ou réplica em disco.
- Consultas com parâmetros vinculados, batches atômicos e controle de revisão para impedir que gravações concorrentes sobrescrevam trabalho.
- Índices por sessão, expiração, autor/identificador de envio e canal/ID das mensagens. Paginação do histórico usa diretamente o índice de canal e ID.
- Leitura do estado Nomus verifica a revisão no banco em toda chamada. Quando ela não muda, o SQL omite o payload e reutiliza somente uma cópia limitada em memória. Mudanças de revisão invalidam a cópia imediatamente. Autenticação nunca é servida desse cache.
- O navegador envia a revisão conhecida do Nomus; respostas sem mudanças omitem snapshot e histórico de alterações. A atualização após uma captura continua completa.
- Resumos do chat verificam o último ID e os marcadores de leitura antes de repetir a agregação de todo o histórico. Mensagens e leituras novas invalidam o resultado; o recorte de pedidos é aplicado novamente em cada resposta.
- Consultas automáticas já param com a aba oculta. Falhas de rede/servidor passam a espaçar tentativas até cinco minutos; ações manuais continuam disponíveis. O chat evita consultas simultâneas iguais.
- A reserva compartilhada do Nomus continua impedindo que cada funcionário dispare a mesma captura, e o salvamento mantém o agrupamento de edições existente.

Os ganhos medidos nos testes são de tráfego e trabalho repetido; não garantem consumo zero nem permanência nos limites gratuitos. Instâncias novas da Vercel precisam recarregar o cache. Monitore leituras, gravações, armazenamento e transferência após a troca.

## Validação sem dados reais

```powershell
npm run test:turso
npm run test:api:turso
npm run test:postgres
node scripts/check-vercel-api.mjs
npm run build
npm run check
```

Os testes usam libSQL e PostgreSQL em memória. Cobrem transferência entre os motores, PINs, lockout, sessões, chat, índices, rollback, destino ocupado, concorrência, autenticação e captura Nomus simulada. Os testes de navegador exigem Edge e APIs interceptadas, conforme `docs/OPERACAO-E-TESTES.md`.

Referências: [SDK libSQL/Turso](https://docs.turso.tech/sdk/ts/reference), [configuração TypeScript](https://docs.turso.tech/sdk/ts/quickstart).
