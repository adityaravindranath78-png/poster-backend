import {create} from 'zustand';
import {TemplateMeta, Template} from '../types/template';

interface TemplateState {
  templates: TemplateMeta[];
  dailyTemplates: TemplateMeta[];
  trendingTemplates: TemplateMeta[];
  currentTemplate: Template | null;
  selectedCategory: string | null;
  selectedLanguage: string;
  isLoading: boolean;
  error: string | null;
  nextKey: string | undefined;

  setTemplates: (templates: TemplateMeta[]) => void;
  appendTemplates: (templates: TemplateMeta[]) => void;
  setDailyTemplates: (templates: TemplateMeta[]) => void;
  setTrendingTemplates: (templates: TemplateMeta[]) => void;
  setCurrentTemplate: (template: Template | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedLanguage: (language: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNextKey: (key: string | undefined) => void;
  clearTemplates: () => void;
}

export const useTemplateStore = create<TemplateState>()((set) => ({
  templates: [],
  dailyTemplates: [],
  trendingTemplates: [],
  currentTemplate: null,
  selectedCategory: null,
  selectedLanguage: 'hi',
  isLoading: false,
  error: null,
  nextKey: undefined,

  setTemplates: (templates) => set({templates}),
  appendTemplates: (newTemplates) =>
    set((state) => ({templates: [...state.templates, ...newTemplates]})),
  setDailyTemplates: (dailyTemplates) => set({dailyTemplates}),
  setTrendingTemplates: (trendingTemplates) => set({trendingTemplates}),
  setCurrentTemplate: (currentTemplate) => set({currentTemplate}),
  setSelectedCategory: (selectedCategory) => set({selectedCategory}),
  setSelectedLanguage: (selectedLanguage) => set({selectedLanguage}),
  setLoading: (isLoading) => set({isLoading}),
  setError: (error) => set({error}),
  setNextKey: (nextKey) => set({nextKey}),
  clearTemplates: () =>
    set({templates: [], nextKey: undefined, error: null}),
}));
