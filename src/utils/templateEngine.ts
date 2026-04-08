import {Template, Layer, TextLayer, ImageLayer} from '../types/template';
import {UserProfile} from '../types/user';

/**
 * Takes a template JSON and user profile, replaces placeholder layers
 * with actual user data. Returns a new template with placeholders filled.
 */
export function fillTemplate(
  template: Template,
  profile: UserProfile,
): Template {
  const filled: Template = {
    ...template,
    layers: template.layers.map(layer => fillLayer(layer, profile)),
  };
  return filled;
}

function fillLayer(layer: Layer, profile: UserProfile): Layer {
  if (layer.type !== 'placeholder') {
    return layer;
  }

  switch (layer.key) {
    case 'user_name':
      return placeholderToText(layer, profile.name || 'Your Name');

    case 'user_photo':
      return placeholderToImage(layer, profile.photoUrl || '');

    case 'phone':
      return placeholderToText(layer, profile.phone || '');

    case 'logo':
      return placeholderToImage(layer, profile.logoUrl || '');

    default:
      return layer;
  }
}

function placeholderToText(
  layer: Layer & {type: 'placeholder'},
  content: string,
): TextLayer {
  return {
    type: 'text',
    content,
    font: layer.font || 'Poppins-Regular',
    size: layer.size || 24,
    color: layer.color || '#FFFFFF',
    x: layer.x,
    y: layer.y,
    z: layer.z,
    editable: true,
  };
}

function placeholderToImage(
  layer: Layer & {type: 'placeholder'},
  src: string,
): ImageLayer {
  const size = layer.radius ? layer.radius * 2 : layer.width || 200;
  return {
    type: 'image',
    src,
    x: layer.x,
    y: layer.y,
    z: layer.z,
    width: layer.width || size,
    height: layer.height || size,
  };
}

/**
 * Sorts layers by z-index for correct rendering order.
 */
export function sortLayers(layers: Layer[]): Layer[] {
  return [...layers].sort((a, b) => a.z - b.z);
}

/**
 * Checks if a template has unfilled placeholders.
 */
export function hasUnfilledPlaceholders(template: Template): boolean {
  return template.layers.some(layer => layer.type === 'placeholder');
}
