# Google Sheets Contact and Basket Inquiry Form

1. Create a Google Sheet (the script will create the `Contacts`, `Reviews`, and `Inquiries` tabs when needed).
2. In Google Sheets, open **Extensions > Apps Script** and replace the project code with the script below.
3. Change `NOTIFY_EMAIL` to the inbox that should receive notifications.
4. Deploy as **Web app**: execute as **Me**, access **Anyone**.
5. Copy the `/exec` URL into `GOOGLE_APPS_SCRIPT_URL` in Cloudflare Pages/Workers environment variables. This single deployment handles Contact, Review, and Basket Inquiry requests.

Basket enquiries are written as one row in `Inquiries`. The full product list is stored in the `Items` column, and WhatsApp/email only send a short inquiry ID. This avoids URL and message-length limits when a customer selects many products.

```javascript
const NOTIFY_EMAIL = 'info@maesvanti.online';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.source === 'basket-inquiry') return saveBasketInquiry(data);

    const isReview = data.source === 'review';
    const sheet = getSheet(isReview ? 'Reviews' : 'Contacts');
    ensureHeader(sheet, isReview
      ? ['Submitted at', 'Name', 'Email', 'Product', 'Rating', 'Title', 'Review', 'Variants', 'Status']
      : ['Submitted at', 'Name', 'Email', 'WhatsApp', 'Product', 'Message', 'Source']);

    const submittedAt = data.submittedAt || new Date().toISOString();
    if (isReview) {
      sheet.appendRow([submittedAt, data.name || '', data.email || '', data.product || '', data.rating || '', data.title || '', data.message || '', data.variants || '', 'Pending']);
    } else {
      sheet.appendRow([submittedAt, data.name || '', data.email || '', data.whatsapp || '', data.product || '', data.message || '', data.source || 'website']);
    }

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'New gallery contact from ' + (data.name || 'website visitor'),
      htmlBody: '<p><b>Name:</b> ' + escapeHtml(data.name) + '</p>' +
        '<p><b>Email:</b> ' + escapeHtml(data.email) + '</p>' +
        '<p><b>WhatsApp:</b> ' + escapeHtml(data.whatsapp) + '</p>' +
        '<p><b>Product:</b> ' + escapeHtml(data.product) + '</p>' +
        '<p><b>Message:</b><br>' + escapeHtml(data.message).replace(/\n/g, '<br>') + '</p>'
    });
    return response({ ok: true });
  } catch (error) {
    return response({ ok: false, error: String(error) });
  }
}

function saveBasketInquiry(data) {
  const sheet = getSheet('Inquiries');
  ensureHeader(sheet, ['Submitted at', 'Inquiry ID', 'Country', 'Item count', 'Items', 'Status']);

  const items = Array.isArray(data.items) ? data.items : [];
  const itemLines = items.map(function(item, index) {
    const reference = item.sku ? 'SKU: ' + item.sku : item.title || 'Product';
    return (index + 1) + '. ' + reference +
      (item.variants ? ' | ' + item.variants : '') +
      ' × ' + (item.quantity || 1) +
      (item.url ? '\n   ' + item.url : '');
  }).join('\n\n');

  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.inquiryId || '',
    data.country || '',
    items.length,
    itemLines,
    'New'
  ]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'New basket inquiry ' + (data.inquiryId || ''),
    htmlBody: '<p><b>Inquiry ID:</b> ' + escapeHtml(data.inquiryId) + '</p>' +
      '<p><b>Country:</b> ' + escapeHtml(data.country) + '</p>' +
      '<p><b>Items:</b> ' + items.length + '</p>' +
      '<pre style="white-space:pre-wrap">' + escapeHtml(itemLines) + '</pre>'
  });

  return response({ ok: true });
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet(name);
}

function ensureHeader(sheet, header) {
  if (sheet.getLastRow() === 0) sheet.appendRow(header);
}

function response(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(character) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
  });
}
```
