import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNotes, setWidgetNoteMapping, syncWidget } from '../services/notesStore';

export default function WidgetSelectScreen() {
  const { widgetId } = useLocalSearchParams<{ widgetId: string }>();
  const router = useRouter();
  const notes = getNotes();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeStyles = isDark ? darkTheme : lightTheme;

  const handleSelectNote = async (noteId: string) => {
    if (widgetId) {
      setWidgetNoteMapping(Number(widgetId), noteId);
      await syncWidget();
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeStyles.bg }]}>
      <View style={[styles.container, { backgroundColor: themeStyles.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeStyles.text }]}>Select Note for Widget</Text>
          <Text style={styles.headerSub}>Choose a note to display on this widget</Text>
        </View>

        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: themeStyles.text }]}>No notes available</Text>
              <Text style={styles.emptySub}>Please create a note in the app first.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.cardBorder }]}
              onPress={() => handleSelectNote(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.title, { color: themeStyles.text }]}>{item.title}</Text>
              <Text style={[styles.preview, { color: themeStyles.previewText }]} numberOfLines={2}>
                {item.content || 'No content'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const darkTheme = {
  bg: '#000000',
  text: '#FFFFFF',
  cardBg: '#09090B',
  cardBorder: '#27272A',
  previewText: '#A1A1AA',
};

const lightTheme = {
  bg: '#F4F4F5',
  text: '#09090B',
  cardBg: '#FFFFFF',
  cardBorder: '#E4E4E7',
  previewText: '#52525B',
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingVertical: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#71717A', marginTop: 4 },
  list: { paddingBottom: 100 },
  card: { borderWidth: 1, padding: 18, borderRadius: 14, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8 },
  preview: { fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 120 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#71717A', fontSize: 13, marginTop: 4 },
});
