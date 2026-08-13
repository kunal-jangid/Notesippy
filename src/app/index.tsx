import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getNotes, Note } from '../services/notesStore';

export default function HomeScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeStyles = isDark ? darkTheme : lightTheme;

  useFocusEffect(
    useCallback(() => {
      setNotes(getNotes());
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeStyles.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: themeStyles.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeStyles.text }]}>Notesippy</Text>
        </View>

        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: themeStyles.text }]}>No notes</Text>
              <Text style={styles.emptySub}>Tap + to create a minimal note.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.cardBorder }]}
              onPress={() => router.push(`/note/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.title, { color: themeStyles.text }]}>{item.title}</Text>
                {item.isUrgent && <View style={[styles.badge, { backgroundColor: themeStyles.badgeBg }]} />}
              </View>
              <Text style={[styles.preview, { color: themeStyles.previewText }]} numberOfLines={2}>
                {item.content || 'No content'}
              </Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: themeStyles.fabBg }]} 
          onPress={() => router.push('/note/new')}
        >
          <Text style={[styles.fabText, { color: themeStyles.fabText }]}>+</Text>
        </TouchableOpacity>
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
  badgeBg: '#FFFFFF',
  fabBg: '#FFFFFF',
  fabText: '#000000',
};

const lightTheme = {
  bg: '#F4F4F5',
  text: '#09090B',
  cardBg: '#FFFFFF',
  cardBorder: '#E4E4E7',
  previewText: '#52525B',
  badgeBg: '#09090B',
  fabBg: '#09090B',
  fabText: '#FFFFFF',
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  list: { paddingBottom: 100 },
  card: { borderWidth: 1, padding: 18, borderRadius: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  badge: { width: 8, height: 8, borderRadius: 4 },
  preview: { fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 120 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#71717A', fontSize: 13, marginTop: 4 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  fabText: { fontSize: 28, fontWeight: '400', marginTop: -2 },
});