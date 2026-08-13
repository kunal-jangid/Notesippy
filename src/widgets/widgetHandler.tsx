"use no memo";

import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { NotesGridWidget } from './NotesGridWidget';
import { getWidgetNote } from '../services/notesStore';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetId = props.widgetInfo.widgetId;
  const note = getWidgetNote(widgetId);
  props.renderWidget(<NotesGridWidget note={note} widgetId={widgetId} />);
}