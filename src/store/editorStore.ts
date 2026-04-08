import {create} from 'zustand';
import {Template, Layer} from '../types/template';

interface EditorState {
  template: Template | null;
  selectedLayerIndex: number | null;
  history: Template[];
  historyIndex: number;
  isDirty: boolean;

  loadTemplate: (template: Template) => void;
  updateLayer: (index: number, updates: Partial<Layer>) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (index: number) => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;
  selectLayer: (index: number | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  template: null,
  selectedLayerIndex: null,
  history: [],
  historyIndex: -1,
  isDirty: false,

  loadTemplate: (template) => {
    set({
      template,
      history: [template],
      historyIndex: 0,
      selectedLayerIndex: null,
      isDirty: false,
    });
  },

  updateLayer: (index, updates) => {
    const {template, history, historyIndex} = get();
    if (!template) {
      return;
    }
    const newLayers = [...template.layers];
    newLayers[index] = {...newLayers[index], ...updates} as Layer;
    const newTemplate = {...template, layers: newLayers};
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    set({
      template: newTemplate,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isDirty: true,
    });
  },

  addLayer: (layer) => {
    const {template, history, historyIndex} = get();
    if (!template) {
      return;
    }
    const newTemplate = {
      ...template,
      layers: [...template.layers, layer],
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    set({
      template: newTemplate,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isDirty: true,
    });
  },

  removeLayer: (index) => {
    const {template, history, historyIndex} = get();
    if (!template) {
      return;
    }
    const newLayers = template.layers.filter((_, i) => i !== index);
    const newTemplate = {...template, layers: newLayers};
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    set({
      template: newTemplate,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedLayerIndex: null,
      isDirty: true,
    });
  },

  reorderLayer: (fromIndex, toIndex) => {
    const {template, history, historyIndex} = get();
    if (!template) {
      return;
    }
    const newLayers = [...template.layers];
    const [moved] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, moved);
    // Update z-index to match new order
    const reindexed = newLayers.map((l, i) => ({...l, z: i}));
    const newTemplate = {...template, layers: reindexed as Layer[]};
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    set({
      template: newTemplate,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isDirty: true,
    });
  },

  selectLayer: (index) => set({selectedLayerIndex: index}),

  undo: () => {
    const {history, historyIndex} = get();
    if (historyIndex <= 0) {
      return;
    }
    const newIndex = historyIndex - 1;
    set({
      template: history[newIndex],
      historyIndex: newIndex,
      isDirty: newIndex > 0,
    });
  },

  redo: () => {
    const {history, historyIndex} = get();
    if (historyIndex >= history.length - 1) {
      return;
    }
    const newIndex = historyIndex + 1;
    set({
      template: history[newIndex],
      historyIndex: newIndex,
      isDirty: true,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  reset: () =>
    set({
      template: null,
      selectedLayerIndex: null,
      history: [],
      historyIndex: -1,
      isDirty: false,
    }),
}));
