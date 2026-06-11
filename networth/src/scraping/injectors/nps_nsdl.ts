export function buildCredentialInjector(creds: Record<string, string>): string {
  const pran = (creds.pran ?? '').replace(/'/g, "\\'");
  const password = (creds.password ?? '').replace(/'/g, "\\'");
  return `
(function() {
  function setNativeValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function fill() {
    var pranInput = document.querySelector('input[name="PRAN"], input[id*="pran"], input[placeholder*="PRAN"]');
    var pwInput = document.querySelector('input[type="password"]');
    if (!pranInput || !pwInput) { setTimeout(fill, 600); return; }
    setNativeValue(pranInput, '${pran}');
    setNativeValue(pwInput, '${password}');
    var btn = document.querySelector('input[type="submit"], button[type="submit"]');
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
    var rows = Array.from(document.querySelectorAll('td, th'));
    var totalIdx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (/total.*corpus|net.*corpus|total.*value/i.test(rows[i].innerText)) {
        totalIdx = i; break;
      }
    }
    var valueText = '';
    if (totalIdx >= 0 && rows[totalIdx + 1]) {
      valueText = rows[totalIdx + 1].innerText;
    }
    if (!valueText) {
      var el = document.querySelector('.totalCorpusValue, [class*="corpus"]');
      if (el) valueText = el.innerText;
    }
    if (!valueText) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Could not find NPS corpus value' }));
      return;
    }
    var value = parseFloat(valueText.replace(/[^0-9.]/g, ''));
    if (isNaN(value)) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Parse failed' }));
      return;
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'DATA_EXTRACTED',
      payload: { valueInr: value, raw: { text: valueText } }
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
  }
})();
true;
`;
}

export function detectLoginSuccess(url: string): boolean {
  return url.includes('cra-nsdl.com') && !url.includes('/CRA/login') && !url.includes('/CRA/index');
}
