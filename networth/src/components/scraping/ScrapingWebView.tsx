import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import WebView, { type WebViewNavigation } from 'react-native-webview';
import type { ScrapingPhase, ScrapingResult } from '@/types/scraping';
import { parseWebViewMessage } from '@/types/scraping';
import type { Account } from '@/types/account';
import { useInstitutionStore } from '@/store/institutionStore';
import { loadCredentials } from '@/security/credentialStore';
import { getInjector } from '@/scraping/engine';
import { buildTapCaptureScript, buildSelectorExtractor } from '@/scraping/captureScript';
import { OTPOverlay } from './OTPOverlay';
import { Colors } from '@/constants/colors';

interface ScrapingWebViewProps {
  account: Account;
  onComplete: (result: ScrapingResult) => void;
  onPhaseChange?: (phase: ScrapingPhase) => void;
}

export function ScrapingWebView({ account, onComplete, onPhaseChange }: ScrapingWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [phase, setPhase] = useState<ScrapingPhase>('navigating');
  const [captureArmed, setCaptureArmed] = useState(false);
  const credentialsInjected = useRef(false);
  const completed = useRef(false);

  const institution = useInstitutionStore((s) => s.getInstitution(account.institutionId));
  const injector = getInjector(account.institutionId);

  const updatePhase = useCallback(
    (p: ScrapingPhase) => {
      setPhase(p);
      onPhaseChange?.(p);
    },
    [onPhaseChange],
  );

  const finish = useCallback(
    (result: ScrapingResult) => {
      if (completed.current) return;
      completed.current = true;
      updatePhase('done');
      onComplete(result);
    },
    [onComplete, updatePhase],
  );

  const buildResult = useCallback(
    (success: boolean, valueInr: number | null, rawData: Record<string, unknown> | null, error: string | null): ScrapingResult => ({
      accountId: account.id,
      institutionId: account.institutionId,
      success,
      valueInr,
      rawData,
      error,
      scrapedAt: new Date().toISOString(),
    }),
    [account.id, account.institutionId],
  );

  const handleLoadEnd = useCallback(async () => {
    if (completed.current) return;

    // First page load: inject saved credentials.
    if (!credentialsInjected.current) {
      credentialsInjected.current = true;
      updatePhase('filling_credentials');
      const creds = await loadCredentials(account.id);
      if (!creds) {
        finish(buildResult(false, null, null, 'Credentials not found'));
        return;
      }
      webViewRef.current?.injectJavaScript(injector.buildCredentialInjector(creds.fields));
      return;
    }

    // Subsequent page loads (after the user completes login/OTP): try to read
    // the balance. If we remembered where it is from a previous sync, use that
    // selector; otherwise run the institution's extractor. Either way the user
    // can fall back to tapping the value manually.
    if (account.captureSelector) {
      webViewRef.current?.injectJavaScript(buildSelectorExtractor(account.captureSelector));
    } else {
      webViewRef.current?.injectJavaScript(injector.buildDataExtractor());
    }
  }, [account, injector, updatePhase, finish, buildResult]);

  const armCapture = useCallback(() => {
    setCaptureArmed(true);
    webViewRef.current?.injectJavaScript(buildTapCaptureScript());
  }, []);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const msg = parseWebViewMessage(event.nativeEvent.data);
      if (!msg) return;

      switch (msg.type) {
        case 'PHASE_CHANGE':
          updatePhase(msg.phase);
          break;

        case 'OTP_SCREEN_DETECTED':
          updatePhase('awaiting_otp');
          break;

        case 'LOGIN_SUCCESS':
          updatePhase('extracting_data');
          webViewRef.current?.injectJavaScript(injector.buildDataExtractor());
          break;

        case 'DATA_EXTRACTED':
          setCaptureArmed(false);
          finish(buildResult(true, msg.payload.valueInr, msg.payload.raw, null));
          break;

        case 'SELECTOR_MISS':
          // The remembered spot didn't have a value yet — fall back to the
          // institution extractor; the user can also tap manually.
          webViewRef.current?.injectJavaScript(injector.buildDataExtractor());
          break;

        case 'ERROR':
          // A failed tap capture shouldn't end the whole session — let the user
          // retry. Other errors finish the flow.
          if (captureArmed) {
            setCaptureArmed(false);
            return;
          }
          finish(buildResult(false, null, null, msg.message));
          break;

        case 'PAGE_READY':
          if (phase === 'awaiting_otp' || phase === 'post_otp_wait') {
            updatePhase('extracting_data');
            webViewRef.current?.injectJavaScript(injector.buildDataExtractor());
          }
          break;
      }
    },
    [injector, updatePhase, finish, buildResult, phase, captureArmed],
  );

  const handleNavigationStateChange = useCallback(
    (nav: WebViewNavigation) => {
      if (
        (phase === 'awaiting_otp' || phase === 'post_otp_wait') &&
        injector.detectLoginSuccess(nav.url)
      ) {
        updatePhase('extracting_data');
        webViewRef.current?.injectJavaScript(injector.buildDataExtractor());
      }
    },
    [phase, injector, updatePhase],
  );

  return (
    <View style={styles.container}>
      <OTPOverlay phase={phase} institutionName={institution.name} />
      <WebView
        ref={webViewRef}
        source={{ uri: institution.loginUrl }}
        style={styles.webView}
        onLoadEnd={handleLoadEnd}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
      />

      <View style={styles.captureBar}>
        <Text style={styles.captureHint}>
          {captureArmed
            ? 'Now tap the balance amount on the page above.'
            : "Logged in but balance not detected? Tap below, then tap the amount on the page."}
        </Text>
        <TouchableOpacity
          style={[styles.captureBtn, captureArmed && styles.captureBtnArmed]}
          onPress={armCapture}
          disabled={captureArmed}
        >
          <Text style={styles.captureBtnText}>
            {captureArmed ? 'Waiting for your tap…' : 'Capture balance manually'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webView: {
    flex: 1,
  },
  captureBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
    gap: 8,
  },
  captureHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  captureBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  captureBtnArmed: {
    backgroundColor: Colors.surfaceAlt,
  },
  captureBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
