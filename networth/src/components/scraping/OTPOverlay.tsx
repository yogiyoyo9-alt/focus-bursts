import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import type { ScrapingPhase } from '@/types/scraping';

interface OTPOverlayProps {
  phase: ScrapingPhase;
  institutionName: string;
}

const PHASE_MESSAGES: Partial<Record<ScrapingPhase, string>> = {
  navigating: 'Opening portal…',
  filling_credentials: 'Filling your credentials…',
  awaiting_otp: 'Enter the OTP you received, then continue.',
  post_otp_wait: 'Verifying OTP…',
  extracting_data: 'Reading your balance…',
  done: 'Done!',
  error: 'Something went wrong.',
};

export function OTPOverlay({ phase, institutionName }: OTPOverlayProps) {
  const message = PHASE_MESSAGES[phase] ?? '';
  const isOTPPhase = phase === 'awaiting_otp';

  return (
    <View style={[styles.container, isOTPPhase && styles.otpActive]}>
      <Text style={styles.institution}>{institutionName}</Text>
      <Text style={[styles.message, isOTPPhase && styles.otpMessage]}>{message}</Text>
      {isOTPPhase && (
        <Text style={styles.hint}>The app will continue automatically after you log in.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  otpActive: {
    backgroundColor: Colors.warningDim,
    borderBottomColor: Colors.warning,
  },
  institution: {
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  otpMessage: {
    color: Colors.warning,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
