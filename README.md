# Pagnier — produção e expedição

Código do sistema de produção e expedição, salvo para VictorKronemberger em 15/10/2026.

Inclui pedidos, ordens de produção, caixas menores, Montar Caixa 40, Caixas 40 montadas, conferência física, lote e validade consultados no Nomus, packing list, invoices em PDF/Excel e Manual de boas práticas revisão 06, conferência com busca e filtros de envio FedEx/DHL.

## Estado desta cópia

Esta é a versão atual do painel local, baseada em React, Vinext e Cloudflare D1. O envio ao GitHub salva o código; não publica o site e não migra o banco. A adaptação atualizada para Vercel + Neon será uma etapa separada. Não importe esta versão diretamente como projeto Next.js convencional no Vercel.

Credenciais, arquivos de execução e banco local ficam fora do repositório. A base inicial de pedidos foi substituída por uma estrutura vazia. Os dados operacionais continuam no computador de origem. Ao conectar o Nomus, o sistema consulta pedidos por etapas; anotações, caixas e documentos existentes precisam de migração do banco para aparecer em outra instalação.

## Executar localmente

1. Instale Node.js 22.13 ou superior.
2. Execute `npm ci`.
3. Defina `NOMUS_API_KEY` no ambiente do processo, usando a chave fornecida pelo Nomus.
4. Execute `npm run dev` e acesse `http://127.0.0.1:5173`.

O ambiente local possui autenticação de desenvolvimento. Não o exponha diretamente na internet. A publicação precisa de acesso privado e banco configurados.

## Validação

- `npm run build`
- `node scripts/check-ready-boxes.mjs`
- `node scripts/check-product-lots.mjs`
- `node scripts/check-assembly-flow.mjs`
- `node scripts/check-sync.mjs`

As verificações de navegador usam Edge e dados simulados. Consulte [operação e testes](docs/OPERACAO-E-TESTES.md) para detalhes das funções.

## Hospedagem planejada

Neon PostgreSQL tem plano gratuito e integração com Vercel. O plano Hobby do Vercel é para uso pessoal não comercial; uso empresarial exige um plano compatível. Nenhuma hospedagem ou assinatura é criada pelo envio deste código ao GitHub.

- https://neon.com/pricing
- https://vercel.com/docs/plans/hobby

A integração do painel com o Nomus é somente leitura. Alterações de prioridade, caixas, documentos e rastreio são gravadas no banco do painel.
