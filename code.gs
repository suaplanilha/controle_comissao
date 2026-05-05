/**
 * Brava Moto - Sistema SAE de Gestão de Comissões
 * Padrão SAE (Sistema Apollo Enterprise)
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEETS = {
  VENDAS: 'db_vendas'
};

/**
 * Configuração inicial do Banco de Dados
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName(SHEETS.VENDAS)) {
    const sheet = ss.insertSheet(SHEETS.VENDAS);
    const headers = [
      'uuid', 'data', 'nome', 'cpf', 'proposta', 
      'categoria', 'valorBem', 'valorParcela', 
      'cota', 'p1_pago', 'p1_percent', 
      'p3_pago', 'p3_percent', 'deleted_at'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.VENDAS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data
    .filter(row => !row[13]) // Filtro softdelete
    .map(row => {
      let obj = {};
      headers.forEach((header, i) => obj[header] = row[i]);
      return obj;
    });
}

function saveVenda(venda) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.VENDAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  if (!venda.uuid) {
    venda.uuid = Utilities.getUuid();
    venda.data = new Date().toISOString();
    const newRow = headers.map(h => venda[h] || (h.includes('pago') ? false : ''));
    sheet.appendRow(newRow);
  } else {
    const rowIndex = data.findIndex(r => r[0] === venda.uuid) + 1;
    if (rowIndex > 0) {
      headers.forEach((h, i) => {
        if (venda[h] !== undefined) {
          sheet.getRange(rowIndex, i + 1).setValue(venda[h]);
        }
      });
    }
  }
  return { success: true };
}

function softDelete(uuid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.VENDAS);
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(r => r[0] === uuid) + 1;
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 14).setValue(new Date().toISOString());
  }
  return { success: true };
}
