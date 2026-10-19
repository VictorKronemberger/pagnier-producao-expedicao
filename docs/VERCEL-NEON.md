# Publicar o painel na Vercel com Neon

Este manual corresponde à versão Next.js + PostgreSQL do repositório privado `VictorKronemberger/pagnier-producao-expedicao`. O código contém pedidos, produção, expedição, packing list, invoice, login por funcionário e chat. Não use a pasta antiga `painel-producao-vercel/`: ela é uma adaptação anterior e está desatualizada.

Preparar o código e enviá-lo ao GitHub não cria serviços, não publica o site e não transfere dados. O banco local continua em `painel-producao/`. Depois desta migração, o checkout `pagnier-producao-expedicao/` é a origem da versão Vercel; melhorias futuras devem ser feitas nele. Os arquivos antigos de Cloudflare mantidos no repositório são referência legada e não são usados pelo build Next.js.

## 1. Requisitos

- Conta GitHub com acesso ao repositório privado de VictorKronemberger.
- Conta Vercel e um plano compatível com o uso pretendido.
- Conta Neon para um banco PostgreSQL.
- Node.js 24 e npm no computador usado para preparar o banco.
- Chave REST do Nomus para carregar/atualizar pedidos. Sem ela, o painel conserva os dados migrados, mas não atualiza o ERP.

## 2. Criar o banco Neon

1. No Neon, crie um projeto PostgreSQL e anote a região.
2. Abra **Connect**, escolha o banco/branch de produção e copie a connection string disponibilizada para a aplicação. Use a opção de conexão agrupada (pooled) quando oferecida.
3. No checkout do projeto, crie um arquivo `.env.local` com:

```dotenv
DATABASE_URL=cole_a_connection_string_do_Neon
NOMUS_API_KEY=cole_a_chave_fornecida_pelo_Nomus
```

Esses são placeholders: substitua localmente. Não envie `.env.local`, connection strings ou chaves por GitHub/chat. Não use prefixo `NEXT_PUBLIC_`. Não copie automaticamente segredos da instalação antiga; configure somente estas duas variáveis.

4. Na pasta do projeto, execute:

```powershell
npm ci
npm run db:migrate
```

O comando aplica `migrations/postgres/001_initial.sql` em uma transação e registra seu checksum em `schema_migrations`. Pode ser executado novamente sem apagar dados. As tabelas são criadas fora das requisições do site; o deploy não executa migrações automaticamente. Os arquivos `drizzle/*.sql` são da versão SQLite e **não devem ser executados no Neon**.

## 3. Transferir dados locais (para continuar o trabalho existente)

Sem transferência, o novo banco começa vazio. Consultar o Nomus pode reconstruir pedidos, mas não recria anotações, caixas, documentos, mensagens ou PINs feitos neste painel.

1. Combine uma pausa nas edições da equipe. Aguarde **Salvo** e feche o painel local para não perder alterações posteriores ao backup.
2. Localize o SQLite correto em `painel-producao/.wrangler/state/` (pasta de estado do D1). Não escolha apenas pelo tamanho: o arquivo deve conter `production_board` com os registros `main` e/ou `nomus`. Em caso de dúvida, confira antes de importar.
3. A partir do checkout Vercel, execute com o caminho real do banco:

```powershell
npm run db:export-local -- "C:\caminho\para\banco.sqlite"
```

O exportador abre a origem somente para leitura e usa uma transação consistente. Cria `backups/pagnier-<numero>.json`, mostra as contagens e nunca sobrescreve o SQLite. O backup contém dados privados e hashes dos PINs: mantenha-o protegido e fora do GitHub. A pasta `backups/` está ignorada pelo Git.

4. Valide o arquivo sem gravar nada:

```powershell
npm run db:import-local -- "backups/pagnier-<numero>.json"
```

5. Confira que `DATABASE_URL` aponta para o **destino novo** e que ninguém começou a usar esse banco. Importe:

```powershell
npm run db:import-local -- "backups/pagnier-<numero>.json" --apply
```

A importação exige tabelas de dados vazias, bloqueia gravações concorrentes durante a transação, confere as contagens e ajusta a sequência dos IDs das mensagens. Ela recusa sobrescrever um destino já utilizado. Transfere quadro, estado do Nomus, documentos/caixas dentro do quadro, funcionários, mensagens e leituras. Sessões não são transferidas: cada pessoa entra novamente com o PIN existente.

Se o destino já tiver dados, não apague tabelas para forçar a importação. Use um banco/branch novo ou planeje a conciliação. Mantenha a origem e o backup até concluir a conferência. Na retomada, escolha uma instalação para receber as edições; os bancos local e Neon não sincronizam entre si.

## 4. Importar o GitHub na Vercel

1. Abra **Add New → Project** e conecte o GitHub.
2. Dê à Vercel acesso ao repositório privado `VictorKronemberger/pagnier-producao-expedicao`.
3. Importe o repositório e escolha a branch `main`.
4. Confira:

| Campo | Valor |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `./` (raiz do repositório) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | padrão do Next.js; não usar `dist` |
| Node.js | 24.x |

5. Em **Environment Variables**, configure `DATABASE_URL` e `NOMUS_API_KEY` para **Production**. São as mesmas variáveis usadas localmente, mas os valores devem apontar para o banco de produção.
6. Publique quando o banco e as variáveis estiverem prontos. Se alterar variáveis depois, execute **Redeploy**.

O build não depende de credenciais e não consulta o banco. Um build aprovado sem `DATABASE_URL` não significa que login e salvamento já funcionam.

A integração GitHub da Vercel pode publicar automaticamente novos commits da branch de produção. Revise esse comportamento antes de conectar o repositório. O envio de código realizado nesta preparação não criou essa integração nem publicou o site.

## 5. Primeiro acesso

Abra a URL HTTPS entregue pela Vercel. Escolha seu nome e informe o PIN. Se os funcionários vieram da importação, use os PINs existentes; se o banco começou vazio, use **Primeiro acesso? Criar meu PIN**.

Por opção do usuário, a versão Vercel usa somente nome e PIN, sem autenticação ChatGPT. A tela de login e o cadastro inicial ficam acessíveis a quem conhece a URL; nomes ainda não cadastrados podem ter o primeiro PIN criado por essa pessoa. Antes de distribuir o endereço, cadastre os funcionários com a equipe ou importe as contas existentes. Todas as contas têm acesso compartilhado ao painel e às conversas; não há mensagens privadas ou permissões por cargo.

Pedidos, clientes documentais, alterações e mensagens exigem sessão válida no servidor. Cookies são HttpOnly e Secure em HTTPS, com bloqueio temporário após PINs incorretos e validação de origem nas alterações. Não precisa configurar `DASHBOARD_USER` ou `DASHBOARD_PASSWORD` da adaptação antiga.

## 6. Conferência antes de liberar a operação

- Abrir sem login: somente a entrada aparece; APIs de dados recusam o acesso.
- Entrar, editar um pedido, aguardar **Salvo**, recarregar e confirmar a persistência.
- Abrir outro navegador: os dados salvos devem coincidir. Conferir que conflitos de edição não sobrescrevem dados silenciosamente.
- Enviar uma mensagem mencionando outro funcionário e conferir o sinal de não lida na outra sessão.
- Conferir caixas, lotes, documentação pronta e gerar PDF/Excel de packing list e invoice.
- Verificar a data e cobertura das consultas do Nomus. A sincronização é paginada e pode levar tempo.
- Usar **Sair** e confirmar que os dados voltam a exigir login.

A integração com o Nomus continua somente leitura. Consultas são disparadas enquanto o painel está aberto; não foi criado cron nem sincronização contínua com todas as abas fechadas. A reserva compartilhada no banco evita multiplicar as consultas ao ERP entre funcionários.

## 7. Preview, consumo e manutenção

Use banco/branch separado para **Preview**. Não atribua o banco operacional a previews que possam executar testes ou edições. O ambiente de teste automatizado usa apenas dados fictícios e PostgreSQL em memória.

Acompanhe requisições/CPU na Vercel e armazenamento/consumo no Neon. Os planos gratuitos têm limites; o Hobby da Vercel é para uso pessoal não comercial. Mantenha backup antes de atualizações e avalie os recursos de restauração do plano Neon escolhido. O exportador desta entrega é para a origem SQLite; não substitui backups regulares do PostgreSQL.

## 8. Diagnóstico

| Sintoma | Verificação |
| --- | --- |
| Build tenta usar Vinext/Cloudflare | Branch ou configuração antiga. Confirme o `package.json` atualizado e `npm run build`. |
| Banco informa limite de uso / Neon HTTP 402 | Verifique a cota bloqueada no console Neon. A conta/projeto precisa voltar a aceitar conexões; trocar o PIN ou fazer redeploy não libera a cota. O login continua protegido e o botão Tentar novamente verifica a recuperação. |
| Login informa indisponibilidade | Confira `DATABASE_URL`, conectividade do Neon e execução de `npm run db:migrate`. |
| Quadro vazio | Banco novo sem importação; confira a chave Nomus e aguarde a coleta paginada. |
| PIN não funciona após migrar | Confira se `chat_employees` foi importada. Sessões antigas não funcionam na nova instalação. |
| Importação recusada | Confira checksum e tabelas vazias no destino. Não force sobrescrita. |
| Variável alterada sem efeito | Faça novo deploy no ambiente correto. |

## Referências

- [Importar GitHub na Vercel](https://vercel.com/docs/git/vercel-for-github)
- [Variáveis na Vercel](https://vercel.com/docs/environment-variables)
- [Driver PostgreSQL do Neon](https://neon.com/docs/serverless/serverless-driver)
- [Limites de funções da Vercel](https://vercel.com/docs/functions/configuring-functions/duration)
