import React from 'react';
import { MMKV } from 'react-native-mmkv';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { NotesGridWidget } from '../widgets/NotesGridWidget';

export interface Note {
    id: string;
    title: string;
    content: string;
    isUrgent: boolean;
    updatedAt: number;
}

const NOTES_KEY = 'notesippy_user_notes';

// Safe fallback in-memory storage if MMKV is not available (e.g., in Expo Go, web, or debugger environments)
class InMemoryMMKV {
  private storage = new Map<string, string>();

  getString(key: string): string | undefined {
    return this.storage.get(key);
  }

  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clearAll(): void {
    this.storage.clear();
  }
}

const createStorage = () => {
  try {
    const MMKVLib = require('react-native-mmkv');
    if (MMKVLib && MMKVLib.MMKV) {
      return new MMKVLib.MMKV();
    }
  } catch (e) {
    console.warn('MMKV could not be initialized, using in-memory fallback:', e);
  }
  return new InMemoryMMKV() as unknown as MMKV;
};

// Instantiate MMKV storage safely
export const storage = createStorage();

/**
 * Read all notes synchronously from MMKV
 */
export function getNotes(): Note[] {
    const raw = storage.getString(NOTES_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Save or Update a note and immediately push updates to Android Widget
 */
export async function saveNote(note: Note): Promise<Note[]> {
    const notes = getNotes();

    // If the saved note is marked as urgent/live, make sure all other notes are not urgent
    if (note.isUrgent) {
        notes.forEach((n) => {
            if (n.id !== note.id) {
                n.isUrgent = false;
            }
        });
    }

    const existingIndex = notes.findIndex((n) => n.id === note.id);

    if (existingIndex >= 0) {
        notes[existingIndex] = note;
    } else {
        notes.unshift(note);
    }

    // Save to MMKV
    storage.set(NOTES_KEY, JSON.stringify(notes));

    // Trigger Android Widget Re-render
    await syncWidget(notes);

    return notes;
}

/**
 * Delete a note and refresh widget
 */
export async function deleteNote(id: string): Promise<Note[]> {
    // Clean up widget mappings for the deleted note
    const raw = storage.getString(WIDGET_MAP_KEY);
    if (raw) {
      try {
        const map = JSON.parse(raw) as Record<string, string>;
        let updated = false;
        for (const [widgetId, noteId] of Object.entries(map)) {
          if (noteId === id) {
            delete map[widgetId];
            updated = true;
          }
        }
        if (updated) {
          storage.set(WIDGET_MAP_KEY, JSON.stringify(map));
        }
      } catch (e) {
        console.warn('Failed to clean up widget mapping on delete:', e);
      }
    }

    const notes = getNotes().filter((n) => n.id !== id);
    storage.set(NOTES_KEY, JSON.stringify(notes));
    await syncWidget(notes);
    return notes;
}

/**
 * Triggers Android to re-draw the widget using latest note data
 */
export async function syncWidget(notes?: Note[]) {
    try {
        await requestWidgetUpdate({
            widgetName: 'NotesGridWidget',
            renderWidget: (props) => {
                const widgetId = props.widgetId;
                const note = getWidgetNote(widgetId);
                return <NotesGridWidget note={note} widgetId={widgetId} />;
            }
        });
    } catch (error) {
        console.warn('Widget update failed (Widget might not be placed on home screen):', error);
    }
}

const WIDGET_PINNED_KEY = 'notesippy_pinned_widget_note_id';
export const WIDGET_MAP_KEY = 'notesippy_widget_mappings';

/**
 * Get the note ID associated with a specific widget ID
 */
export function getWidgetNoteId(widgetId: number): string | null {
  const raw = storage.getString(WIDGET_MAP_KEY);
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[widgetId.toString()] || null;
  } catch {
    return null;
  }
}

/**
 * Set the note mapping for a specific widget ID
 */
export function setWidgetNoteMapping(widgetId: number, noteId: string) {
  const raw = storage.getString(WIDGET_MAP_KEY);
  let map: Record<string, string> = {};
  if (raw) {
    try {
      map = JSON.parse(raw);
    } catch {}
  }
  map[widgetId.toString()] = noteId;
  storage.set(WIDGET_MAP_KEY, JSON.stringify(map));
}

/**
 * Get the note selected for the widget (supports specific widgetId or global fallback)
 */
export function getWidgetNote(widgetId?: number): Note | null {
  const notes = getNotes();
  
  if (widgetId !== undefined) {
    const pinnedId = getWidgetNoteId(widgetId);
    if (pinnedId) {
      const found = notes.find((n) => n.id === pinnedId);
      if (found) return found;
    }
    return null;
  }

  const pinnedId = storage.getString(WIDGET_PINNED_KEY);
  if (pinnedId) {
    const found = notes.find((n) => n.id === pinnedId);
    if (found) return found;
  }

  // Fallback to the first note if none pinned
  return notes.length > 0 ? notes[0] : null;
}

/**
 * Pin a specific note to the Home Screen Widget (legacy global support)
 */
export async function pinNoteToWidget(noteId: string) {
  storage.set(WIDGET_PINNED_KEY, noteId);
  await syncWidget();
}