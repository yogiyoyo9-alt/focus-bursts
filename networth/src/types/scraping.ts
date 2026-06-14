export type ScrapingPhase =
  | 'idle'
  | 'navigating'
  | 'filling_credentials'
  | 'awaiting_otp'
  | 'post_otp_wait'
  | 'extracting_data'
  | 'done'
  | 'error';

export interface ScrapingSession {
  sessionId: string;
  accountId: string;
  institutionId: string;
  phase: ScrapingPhase;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface ScrapingResult {
  accountId: string;
  institutionId: string;
  success: boolean;
  valueInr: number | null;
  rawData: Record<string, unknown> | null;
  error: string | null;
  scrapedAt: string;
}

export type WebViewMessage =
  | { type: 'PHASE_CHANGE'; phase: ScrapingPhase }
  | { type: 'DATA_EXTRACTED'; payload: { valueInr: number; raw: Record<string, unknown> } }
  | { type: 'ERROR'; message: string }
  | { type: 'OTP_SCREEN_DETECTED' }
  | { type: 'LOGIN_SUCCESS' }
  | { type: 'SELECTOR_MISS' }
  | { type: 'PAGE_READY'; url: string };

export function parseWebViewMessage(data: string): WebViewMessage | null {
  try {
    const msg = JSON.parse(data) as WebViewMessage;
    if (msg && typeof msg.type === 'string') return msg;
    return null;
  } catch {
    return null;
  }
}
