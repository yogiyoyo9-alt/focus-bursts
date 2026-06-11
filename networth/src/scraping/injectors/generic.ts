export function buildCredentialInjector(creds: Record<string, string>): string {
  const firstField = Object.values(creds)[0] ?? '';
  const password = creds.password ?? '';
  const safeFirst = firstField.replace(/'/g, "\\'");
  const safePassword = password.replace(/'/g, "\\'");
  return `
(function() {
  function setNativeValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function fill() {
    var inputs = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit])'));
    var textInputs = inputs.filter(function(i) { return i.type !== 'password'; });
    var pwInputs = inputs.filter(function(i) { return i.type === 'password'; });
    if (textInputs.length === 0) { setTimeout(fill, 600); return; }
    if (textInputs[0]) setNativeValue(textInputs[0], '${safeFirst}');
    if (pwInputs[0] && '${safePassword}') setNativeValue(pwInputs[0], '${safePassword}');
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
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAGE_READY', url: window.location.href }));
})();
true;
`;
}

export function detectLoginSuccess(_url: string): boolean {
  return false;
}
