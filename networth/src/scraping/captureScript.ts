// Tap-to-capture: lets the user tap the balance anywhere on a logged-in page.
// The script intercepts the next tap, extracts the numeric value from the
// tapped element (climbing a few parents if the tap lands on an inner node),
// builds a stable CSS selector for it, and posts both back. The selector is
// stored on the account so future syncs can read the same value automatically.
export function buildTapCaptureScript(): string {
  return `
(function() {
  if (window.__nwCaptureArmed) return;
  window.__nwCaptureArmed = true;

  function cssPath(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    var parts = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      var sel = node.nodeName.toLowerCase();
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      var parent = node.parentElement;
      if (parent) {
        var siblings = Array.prototype.filter.call(parent.children, function(c) {
          return c.nodeName === node.nodeName;
        });
        if (siblings.length > 1) {
          sel += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(sel);
      node = parent;
      depth++;
    }
    return parts.join(' > ');
  }

  function numericFrom(text) {
    if (!text) return NaN;
    var cleaned = text.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned);
  }

  function onTap(e) {
    var node = e.target;
    var matched = null;
    var value = NaN;
    for (var i = 0; i < 4 && node; i++) {
      var t = (node.innerText || node.textContent || '').trim();
      var v = numericFrom(t);
      if (/[0-9]/.test(t) && !isNaN(v) && v > 0) { matched = node; value = v; break; }
      node = node.parentElement;
    }
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('click', onTap, true);
    window.__nwCaptureArmed = false;
    if (!matched || isNaN(value) || value <= 0) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        message: 'No amount found where you tapped. Tap directly on the balance number.'
      }));
      return;
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'DATA_EXTRACTED',
      payload: {
        valueInr: value,
        raw: { text: (matched.innerText || matched.textContent || '').trim(), selector: cssPath(matched), source: 'tap-capture' }
      }
    }));
  }

  document.addEventListener('click', onTap, true);
})();
true;
`;
}

// Auto-extractor for a remembered selector. Polls in case the SPA hasn't
// rendered the value yet, and gives up quietly so the user can re-tap.
export function buildSelectorExtractor(selector: string): string {
  const safe = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
(function() {
  if (window.__nwSelectorExtract) return;
  window.__nwSelectorExtract = true;
  var attempts = 0;
  function tick() {
    attempts++;
    try {
      var el = document.querySelector('${safe}');
      if (el) {
        var t = (el.innerText || el.textContent || '').trim();
        var v = parseFloat(t.replace(/[^0-9.]/g, ''));
        if (!isNaN(v) && v > 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'DATA_EXTRACTED',
            payload: { valueInr: v, raw: { text: t, selector: '${safe}', source: 'selector-auto' } }
          }));
          return;
        }
      }
    } catch (e) {}
    if (attempts >= 30) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECTOR_MISS' }));
      return;
    }
    setTimeout(tick, 1000);
  }
  tick();
})();
true;
`;
}
