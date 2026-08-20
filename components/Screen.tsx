import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{ header?: ReactNode; scroll?: boolean; contentStyle?: ScrollViewProps['contentContainerStyle']; testID?: string }>;

export function Screen({ children, header, scroll = true, contentStyle, testID }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID={testID}>
      {header}
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: 96 },
});
