export default function customImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width?: number;
  quality?: number;
}) {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Si no hay width (ej. fill property sin sizes que define width fijo), proveemos un default razonable
    const w = width || 800;
    return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${w}&q=${quality || 75}&output=webp`;
  }
  return src;
}

