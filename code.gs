/**
 * Brava Moto - Sistema SAE de Gestão de Comissões
 * Padrão SAE (Sistema Apollo Enterprise)
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEETS = {
  VENDAS: 'db_vendas',
  CONFIGURACOES: 'db_configuracoes'
};

const VENDAS_HEADERS = [
  'uuid', 'data', 'nome', 'cpf', 'proposta',
  'categoria', 'valorBem', 'valorParcela', 'cota',
  'lanceValor', 'contemplacaoGarantida', 'dataNascimento',
  'brinde', 'descontoPrimeiraParcela',
  'p1_pago', 'p1_percent', 'p3_pago', 'p3_percent', 'deleted_at'
];

const CONFIG_HEADERS = ['chave', 'valor', 'updated_at'];

/**
 * Configuração inicial do Banco de Dados
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEETS.VENDAS, VENDAS_HEADERS);
  ensureSheet_(ss, SHEETS.CONFIGURACOES, CONFIG_HEADERS);
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Brava Moto - Comissões SAE')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * CRUD e Operações de Dados
 */
function getData() {
  setup();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.VENDAS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const deletedIndex = headers.indexOf('deleted_at');

  return data
    .filter(row => deletedIndex === -1 || !row[deletedIndex])
    .map(rowToObject_(headers));
}

function saveVenda(venda) {
  setup();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.VENDAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const payload = normalizeVenda_(venda || {});
  if (!payload.uuid) {
    payload.uuid = Utilities.getUuid();
    payload.data = new Date().toISOString();
    const newRow = headers.map(header => Object.prototype.hasOwnProperty.call(payload, header) ? payload[header] : defaultValue_(header));
    sheet.appendRow(newRow);
  } else {
    const rowIndex = data.findIndex(row => row[0] === payload.uuid) + 1;
    if (rowIndex > 0) {
      headers.forEach((header, index) => {
        if (Object.prototype.hasOwnProperty.call(payload, header)) {
          sheet.getRange(rowIndex, index + 1).setValue(payload[header]);
        }
      });
    }
  }
  return { success: true };
}

function softDelete(uuid) {
  setup();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.VENDAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const uuidIndex = headers.indexOf('uuid');
  const deletedIndex = headers.indexOf('deleted_at');
  const rowIndex = data.findIndex(row => row[uuidIndex] === uuid) + 1;
  if (rowIndex > 0 && deletedIndex > -1) {
    sheet.getRange(rowIndex, deletedIndex + 1).setValue(new Date().toISOString());
  }
  return { success: true };
}

function getConfiguracoes() {
  setup();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.CONFIGURACOES);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const config = {};

  data.forEach(row => {
    const item = rowToObject_(headers)(row);
    if (item.chave) config[item.chave] = item.valor;
  });

  return {
    vendedorNome: config.vendedorNome || ''
  };
}

function saveConfiguracoes(configuracoes) {
  setup();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.CONFIGURACOES);
  upsertConfig_(sheet, 'vendedorNome', String((configuracoes && configuracoes.vendedorNome) || '').trim());
  return { success: true };
}

function ensureSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(Boolean);
  if (!currentHeaders.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  const missingHeaders = headers.filter(header => currentHeaders.indexOf(header) === -1);
  if (missingHeaders.length) {
    sheet.getRange(1, currentHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]).setFontWeight('bold');
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function rowToObject_(headers) {
  return row => {
    const obj = {};
    headers.forEach((header, index) => obj[header] = row[index]);
    return obj;
  };
}

function normalizeVenda_(venda) {
  const payload = { ...venda };
  ['valorBem', 'valorParcela', 'cota', 'lanceValor', 'descontoPrimeiraParcela', 'p1_percent', 'p3_percent'].forEach(field => {
    if (payload[field] !== undefined && payload[field] !== '') payload[field] = Number(payload[field]);
  });
  ['p1_pago', 'p3_pago', 'contemplacaoGarantida'].forEach(field => {
    if (payload[field] !== undefined) payload[field] = payload[field] === true || payload[field] === 'true';
  });
  return payload;
}

function defaultValue_(header) {
  if (header === 'p1_pago' || header === 'p3_pago' || header === 'contemplacaoGarantida') return false;
  if (['valorBem', 'valorParcela', 'cota', 'lanceValor', 'descontoPrimeiraParcela', 'p1_percent', 'p3_percent'].indexOf(header) > -1) return 0;
  return '';
}

function upsertConfig_(sheet, chave, valor) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const chaveIndex = headers.indexOf('chave');
  const valorIndex = headers.indexOf('valor');
  const updatedIndex = headers.indexOf('updated_at');
  const rowIndex = data.findIndex(row => row[chaveIndex] === chave) + 1;
  const updatedAt = new Date().toISOString();

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, valorIndex + 1).setValue(valor);
    sheet.getRange(rowIndex, updatedIndex + 1).setValue(updatedAt);
  } else {
    sheet.appendRow([chave, valor, updatedAt]);
  }
}
