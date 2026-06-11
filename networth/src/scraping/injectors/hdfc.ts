export function buildCredentialInjector(creds: Record<string, string>): string {
  const username = (creds.username ?? '').replace(/'/g, "\\'");
  const password = (creds.password ?? '').replace(/'/g, "\\'");
  return `
(function() {
  function setNativeValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function fill() {
    var custInput = document.getElementById('fldLoginUserId') || document.querySelector('input[name="fldLoginUserId"]');
    if (!custInput) { setTimeout(fill, 600); return; }
    setNativeValue(custInput, '${username}');
    var btn = document.querySelector('a.login-btn, input[value*="Continue"]');
    if (btn) btn.click();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PHASE_CHANGE', phase: 'awaiting_otp' }));
  }
  fill();
})();
true;
`;
}

export function buildDataExtractor(): string {
  return `
(function() {
  try {
    var balEls = Array.from(document.querySelectorAll('.current-balance, .account-balance, [class*="balance"]'));
    var total = 0;
    balEls.forEach(function(el) {
      var v = parseFloat(el.innerText.replace(/[^0-9.]/g, ''));
      if (!isNaN(v)) total += v;
    });
    if (total === 0) {
      var rows = Array.from(document.querySelectorAll('td'));
      for (var i = 0; i < rows.length; i++) {
        if (/balance|available/i.test(rows[i].innerText) && rows[i + 1]) {
          var v = parseFloat(rows[i + 1].innerText.replace(/[^0-9.]/g, ''));
          if (!isNaN(v)) { total += v; break; }
        }
      }
    }
    if (total === 0) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Balance not found' }));
      return;
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'DATA_EXTRACTED',
      payload: { valueInr: total, raw: { total } }
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
  }
})();
true;
`;
}

export function detectLoginSuccess(url: string): boolean {
  return url.includes('netbanking.hdfcbank.com') && url.includes('postlogin');
}
