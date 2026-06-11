import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { INSTITUTIONS, INSTITUTION_GROUPS } from '@/constants/institutions';
import { useAccountStore } from '@/store/accountStore';
import type { InstitutionId } from '@/types/account';

type Step = 'pick_institution' | 'enter_credentials';

export default function AddAccountScreen() {
  const router = useRouter();
  const addAccount = useAccountStore((s) => s.addAccount);
  const [step, setStep] = useState<Step>('pick_institution');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<InstitutionId | null>(null);
  const [nickname, setNickname] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const institution = selectedInstitutionId ? INSTITUTIONS[selectedInstitutionId] : null;

  const handleSelectInstitution = useCallback((id: InstitutionId) => {
    setSelectedInstitutionId(id);
    setNickname(INSTITUTIONS[id].shortName);
    setCredentials({});
    setStep('enter_credentials');
  }, []);

  const handleSave = useCallback(async () => {
    if (!institution || !selectedInstitutionId) return;
    const requiredFields = institution.credentialFields.map((f) => f.key);
    const missing = requiredFields.filter(
      (k) => institution.scrapingMethod !== 'manual_entry' && !credentials[k],
    );
    if (missing.length > 0) {
      Alert.alert('Missing fields', `Please fill in: ${missing.join(', ')}`);
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('Missing nickname', 'Please enter a name for this account.');
      return;
    }
    setSaving(true);
    try {
      const account = await addAccount(
        {
          institutionId: selectedInstitutionId,
          nickname: nickname.trim(),
          category: institution.category,
        },
        credentials,
      );
      router.replace(`/scrape/${account.id}`);
    } catch (e) {
      Alert.alert('Error', 'Could not save account. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [institution, selectedInstitutionId, credentials, nickname, addAccount, router]);

  if (step === 'pick_institution') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.stepHint}>Choose your bank, broker, PF, or NPS account:</Text>
        {Object.entries(INSTITUTION_GROUPS).map(([groupName, ids]) => (
          <View key={groupName} style={styles.group}>
            <Text style={styles.groupHeader}>{groupName}</Text>
            <View style={styles.institutionGrid}>
              {(ids as InstitutionId[]).map((id) => {
                const inst = INSTITUTIONS[id];
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.institutionCard, { borderColor: inst.color + '66' }]}
                    onPress={() => handleSelectInstitution(id)}
                  >
                    <View style={[styles.instBadge, { backgroundColor: inst.color + '33' }]}>
                      <Text style={[styles.instBadgeText, { color: inst.color }]}>
                        {inst.shortName.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.instName} numberOfLines={2}>
                      {inst.shortName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setStep('pick_institution')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Change institution</Text>
        </TouchableOpacity>

        {institution && (
          <View style={[styles.instHeader, { borderColor: institution.color + '66' }]}>
            <View style={[styles.instBadgeLg, { backgroundColor: institution.color + '33' }]}>
              <Text style={[styles.instBadgeLgText, { color: institution.color }]}>
                {institution.shortName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.instNameLg}>{institution.name}</Text>
              {institution.notes && (
                <Text style={styles.instNotes}>{institution.notes}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Account Nickname</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. SBI Savings, Zerodha - Wife"
            placeholderTextColor={Colors.textMuted}
            maxLength={40}
          />
        </View>

        {institution?.scrapingMethod !== 'manual_entry' &&
          institution?.credentialFields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={credentials[field.key] ?? ''}
                onChangeText={(text) =>
                  setCredentials((prev) => ({ ...prev, [field.key]: text }))
                }
                placeholder={field.placeholder ?? field.label}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={field.type === 'password'}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}

        {institution?.scrapingMethod === 'manual_entry' && (
          <View style={styles.manualNote}>
            <Text style={styles.manualNoteText}>
              This institution uses manual entry. You will update the balance yourself from the
              account detail screen.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save & Sync'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 60 },
  stepHint: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  group: { gap: 8 },
  groupHeader: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  institutionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  institutionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    width: '22%',
    alignItems: 'center',
    gap: 6,
  },
  instBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  instBadgeText: { fontSize: 11, fontWeight: '700' },
  instName: { color: Colors.textSecondary, fontSize: 10, textAlign: 'center' },
  backBtn: { marginBottom: 4 },
  backBtnText: { color: Colors.primary, fontSize: 14 },
  instHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  instBadgeLg: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  instBadgeLgText: { fontSize: 16, fontWeight: '700' },
  instNameLg: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  instNotes: { color: Colors.warning, fontSize: 12, marginTop: 2, maxWidth: 260 },
  field: { gap: 6 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 15,
    padding: 12,
  },
  manualNote: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  manualNoteText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
