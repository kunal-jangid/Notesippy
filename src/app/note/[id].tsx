import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Switch, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Animated, Keyboard, useColorScheme, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getNotes, saveNote, deleteNote, pinNoteToWidget, Note, setWidgetNoteMapping, getWidgetNote, syncWidget } from '../../services/notesStore';
import { showLockscreenLiveNote, removeLockscreenNote } from '../../services/notificationService';
import { getWidgetInfo } from 'react-native-android-widget';

const MAX_CHAR_LIMIT = 150;

export default function NoteOverlaySheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [reminderPeriod, setReminderPeriod] = useState(15);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeStyles = isDark ? darkTheme : lightTheme;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Fade & Scale in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  useEffect(() => {
    if (id && id !== 'new') {
      const existing = getNotes().find((n) => n.id === id);
      if (existing) {
        setContent(existing.content);
        setIsUrgent(existing.isUrgent);
        if (existing.reminderPeriod !== undefined) {
          setReminderPeriod(existing.reminderPeriod);
        }
      }
    }
  }, [id]);

  const handleContentChange = (text: string) => {
    if (text.length <= MAX_CHAR_LIMIT) {
      setContent(text);
    }
  };

  const handleSave = async () => {
    const noteId = id === 'new' ? Date.now().toString() : id;
    const noteContent = content.trim();
    // Derive note title from the first line of content (up to 20 characters)
    const firstLine = noteContent.split('\n')[0];
    const derivedTitle = firstLine.substring(0, 20) || 'Untitled Note';

    const updatedNote: Note = {
      id: noteId,
      title: derivedTitle,
      content,
      isUrgent,
      reminderPeriod,
      updatedAt: Date.now(),
    };

    await saveNote(updatedNote);

    if (isUrgent) {
      await showLockscreenLiveNote(updatedNote);
    } else {
      await removeLockscreenNote(noteId);
    }

    handleDismiss();
  };

  const handlePin = async () => {
    if (id === 'new') {
      Alert.alert('Save First', 'Please save the note before pinning.');
      return;
    }

    try {
      const activeWidgets = await getWidgetInfo('NotesGridWidget');
      if (activeWidgets.length === 0) {
        Alert.alert('No Widgets Found', 'Please add a Notesippy widget to your home screen first.');
        return;
      }

      if (activeWidgets.length === 1) {
        const widgetId = activeWidgets[0].widgetId;
        setWidgetNoteMapping(widgetId, id);
        await syncWidget();
        Alert.alert('Pinned', 'Note pinned to your home screen widget.');
      } else {
        const options = activeWidgets.map((widget, index) => {
          const currentNote = getWidgetNote(widget.widgetId);
          const noteTitle = currentNote ? currentNote.title : 'No note selected';
          return {
            text: `Widget #${index + 1} (${noteTitle})`,
            onPress: async () => {
              setWidgetNoteMapping(widget.widgetId, id);
              await syncWidget();
              Alert.alert('Pinned', `Note pinned to Widget #${index + 1}.`);
            }
          };
        });

        Alert.alert(
          'Choose Widget',
          'Which home screen widget do you want to pin this note to?',
          [
            ...options.map(opt => ({ text: opt.text, onPress: opt.onPress })),
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (e) {
      console.warn(e);
      await pinNoteToWidget(id);
      Alert.alert('Pinned', 'Widget updated.');
    }
  };

  const handleDelete = async () => {
    if (id && id !== 'new') {
      await deleteNote(id);
      await removeLockscreenNote(id);
    }
    handleDismiss();
  };

  return (
    <SafeAreaView style={[styles.backdrop, { backgroundColor: themeStyles.backdrop }]}>
      {/* Tap backdrop to close */}
      <TouchableOpacity style={styles.dismissArea} onPress={handleDismiss} activeOpacity={1} />

      {/* Centered Dialog Box */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Animated.View 
          style={[
            styles.sheet, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: scaleAnim }],
              backgroundColor: themeStyles.sheetBg,
              borderColor: themeStyles.sheetBorder,
            }
          ]}
        >
          {/* Compact 150-char text area */}
          <TextInput
            style={[
              styles.contentInput, 
              { 
                color: themeStyles.text, 
                backgroundColor: themeStyles.inputBg, 
                borderColor: themeStyles.inputBorder,
              }
            ]}
            placeholder="Type note (150 chars max)..."
            placeholderTextColor={themeStyles.placeholder}
            multiline
            value={content}
            onChangeText={handleContentChange}
          />

          {/* Character Counter Row shifted below the text area */}
          <View style={styles.counterRow}>
            <Text style={[styles.counter, content.length >= MAX_CHAR_LIMIT && styles.counterLimit]}>
              {content.length}/{MAX_CHAR_LIMIT}
            </Text>
          </View>

          {/* Period Selection (Dynamic height, only visible when Live toggle is ON) */}
          {isUrgent && (
            <View style={styles.periodContainer}>
              <Text style={[styles.periodTitle, { color: themeStyles.text }]}>Pill Countdown Duration</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodScroll}>
                {[
                  { label: '5m', value: 5 },
                  { label: '15m', value: 15 },
                  { label: '30m', value: 30 },
                  { label: '45m', value: 45 },
                  { label: '1h', value: 60 },
                  { label: '3h', value: 180 },
                  { label: '6h', value: 360 },
                  { label: '12h', value: 720 },
                ].map((item) => {
                  const isSelected = reminderPeriod === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.periodChip,
                        {
                          backgroundColor: isSelected ? themeStyles.saveBtnBg : themeStyles.btnBg,
                          borderColor: themeStyles.btnBorder,
                        },
                      ]}
                      onPress={() => setReminderPeriod(item.value)}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          { color: isSelected ? themeStyles.saveBtnText : themeStyles.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Icon Actions Bar */}
          <View style={styles.actionRow}>
            {/* Live Lockscreen Toggle */}
            <View style={[styles.iconToggle, { backgroundColor: themeStyles.btnBg, borderColor: themeStyles.btnBorder }]}>
              <Text style={[styles.iconLabel, { color: themeStyles.text }]}>Live</Text>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={themeStyles.switchTrack}
                thumbColor={themeStyles.switchThumb}
              />
            </View>

            <View style={styles.btnGroup}>
              {id !== 'new' && (
                <>
                  <TouchableOpacity 
                    style={[styles.iconBtn, { backgroundColor: themeStyles.btnBg, borderColor: themeStyles.btnBorder }]} 
                    onPress={handleDelete}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={themeStyles.text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconBtn, { backgroundColor: themeStyles.btnBg, borderColor: themeStyles.btnBorder }]} 
                    onPress={handlePin}
                  >
                    <Ionicons
                      name="pin-outline"
                      size={18}
                      color={themeStyles.text}
                    />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: themeStyles.saveBtnBg }]} onPress={handleSave}>
                <Text style={[styles.saveText, { color: themeStyles.saveBtnText }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const darkTheme = {
  backdrop: 'rgba(0,0,0,0.75)',
  sheetBg: 'rgba(20, 20, 22, 0.85)',
  sheetBorder: 'rgba(255, 255, 255, 0.15)',
  text: '#FFFFFF',
  placeholder: '#52525B',
  inputBg: 'rgba(0, 0, 0, 0.3)',
  inputBorder: 'rgba(255, 255, 255, 0.08)',
  btnBg: 'rgba(255, 255, 255, 0.04)',
  btnBorder: 'rgba(255, 255, 255, 0.08)',
  saveBtnBg: '#FFFFFF',
  saveBtnText: '#000000',
  switchThumb: '#000000',
  switchTrack: { false: 'rgba(255, 255, 255, 0.08)', true: '#FFFFFF' },
};

const lightTheme = {
  backdrop: 'rgba(0,0,0,0.3)',
  sheetBg: 'rgba(255, 255, 255, 0.85)',
  sheetBorder: 'rgba(0, 0, 0, 0.1)',
  text: '#09090B',
  placeholder: '#A1A1AA',
  inputBg: 'rgba(0, 0, 0, 0.03)',
  inputBorder: 'rgba(0, 0, 0, 0.08)',
  btnBg: 'rgba(0, 0, 0, 0.03)',
  btnBorder: 'rgba(0, 0, 0, 0.08)',
  saveBtnBg: '#09090B',
  saveBtnText: '#FFFFFF',
  switchThumb: '#FFFFFF',
  switchTrack: { false: 'rgba(0, 0, 0, 0.08)', true: '#000000' },
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  dismissArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  keyboardAvoid: { width: '100%', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  counterRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -12, marginBottom: 16 },
  counter: { fontSize: 12, color: '#71717A', fontWeight: '600' },
  counterLimit: { color: '#EF4444' },
  contentInput: { height: 90, fontSize: 15, textAlignVertical: 'top', borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  iconLabel: { fontSize: 13, fontWeight: '600' },
  btnGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { borderWidth: 1, width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveText: { fontWeight: '700', fontSize: 14 },
  periodContainer: { marginBottom: 16, width: '100%' },
  periodTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  periodScroll: { gap: 8, paddingBottom: 4 },
  periodChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  periodChipText: { fontSize: 12, fontWeight: '700' },
});