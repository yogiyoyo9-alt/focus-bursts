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

// Robust polling extractor. Groww renders the portfolio dashboard as a SPA, so
// the value may appear seconds after the page "loads", and on a URL we can't
// predict. Rather than rely on CSS selectors (which Groww changes often) or URL
// matching, we poll the page and locate the "Current" value by its on-screen
// position relative to the "Current" label.
export function buildDataExtractor(): string {
  return `
(function() {
  if (window.__nwGrowwExtract) return;
  window.__nwGrowwExtract = true;

  var attempts = 0;
  var maxAttempts = 120; // ~120s at 1s intervals

  function leafEls() {
    var out = [];
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      if (all[i].children.length === 0) out.push(all[i]);
    }
    return out;
  }

  function findLabel(name) {
    var leaves = leafEls();
    var re = new RegExp('^' + name + '$', 'i');
    for (var i = 0; i < leaves.length; i++) {
      if (re.test((leaves[i].textContent || '').trim())) return leaves[i];
    }
    return null;
  }

  function rupeeLeaves() {
    var out = [];
    var leaves = leafEls();
    for (var i = 0; i < leaves.length; i++) {
      var t = (leaves[i].textContent || '').trim();
      if (/^[\\u20B9\\s0-9,.\\+\\-]+$/.test(t) && /\\u20B9\\s*[0-9]/.test(t)) {
        out.push(leaves[i]);
      }
    }
    return out;
  }

  // Find the rupee value visually nearest below/beside the "Current" label.
  function findCurrentValue() {
    var lbl = findLabel('Current');
    if (!lbl) return null;
    var lr = lbl.getBoundingClientRect();
    var cands = rupeeLeaves();
    var best = null, bestD = 1e9;
    for (var i = 0; i < cands.length; i++) {
      var r = cands[i].getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      var dx = Math.abs((r.left + r.right) / 2 - (lr.left + lr.right) / 2);
      var dy = r.top - lr.top;
      if (dy >= -5 && dy < 90 && dx < 100) {
        var d = dy + dx;
        if (d < bestD) { bestD = d; best = cands[i]; }
      }
    }
    if (!best) return null;
    var num = (best.textContent || '').replace(/[^0-9.]/g, '');
    var v = parseFloat(num);
    if (isNaN(v) || v <= 0) return null;
    return { value: v, raw: (best.textContent || '').trim() };
  }

  function tick() {
    attempts++;
    var res = null;
    try { res = findCurrentValue(); } catch (e) {}
    if (res) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'DATA_EXTRACTED',
        payload: { valueInr: res.value, raw: { text: res.raw, source: 'groww-current' } }
      }));
      return;
    }
    if (attempts >= maxAttempts) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        message: 'Could not read your Groww balance. Open the Dashboard tab, or enter the value manually.'
      }));
      return;
    }
    setTimeout(tick, 1000);
  }

  tick();
})();
true;
`;
}

export function detectLoginSuccess(url: string): boolean {
  // Any authenticated Groww area. The poller is the primary trigger; this is a
  // best-effort secondary signal for the navigation-state handler.
  return (
    url.includes('groww.in/stocks') ||
    url.includes('groww.in/mutual-funds') ||
    url.includes('groww.in/user') ||
    url.includes('groww.in/dashboard')
  );
}
