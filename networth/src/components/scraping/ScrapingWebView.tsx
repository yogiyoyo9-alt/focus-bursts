import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView, { type WebViewNavigation } from 'react-native-webview';
import type { ScrapingPhase, ScrapingResult, WebViewMessage } from '@/types/scraping';
import { parseWebViewMessage } from '@/types/scraping';
import type { Account } from '@/types/account';
import { INSTITUTIONS } from '@/constants/institutions';
import { loadCredentials } from '@/security/credentialStore';
import { getInjector } from '@/scraping/engine';
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
  const credentialsInjected = useRef(false);
  const completed = useRef(false);

  const institution = INSTITUTIONS[account.institutionId];
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

  const handleLoadEnd = useCallback(async () => {
    if (credentialsInjected.current) return;
    credentialsInjected.current = true;
    updatePhase('filling_credentials');
    const creds = await loadCredentials(account.id);
    if (!creds) {
      finish({
        accountId: account.id,
        institutionId: account.institutionId,
        success: false,
        valueInr: null,
        rawData: null,
        error: 'Credentials not found',
        scrapedAt: new Date().toISOString(),
      });
      return;
    }
    const script = injector.buildCredentialInjector(creds.fields);
    webViewRef.current?.injectJavaScript(script);
  }, [account, injector, updatePhase, finish]);

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
          finish({
            accountId: account.id,
            institutionId: account.institutionId,
            success: true,
            valueInr: msg.payload.valueInr,
            rawData: msg.payload.raw,
            error: null,
            scrapedAt: new Date().toISOString(),
          });
          break;

        case 'ERROR':
          finish({
            accountId: account.id,
            institutionId: account.institutionId,
            success: false,
            valueInr: null,
            rawData: null,
            error: msg.message,
            scrapedAt: new Date().toISOString(),
          });
          break;

        case 'PAGE_READY':
          if (phase === 'awaiting_otp' || phase === 'post_otp_wait') {
            updatePhase('extracting_data');
            webViewRef.current?.injectJavaScript(injector.buildDataExtractor());
          }
          break;
      }
    },
    [account, injector, updatePhase, finish, phase],
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
});
