import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { BrandHeader } from '@/components/BrandHeader';
import { Button } from '@/components/Button';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { Screen } from '@/components/Screen';
import { serviceCategories } from '@/constants/categories';
import { colors, radius, spacing, type } from '@/constants/theme';
import { assertNoPrivateAddress, normalizeMoney, validateExperienceDraft } from '@/lib/domain/rules.mjs';
import { config } from '@/lib/config';
import { repository } from '@/lib/repository';
import type { Provider, Rating, SafeAnchor } from '@/types/domain';

const ratingQuestions: { key: keyof Rating; label: string }[] = [
  { key: 'quality', label: 'Quality of work' }, { key: 'value', label: 'Value for the price' }, { key: 'reliability', label: 'Reliability' },
  { key: 'communication', label: 'Communication' }, { key: 'recommend', label: 'Would you recommend?' },
];

export default function ShareScreen() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [anchors, setAnchors] = useState<SafeAnchor[]>([]);
  const [providerId, setProviderId] = useState('');
  const [categoryId, setCategoryId] = useState('handyman');
  const [serviceItem, setServiceItem] = useState('');
  const [serviceMonth, setServiceMonth] = useState(new Date().toISOString().slice(0, 7));
  const [cost, setCost] = useState('');
  const [comment, setComment] = useState('');
  const [anchorId, setAnchorId] = useState('');
  const [materialsTax, setMaterialsTax] = useState<boolean | null>(null);
  const [rating, setRating] = useState<Rating>({ quality: 5, value: 5, reliability: 5, communication: 5, recommend: 5 });
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const photosEnabled = config.mode !== 'production' || Boolean(config.mediaApiUrl);

  useEffect(() => {
    void Promise.all([repository.listProviders({}), repository.listAnchors()]).then(([providerRows, anchorRows]) => {
      setProviders(providerRows); setAnchors(anchorRows); setProviderId(providerRows[0]?.id ?? ''); setAnchorId(anchorRows[0]?.id ?? '');
    });
  }, []);
  const provider = useMemo(() => providers.find((item) => item.id === providerId), [providerId, providers]);
  const anchor = useMemo(() => anchors.find((item) => item.id === anchorId), [anchorId, anchors]);

  async function addPhoto() {
    if (!photosEnabled) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 4, quality: 0.9, exif: false });
    if (result.canceled) return;
    const reencoded = await Promise.all(result.assets.slice(0, 4 - mediaUrls.length).map((asset) => manipulateAsync(asset.uri, [], { compress: 0.84, format: SaveFormat.JPEG })));
    setMediaUrls((current) => [...current, ...reencoded.map((item) => item.uri)].slice(0, 4));
  }

  async function publish() {
    try {
      if (!provider || !anchor) throw new Error('Choose a Service Friend and safe public anchor.');
      const money = normalizeMoney(Number(cost), 'USD');
      const draft = {
        provider, categoryId, serviceItem: serviceItem.trim(), serviceMonth: `${serviceMonth}-01`, ...money,
        includesMaterialsTax: materialsTax, rating, comment: comment.trim(), anchor, mediaUrls: photosEnabled ? mediaUrls : [],
      };
      assertNoPrivateAddress(draft);
      validateExperienceDraft(draft);
      setPublishing(true);
      const created = await repository.publishExperience(draft);
      if (config.mode === 'production') Alert.alert('Experience submitted', 'Your experience is private while safety review is pending. No private home location was stored.');
      else Alert.alert('Experience published', 'Your safe public anchor is shown; no private home location was stored.', [{ text: 'View', onPress: () => router.push(`/experience/${created.id}`) }]);
      setServiceItem(''); setCost(''); setComment(''); setMediaUrls([]);
    } catch (error) { Alert.alert('Review the experience', error instanceof Error ? error.message : 'Please check every field.'); }
    finally { setPublishing(false); }
  }

  return (
    <Screen header={<BrandHeader compact title="Share a completed service" />}>
      <Text style={styles.title}>Real job. Real cost. Real experience.</Text>
      <PrivacyNotice />
      <FieldLabel step="1" label="Service Friend" />
      <View style={styles.options}>{providers.map((item) => <Choice key={item.id} selected={providerId === item.id} label={item.publicName} detail={item.listingSource === 'provider_self_listed' ? 'Provider self-listed' : 'Community-shared'} onPress={() => setProviderId(item.id)} />)}</View>
      <FieldLabel step="2" label="Service category" />
      <View style={styles.wrap}>{serviceCategories.map((item) => <Pressable key={item.id} onPress={() => setCategoryId(item.id)} style={[styles.pill, categoryId === item.id && styles.pillSelected]}><Text style={[styles.pillText, categoryId === item.id && styles.pillTextSelected]}>{item.icon} {item.name}</Text></Pressable>)}</View>
      <FieldLabel step="3" label="What work was completed?" />
      <TextInput value={serviceItem} onChangeText={setServiceItem} placeholder="Example: repaired a leaking outdoor valve" maxLength={120} style={styles.input} />
      <FieldLabel step="4" label="Month and actual cost" />
      <View style={styles.row}><TextInput value={serviceMonth} onChangeText={setServiceMonth} placeholder="YYYY-MM" maxLength={7} style={[styles.input, styles.flex]} keyboardType="numbers-and-punctuation" /><TextInput value={cost} onChangeText={setCost} placeholder="USD amount" style={[styles.input, styles.flex]} keyboardType="decimal-pad" /></View>
      <Text style={styles.subLabel}>Did the cost include materials and tax?</Text>
      <View style={styles.row}>{[{ value: true, label: 'Yes' }, { value: false, label: 'No' }, { value: null, label: 'Not sure' }].map((item) => <Pressable key={item.label} onPress={() => setMaterialsTax(item.value)} style={[styles.smallChoice, materialsTax === item.value && styles.smallChoiceSelected]}><Text style={styles.smallChoiceText}>{item.label}</Text></Pressable>)}</View>
      <FieldLabel step="5" label="Five-question feedback" />
      {ratingQuestions.map((question) => <View key={question.key} style={styles.ratingRow}><Text style={styles.ratingLabel}>{question.label}</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating((current) => ({ ...current, [question.key]: value }))} hitSlop={4}><Text style={[styles.star, value > rating[question.key] && styles.starEmpty]}>★</Text></Pressable>)}</View></View>)}
      <FieldLabel step="6" label="Comment" />
      <TextInput value={comment} onChangeText={setComment} placeholder="What should a neighbor know? Do not include a private address." maxLength={2000} multiline textAlignVertical="top" style={[styles.input, styles.comment]} />
      <FieldLabel step="7" label="Safe public anchor" />
      {anchors.map((item) => <Choice key={item.id} selected={anchorId === item.id} label={item.name} detail={`${item.locality} · public ${item.class.replaceAll('_', ' ')}`} onPress={() => setAnchorId(item.id)} />)}
      {photosEnabled ? <>
        <FieldLabel step="8" label="Optional photos" />
        <Text style={styles.help}>Up to 4 images. Every selected photo is re-encoded before upload to remove EXIF and GPS metadata. Video remains disabled until secure processing is configured.</Text>
        <View style={styles.mediaRow}>{mediaUrls.map((uri) => <Image key={uri} source={{ uri }} style={styles.photo} />)}{mediaUrls.length < 4 ? <Pressable onPress={() => void addPhoto()} style={styles.addPhoto}><Text style={styles.addPhotoText}>＋ Photo</Text></Pressable> : null}</View>
      </> : <>
        <FieldLabel step="8" label="Photos" />
        <Text style={styles.help}>Photo sharing is not included in version 1.0. It will be enabled after private media storage and moderation are deployed.</Text>
      </>}
      <View style={styles.confirm}><Text style={styles.confirmTitle}>Before publishing</Text><Text style={styles.help}>I confirm this describes a completed service, uses the actual reported cost, and contains no private home address or exact service date.</Text></View>
      <Button label="Publish real experience" onPress={() => void publish()} loading={publishing} style={styles.publish} />
    </Screen>
  );
}

function FieldLabel({ step, label }: { step: string; label: string }) { return <View style={styles.fieldLabel}><Text style={styles.step}>{step}</Text><Text style={styles.fieldText}>{label}</Text></View>; }
function Choice({ selected, label, detail, onPress }: { selected: boolean; label: string; detail: string; onPress(): void }) { return <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]} accessibilityRole="radio" accessibilityState={{ checked: selected }}><View style={[styles.radio, selected && styles.radioSelected]} /><View style={styles.flex}><Text style={styles.choiceTitle}>{label}</Text><Text style={styles.help}>{detail}</Text></View></Pressable>; }

const styles = StyleSheet.create({
  title: { ...type.pageTitle, marginTop: spacing.lg }, fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.sm }, step: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, color: colors.white, textAlign: 'center', lineHeight: 28, fontWeight: '900' }, fieldText: { ...type.sectionTitle, flex: 1 },
  options: { gap: 4 }, choice: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.grayLight, marginVertical: 4 }, choiceSelected: { borderColor: colors.green, backgroundColor: colors.successSoft }, radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: colors.gray, marginTop: 2 }, radioSelected: { borderWidth: 6, borderColor: colors.green }, choiceTitle: { ...type.cardTitle }, help: { ...type.caption, lineHeight: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, pill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grayLight }, pillSelected: { backgroundColor: colors.navy }, pillText: { color: colors.ink, fontSize: 12, fontWeight: '700' }, pillTextSelected: { color: colors.white },
  input: { minHeight: 50, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grayLight, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.ink, fontSize: 15 }, comment: { minHeight: 130 }, row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, flex: { flex: 1 }, subLabel: { ...type.caption, marginVertical: spacing.sm, fontWeight: '700' }, smallChoice: { flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grayLight, alignItems: 'center', justifyContent: 'center' }, smallChoiceSelected: { borderColor: colors.green, backgroundColor: colors.successSoft }, smallChoiceText: { color: colors.ink, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.grayLight }, ratingLabel: { ...type.body, flex: 1 }, stars: { flexDirection: 'row' }, star: { color: colors.orange, fontSize: 25, paddingHorizontal: 2 }, starEmpty: { color: colors.grayLight },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }, photo: { width: 72, height: 72, borderRadius: radius.sm }, addPhoto: { width: 88, height: 72, borderRadius: radius.sm, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, addPhotoText: { color: colors.blue, fontWeight: '800' },
  confirm: { backgroundColor: colors.orangeSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl }, confirmTitle: { ...type.cardTitle, color: colors.navy, marginBottom: 4 }, publish: { marginTop: spacing.md },
});
