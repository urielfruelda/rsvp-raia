function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("RSVP");
    if (!sheet) {
      sheet = ss.insertSheet("RSVP");
      sheet.appendRow([
        "timestamp",
        "guestName",
        "attending",
        "adults",
        "kids",
        "contact",
        "message",
      ]);
    }

    sheet.appendRow([
      body.timestamp || new Date().toISOString(),
      body.guestName || "",
      body.attending || "",
      body.adults || "",
      body.kids || "",
      body.contact || "",
      body.message || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

