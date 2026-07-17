/**
 * Cybersecurity Teaser — WhatsApp lead collector
 *
 * DEPLOY:
 *  1. Create a Google Sheet. In it: Extensions > Apps Script.
 *  2. Paste this whole file. Save.
 *  3. Deploy > New deployment > type: Web app.
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  4. Copy the /exec Web App URL and paste it into index.html (WA_ENDPOINT).
 *  5. If you later edit this script, use Deploy > Manage deployments > Edit
 *     to push a new version (or the URL keeps serving the old code).
 */

var SHEET_NAME = 'Leads';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // avoid two writes clobbering each other
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      // Sent as text/plain to avoid a CORS preflight from the browser.
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else {
      data = (e && e.parameter) || {};
    }

    var phone = String(data.phone || '').trim();
    if (!phone) return json_({ ok: false, error: 'missing phone' });

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),                          // Timestamp
      phone,                               // WhatsApp number (raw)
      String(data.digits || ''),           // Digits only
      String(data.source || 'teaser'),     // Source label
      String(data.userAgent || '')         // Browser UA (optional)
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, status: 'alive' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'WhatsApp', 'Digits', 'Source', 'User Agent']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
