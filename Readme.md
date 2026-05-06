Documentação Técnica - Brava Moto Comissões SAE

1. Visão Geral

O Brava Moto Comissões SAE é um sistema de gestão de comissões para consultores de consórcios/veículos. O sistema permite o cadastro de clientes e o gerenciamento financeiro de comissões baseado no pagamento da 1ª e 3ª parcelas.

2. Arquitetura do Sistema

O sistema segue o padrão SAE (Sistema Apollo Enterprise):

Frontend: Single-page Application (SPA) em arquivo único, utilizando Vue.js 3 (via CDN) e Tailwind CSS.

Backend: Google Apps Script (GAS) atuando como servidor de API e controlador.

Banco de Dados: Google Sheets (Planilha Google) com persistência em tempo real. Cada aba representa uma entidade SAE com UUID/datas ISO e números normalizados.

3. Estrutura de Dados (Google Sheets)

A entidade principal é armazenada na aba db_vendas com as seguintes colunas. A função setup() também migra cabeçalhos ausentes quando o app evolui:

Coluna

Descrição

Tipo

uuid

Identificador único universal

String (GUID)

data

Data de criação do registro

ISO String

nome

Nome completo do cliente

String

cpf

Documento de identificação

String

proposta

Número da proposta de venda

String

categoria

Tipo de veículo (Carro ou Moto)

String

valorBem

Valor total do bem comercializado

Number

valorParcela

Valor da parcela mensal

Number

cota

Número da cota/contrato

Number

lanceValor

Valor em reais do lance informado na venda

Number

contemplacaoGarantida

Indicador informativo de garantia de contemplação

Boolean

dataNascimento

Data de nascimento do cliente, usada para exibir idade calculada no frontend

ISO Date/String

brinde

Brinde selecionado na venda: Brinde Aleatório ou Capacete

String

descontoPrimeiraParcela

Percentual informativo de desconto na primeira parcela, sem impacto no cálculo

Number (%)

p1_pago

Status de pagamento da 1ª parcela

Boolean

p1_percent

Percentual de comissão sobre a P1

Number (%)

p3_pago

Status de pagamento da 3ª parcela

Boolean

p3_percent

Percentual de comissão sobre a P3

Number (%)

deleted_at

Timestamp para exclusão lógica (Soft Delete)

ISO String

A entidade de configurações é armazenada na aba db_configuracoes:

chave

Identificador da configuração, por exemplo vendedorNome

String

valor

Valor salvo pelo usuário

String

updated_at

Última atualização da configuração

ISO String

4. Regras de Negócio e Lógica de Cálculo

A comissão do vendedor não é fixa; ela é inserida manualmente pelo gestor conforme as regras variáveis de cotas e parcelas.

Algoritmo de Cálculo:

A comissão só é contabilizada se o status da parcela for definido como Pago (true) e houver um Percentual inserido.

Cálculo Individual: (Percentual / 100) * Valor do Bem

Cálculo Total por Cliente: Comissão P1 (se paga) + Comissão P3 (se paga)

Dashboard:

Comissões do Período: Soma das comissões conforme filtro de data início/data fim definido pelo usuário.

Acumulado Ano: Soma de todas as comissões do ano vigente, sem ser afetada pelo filtro de período.

Vendas Ativas do Período: Quantidade de vendas dentro do filtro aplicado.

Valor Total de Vendas: Soma de valorBem dentro do filtro aplicado.

5. Interface e Experiência do Usuário (UI/UX)

Seguindo o padrão Glassmorphism Dark:

Identidade visual: Logo externo da empresa Brava Moto aplicado no header, sidebar/drawer e área inicial do dashboard.

Inputs & Selects: Fundo glass com bordas sutis (rgba(255, 255, 255, 0.12)) e área mínima de toque para mobile.

Feedback Visual: Uso de estados loading durante chamadas ao google.script.run e handler de erro para falhas de backend.

Navegação: Sidebar persistente no desktop, drawer acionável por botão hambúrguer em mobile/tablet e bottom navigation fixa para acesso rápido a Dashboard, Vendas, Financeiro e Configurações.

Responsividade: Layout mobile-first com cards no dashboard, tabelas convertidas em cartões no celular e modais adaptados para telas verticais.

Configurações: Tela para salvar o nome do vendedor/usuário logado em db_configuracoes e personalizar header, sidebar e relatórios.

Relatórios: Fluxo financeiro com filtros por período, pré-visualização A4 executiva e geração de PDF via impressão do navegador.

Paginação: Limite de 20 registros por página na visualização de vendas.

Rodapé/assinatura: @2026 - Sistema Apollo Eficiente - SAE - Leo.

6. Funções Principais do Backend (Código.gs)

setup(): Inicializa db_vendas e db_configuracoes, adiciona cabeçalhos ausentes para evolução incremental do schema e normaliza a coluna dataNascimento como texto yyyy-MM-dd.

getData(): Recupera todos os registros ativos (deleted_at nulo).

saveVenda(obj): Função dual que normaliza números/booleans, padroniza dataNascimento como yyyy-MM-dd e insere novos registros (com UUID) ou atualiza registros existentes.

softDelete(uuid): Marca um registro com timestamp em deleted_at para removê-lo da visão do usuário sem apagar os dados fisicamente.

getConfiguracoes(): Retorna as configurações do perfil do usuário/vendedor.

saveConfiguracoes(obj): Salva ou atualiza o nome do vendedor em db_configuracoes.

7. Instruções de Instalação

Criar uma nova Planilha Google.

Acessar Extensões > Apps Script.

Inserir o conteúdo de Código.gs e index.html.

Executar a função setup() no editor.

Implantar como "App da Web" com acesso para "Qualquer pessoa".

Desenvolvido sob o padrão SAE Enterprise.
