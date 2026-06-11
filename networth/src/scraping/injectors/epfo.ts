export function buildCredentialInjector(creds: Record<string, string>): string {
  const uan = (creds.uan ?? '').replace(/'/g, "\\'");
  const password = (creds.password ?? '').replace(/'/g, "\\'");
  return `
(function() {
  function setNativeValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function fill() {
    var uanInput = document.getElementById('uan') || document.querySelector('input[name="uan"], input[placeholder*="UAN"]');
    var pwInput = document.getElementById('pass') || document.querySelector('input[type="password"]');
    if (!uanInput || !pwInput) { setTimeout(fill, 500); return; }
    setNativeValue(uanInput, '${uan}');
    setNativeValue(pwInput, '${password}');
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
    var rows = Array.from(document.querySelectorAll('tr, .pf-balance, [class*="balance"]'));
    var totalText = '';
    for (var i = 0; i < rows.length; i++) {
      var text = rows[i].innerText || '';
      if (/total|balance|net.*pf|pf.*balance/i.test(text)) {
        var match = text.match(/[0-9,]+(?:\\.[0-9]+)?/);
        if (match) { totalText = match[0]; break; }
      }
    }
    if (!totalText) {
      var pfEl = document.getElementById('pfAmt') || document.querySelector('.pfAmt, .total-pf');
      if (pfEl) totalText = pfEl.innerText;
    }
    if (!totalText) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Could not find PF balance' }));
      return;
    }
    var value = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    if (isNaN(value)) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Parse failed' }));
      return;
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'DATA_EXTRACTED',
      payload: { valueInr: value, raw: { text: totalText } }
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
  }
})();
true;
`;
}

export function detectLoginSuccess(url: string): boolean {
  return url.includes('unifiedmember.epfindia.gov.in') &&
    (url.includes('/memberinterface/') || url.includes('passbook') || url.includes('dashboard'));
}
