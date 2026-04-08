import api from './api';
import {TemplateMeta, Template} from '../types/template';
import {PaginatedResponse, ApiResponse} from '../types/api';

export async function getTemplates(params: {
  category?: string;
  language?: string;
  limit?: number;
  nextKey?: string;
}): Promise<PaginatedResponse<TemplateMeta>> {
  const {data} = await api.get('/templates', {params});
  return data;
}

export async function getTemplateById(
  id: string,
): Promise<ApiResponse<TemplateMeta>> {
  const {data} = await api.get(`/templates/${id}`);
  return data;
}

export async function getTemplateSchema(schemaUrl: string): Promise<Template> {
  // Schema JSON is on CloudFront, fetch directly
  const response = await fetch(schemaUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch template schema: ${response.status}`);
  }
  return response.json();
}

export async function getDailyTemplates(
  language?: string,
): Promise<PaginatedResponse<TemplateMeta>> {
  const {data} = await api.get('/templates/daily', {
    params: {language},
  });
  return data;
}

export async function searchTemplates(
  query: string,
  limit = 20,
): Promise<PaginatedResponse<TemplateMeta>> {
  const {data} = await api.get('/templates/search', {
    params: {q: query, limit},
  });
  return data;
}
