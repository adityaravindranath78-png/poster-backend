export interface TemplateCanvas {
  width: number;
  height: number;
}

export interface BaseLayer {
  x: number;
  y: number;
  z: number;
  locked?: boolean;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  width: number;
  height: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  font: string;
  size: number;
  color: string;
  editable?: boolean;
}

export interface PlaceholderLayer extends BaseLayer {
  type: 'placeholder';
  key: 'user_photo' | 'user_name' | 'phone' | 'logo';
  font?: string;
  size?: number;
  color?: string;
  shape?: 'circle' | 'rectangle';
  radius?: number;
  width?: number;
  height?: number;
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  src: string;
  width: number;
  height: number;
}

export type Layer = ImageLayer | TextLayer | PlaceholderLayer | StickerLayer;

export interface Template {
  id: string;
  category: string;
  subcategory: string;
  language: string;
  tags: string[];
  premium: boolean;
  canvas: TemplateCanvas;
  layers: Layer[];
}

export interface TemplateMeta {
  id: string;
  category: string;
  subcategory: string;
  language: string;
  premium: boolean;
  tags: string[];
  schema_url: string;
  thumbnail_url: string;
  created_at: number;
  scheduled_date?: string;
}
