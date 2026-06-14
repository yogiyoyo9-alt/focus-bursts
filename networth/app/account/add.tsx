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
import { useInstitutionStore, pickCustomColor } from '@/store/institutionStore';
import { genId } from '@/utils/id';
import type { AssetCategory, CredentialFieldDef, Institution } from '@/types/account';

type Step = 'pick_institution' | 'custom_setup' | 'enter_credentials';

const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: 'equity', label: 'Equity / Stocks / MF' },
  { value: 'cash', label: 'Cash / Bank' },
  { value: 'debt', label: 'Debt / Bonds / FD' },
  { value: 'pf', label: 'Provident Fund' },
  { value: 'nps', label: 'NPS' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_CUSTOM_FIELDS: CredentialFieldDef[] = [
  { key: 'username', label: 'Username / ID', type: 'text' },
  { key: 'password', label: 'Password', type: 'password' },
];

export default function AddAccountScreen() {
  const router = useRouter();
  const addAccount = useAccountStore((s) => s.addAccount);
  const addCustom = useInstitutionStore((s) => s.addCustom);
  const getInstitution = useInstitutionStore((s) => s.getInstitution);

  const [step, setStep] = useState<Step>('pick_institution');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Custom institution form state.
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customCategory, setCustomCategory] = useState<AssetCategory>('equity');

  const institution = selectedInstitutionId ? getInstitution(selectedInstitutionId) : null;

  const handleSelectInstitution = useCallback(
    (id: string) => {
      setSelectedInstitutionId(id);
      setNickname(getInstitution(id).shortName);
      setCredentials({});
      setStep('enter_credentials');
    },
    [getInstitution],
  );

  const handleCreateCustom = useCallback(async () => {
    const name = customName.trim();
    let url = customUrl.trim();
    if (!name) {
      Alert.alert('Missing name', 'Enter a name for this institution.');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      if (url.length === 0) {
        Alert.alert('Missing login URL', 'Enter the website you log in to.');
        return;
      }
      url = 'https://' + url;
    }
    const id = `custom_${genId()}`;
    const inst: Institution = {
      id,
      name,
      shortName: name.length > 12 ? name.slice(0, 12) : name,
      category: customCategory,
      loginUrl: url,
      scrapingMethod: 'webview_auto',
      credentialFields: DEFAULT_CUSTOM_FIELDS,
      color: pickCustomColor(id),
      isCustom: true,
      notes: 'Log in, then tap "Capture balance" and tap the amount on the page.',
    };
    await addCustom(inst);
    setSelectedInstitutionId(id);
    setNickname(name);
    setCredentials({});
    setStep('enter_credentials');
  }, [customName, customUrl, customCategory, addCustom]);

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
              {(ids as string[]).map((id) => {
                const inst = INSTITUTIONS[id as keyof typeof INSTITUTIONS];
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

        <View style={styles.group}>
          <Text style={styles.groupHeader}>Anything else</Text>
          <TouchableOpacity
            style={styles.customCta}
            onPress={() => {
              setCustomName('');
              setCustomUrl('');
              setCustomCategory('equity');
              setStep('custom_setup');
            }}
          >
            <Text style={styles.customCtaPlus}>＋</Text>
            <View style={styles.customCtaTextWrap}>
              <Text style={styles.customCtaTitle}>Add a custom institution</Text>
              <Text style={styles.customCtaSub}>
                Any bank, broker, or app not listed above
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === 'custom_setup') {
    return (
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => setStep('pick_institution')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.stepHint}>
            Add any institution. After saving you'll log in, then tap the balance on the
            page to capture it — the app remembers the spot for next time.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Institution Name</Text>
            <TextInput
              style={styles.input}
              value={customName}
              onChangeText={setCustomName}
              placeholder="e.g. IDFC First Bank, Paytm Money"
              placeholderTextColor={Colors.textMuted}
              maxLength={40}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Login Website URL</Text>
            <TextInput
              style={styles.input}
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="https://login.example.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryWrap}>
              {CATEGORY_OPTIONS.map((opt) => {
                const active = customCategory === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setCustomCategory(opt.value)}
                  >
                    <Text
                      style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCustom}>
            <Text style={styles.saveBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TouchableOpacity
          onPress={() => setStep(institution?.isCustom ? 'custom_setup' : 'pick_institution')}
          style={styles.backBtn}
        >
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
  stepHint: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4, lineHeight: 20 },
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
  customCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    borderStyle: 'dashed',
    padding: 14,
  },
  customCtaPlus: { color: Colors.primary, fontSize: 26, fontWeight: '300' },
  customCtaTextWrap: { flex: 1 },
  customCtaTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  customCtaSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
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
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  categoryChipText: { color: Colors.textSecondary, fontSize: 13 },
  categoryChipTextActive: { color: Colors.primary, fontWeight: '600' },
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
