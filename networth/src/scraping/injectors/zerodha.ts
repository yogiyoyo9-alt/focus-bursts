export function buildCredentialInjector(creds: Record<string, string>): string {
  const userId = (creds.userId ?? '').replace(/'/g, "\\'");
  const password = (creds.password ?? '').replace(/'/g, "\\'");
  return `
(function() {
  function setNativeValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function fillAndSubmit() {
    var userInput = document.getElementById('userid');
    var pwInput = document.getElementById('password');
    if (!userInput || !pwInput) { setTimeout(fillAndSubmit, 500); return; }
    setNativeValue(userInput, '${userId}');
    setNativeValue(pwInput, '${password}');
    var btn = document.querySelector('.button-orange');
    if (btn) btn.click();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PHASE_CHANGE', phase: 'awaiting_otp' }));
  }
  fillAndSubmit();
})();
true;
`;
}

export function buildDataExtractor(): string {
  return `
(function() {
  try {
    var totalEl = document.querySelector('.total-portfolio-value') ||
                  document.querySelector('[data-label="Portfolio value"]') ||
                  document.querySelector('.total-value');
    if (!totalEl) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Could not find portfolio value on page' }));
      return;
    }
    var raw = totalEl.innerText.replace(/[^0-9.]/g, '');
    var value = parseFloat(raw);
    if (isNaN(value)) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Could not parse portfolio value: ' + totalEl.innerText }));
      return;
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'DATA_EXTRACTED',
      payload: { valueInr: value, raw: { text: totalEl.innerText } }
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
  }
})();
true;
`;
}

export function detectLoginSuccess(url: string): boolean {
  return url.includes('kite.zerodha.com/dashboard') || url.includes('kite.zerodha.com/portfolio');
}
