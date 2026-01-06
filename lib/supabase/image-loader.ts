const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export function supabaseImageLoader({ src, width, quality = 75 }: ImageLoaderParams): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    if (src.includes('.supabase.co/storage/')) {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}width=${width}&quality=${quality}`;
    }
    return src;
  }

  if (!src || src === 'undefined' || src === 'null') {
    return '/images/placeholder-product.png';
  }

  return `${SUPABASE_URL}/storage/v1/render/image/public/product-images/${src}?width=${width}&quality=${quality}`;
}

export function getPublicUrl(storagePath: string): string {
  if (!storagePath) {
    return '/images/placeholder-product.png';
  }
  
  if (storagePath.startsWith('http')) {
    return storagePath;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`;
}

export function getTransformedUrl(
  storagePath: string,
  options: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {}
): string {
  if (!storagePath) {
    return '/images/placeholder-product.png';
  }

  if (storagePath.startsWith('http')) {
    return storagePath;
  }

  const { width = 800, height, quality = 75, resize = 'cover' } = options;
  
  let url = `${SUPABASE_URL}/storage/v1/render/image/public/product-images/${storagePath}?width=${width}&quality=${quality}&resize=${resize}`;
  
  if (height) {
    url += `&height=${height}`;
  }

  return url;
}

export function generateSrcSet(storagePath: string, widths: number[] = [320, 640, 960, 1280]): string {
  if (!storagePath || storagePath.startsWith('http')) {
    return '';
  }

  return widths
    .map((w) => `${getTransformedUrl(storagePath, { width: w })} ${w}w`)
    .join(', ');
}

export default supabaseImageLoader;
