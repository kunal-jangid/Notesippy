"use no memo";

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Appearance } from 'react-native';
import { Note } from '../services/notesStore';

interface NotesGridWidgetProps {
  note?: Note | null;
  widgetId: number;
}

export function NotesGridWidget({ note, widgetId }: NotesGridWidgetProps) {
  const isDark = Appearance.getColorScheme() === 'dark';
  const bgColor = isDark ? '#09090B' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subColor = isDark ? '#A1A1AA' : '#52525B';
  const labelColor = isDark ? '#71717A' : '#71717A';

  if (!note) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: isDark ? '#000000' : '#F4F4F5',
          borderRadius: 20,
          padding: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: `notesippy://widget-select?widgetId=${widgetId}` }}
      >
        <TextWidget text="Notesippy" style={{ color: textColor, fontSize: 16, fontWeight: 'bold' }} />
        <TextWidget text="Tap to select a note" style={{ color: labelColor, fontSize: 12, marginTop: 6 }} />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: bgColor,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'column',
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: `notesippy://note/${note.id}?widgetId=${widgetId}` }}
    >
      <TextWidget
        text={note.title}
        style={{ color: textColor, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}
      />
      <TextWidget
        text={note.content || 'Empty note...'}
        style={{
          color: subColor,
          fontSize: 13,
        }}
      />
    </FlexWidget>
  );
}