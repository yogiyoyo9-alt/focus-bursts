import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { initializeDatabase } from '@/db/schema';
import { useAccountStore } from '@/store/accountStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useInstitutionStore } from '@/store/institutionStore';

export default function RootLayout() {
  const loadAccounts = useAccountStore((s) => s.loadAccounts);
  const loadLatest = usePortfolioStore((s) => s.loadLatest);
  const loadHistory = usePortfolioStore((s) => s.loadHistory);
  const loadCustom = useInstitutionStore((s) => s.loadCustom);

  useEffect(() => {
    async function init() {
      await initializeDatabase();
      await loadCustom();
      await loadAccounts();
      await loadLatest();
      await loadHistory(90);
    }
    void init();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0D1117' },
          headerTintColor: '#E6EDF3',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0D1117' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="account/add"
          options={{ title: 'Add Account', presentation: 'modal' }}
        />
        <Stack.Screen name="account/[id]" options={{ title: 'Account' }} />
        <Stack.Screen
          name="scrape/[id]"
          options={{ title: 'Sync Account', presentation: 'fullScreenModal' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
