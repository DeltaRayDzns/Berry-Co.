type ProductGalleryProps = {
  name: string;
  imageUrl: string | null;
  images?: string[] | string | null;
};

function normalizeGalleryImages(value: string[] | string | null | undefined): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  const text = String(value).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry).trim()).filter(Boolean);
    }
  } catch {
    // Ignore malformed JSON and fall back to newline/comma parsing.
  }

  return text
    .split(/[\r\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function ProductGallery({ name, imageUrl, images }: ProductGalleryProps) {
  const gallery = normalizeGalleryImages(images).length > 0
    ? normalizeGalleryImages(images)
    : normalizeGalleryImages(imageUrl);

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-4xl bg-[#F4ECE1] border border-dark/10 p-6 text-center text-xs font-extrabold uppercase text-dark/40">
        No product image available
      </div>
    );
  }

  return (
    <div className={`grid w-full gap-4 ${gallery.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
      {gallery.map((url, index) => (
        <div
          key={index}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-4xl bg-[#F4ECE1] border border-dark/10 shadow-xs"
        >
          <img
            src={url}
            alt={`${name} - Angle ${index + 1}`}
            className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}