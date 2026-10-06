// Perkecil gambar di browser sebelum diupload (maks sisi terpanjang 512px, JPEG).
export async function resizeImageToJpeg(file: File, maxSize = 512, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar.');

  // Latar putih supaya PNG transparan tidak menjadi hitam di JPEG
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses gambar.'))),
      'image/jpeg',
      quality
    );
  });
}