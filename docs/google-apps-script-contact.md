# Google Sheets Contact Form

1. Create a Google Sheet with a tab named `Contacts`.
2. In Google Sheets, open **Extensions > Apps Script** and paste the script below.
3. Change `NOTIFY_EMAIL` to the inbox that should receive notifications.
4. Deploy as **Web app**: execute as **Me**, access **Anyone**.
5. Copy the `/exec` URL into `GOOGLE_APPS_SCRIPT_URL` in Cloudflare Pages/Workers environment variables.

```javascript
const SHEET_NAME = 'Contacts';
const NOTIFY_EMAIL = 'info@maesvanti.online';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Submitted at', 'Name', 'Email', 'WhatsApp', 'Product', 'Message', 'Source']);
    }
    const submittedAt = data.submittedAt || new Date().toISOString();
    sheet.appendRow([submittedAt, data.name || '', data.email || '', data.whatsapp || '', data.product || '', data.message || '', data.source || 'website']);
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New gallery contact from ' + (data.name || 'website visitor'),
      htmlBody: '<p><b>Name:</b> ' + escapeHtml(data.name) + '</p>' +
        '<p><b>Email:</b> ' + escapeHtml(data.email) + '</p>' +
        '<p><b>WhatsApp:</b> ' + escapeHtml(data.whatsapp) + '</p>' +
        '<p><b>Product:</b> ' + escapeHtml(data.product) + '</p>' +
        '<p><b>Message:</b><br>' + escapeHtml(data.message).replace(/\n/g, '<br>') + '</p>'
    });
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>\"']/g, function (character) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' })[character];
  });
}
```
