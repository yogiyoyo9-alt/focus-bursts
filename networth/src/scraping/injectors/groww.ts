export function buildCredentialInjector(creds: Record<string, string>): string {
  const email = (creds.email ?? '').replace(/'/g, "\\'");
  const password = (creds.password ?? '').replace(/'/g, "\\'");
  return `
(function() {
  function setNativeValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function fill() {
    var emailInput = document.querySelector('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]');
    var pwInput = document.querySelector('input[type="password"]');
    if (!emailInput) { setTimeout(fill, 500); return; }
    setNativeValue(emailInput, '${email}');
    if (pwInput) {
      setNativeValue(pwInput, '${password}');
      var btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }
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
    var el = document.querySelector('[data-testid="portfolio-value"], .portfolio-value-text, .total-current-value');
    if (!el) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Portfolio value not found on page' }));
      return;
    }
    var raw = el.innerText.replace(/[^0-9.]/g, '');
    var value = parseFloat(raw);
    if (isNaN(value)) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Parse failed: ' + el.innerText }));
      return;
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'DATA_EXTRACTED',
      payload: { valueInr: value, raw: { text: el.innerText } }
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
  }
})();
true;
`;
}

export function detectLoginSuccess(url: string): boolean {
  return url.includes('groww.in/dashboard') || url.includes('groww.in/stocks/portfolio') || url.includes('groww.in/mutual-funds/portfolio');
}
