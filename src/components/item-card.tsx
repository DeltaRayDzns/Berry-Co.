import Link from "next/link";

export interface Item {
  id?: string | number;
  company?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  price?: string | number;
  originalPrice?: string | number;
  salePrice?: string | number;
  salePercentage?: number | null;
  imageUrl?: string;
  href?: string;
  tags?: string[];
  category?: string;
  status?: string;
}

export interface ItemCardProps {
  item: Item;
  className?: string;
}

export default function ItemCard({ item, className = "" }: ItemCardProps) {
  const {
    id,
    company,
    name = "Item Name",
    shortDescription,
    price = "₱0",
    originalPrice,
    salePrice,
    salePercentage,
    imageUrl,
    href,
    tags = [],
    status,
  } = item;

  const safeName = name?.trim() || "Item Name";
  const isSaleTagged = (tags ?? []).some((tag) => String(tag).toLowerCase().includes('sale') || String(tag).toLowerCase().includes('discount'));
  const hasSale = isSaleTagged && (Boolean(salePercentage && salePercentage > 0) || Boolean(salePrice && salePrice !== price));
  const displayPrice = hasSale ? (salePrice ?? price) : price;
  const displayOriginalPrice = hasSale ? (originalPrice ?? null) : null;
  // Strictly checks shortDescription ONLY. If missing, renders nothing.
  const cardText = shortDescription?.trim();
  const targetHref = href ?? (id !== undefined ? `/products/${id}` : undefined);
  
  const isOutOfStock = status === "out_of_stock";

  const content = (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-dark/15 bg-paper shadow-xs transition-all duration-200 ${
        targetHref ? "hover:-translate-y-1 hover:shadow-md cursor-pointer" : ""
      } ${className}`.trim()}
    >
      {/* Main Image Wrapper */}
      <div className="relative flex h-52 w-full shrink-0 items-center justify-center bg-cream text-xs font-bold text-dark/30 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          "Image Placeholder"
        )}

        {/* Tags Overlay */}
        {tags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5 pointer-events-none">
            {tags.map((tag) => {
              const normalizedTag = tag.toLowerCase();
              const isPreOrderTag = normalizedTag.includes('pre-order');
              const isSaleTag = normalizedTag.includes('sale') || normalizedTag.includes('discount');
              return (
                <span
                  key={tag}
                  className={
                    isSaleTag || isPreOrderTag
                      ? 'rounded-full bg-[#d94b3d] px-2.5 py-0.5 text-[10px] font-black tracking-wide text-white shadow-xs'
                      : 'rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs'
                  }
                >
                  {isSaleTag ? 'Sale' : isPreOrderTag ? 'Pre-Order' : tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-red-600 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Item Info Wrapper */}
      <div className="flex flex-1 flex-col justify-between p-3 text-xs font-semibold text-dark">
        {/* Top Content: Company, Title, Teaser */}
        <div className="space-y-1">
          {company && <p className="font-bold text-dark/80">{company}</p>}
          <p className="line-clamp-2 text-sm font-black leading-snug text-dark group-hover:text-brand transition-colors">
            {safeName}
          </p>

          {/* Rendered ONLY if shortDescription is explicitly populated */}
          {cardText && (
            <p className="line-clamp-2 text-[11px] font-semibold leading-relaxed text-dark/70">
              {cardText}
            </p>
          )}
        </div>

        {/* Bottom Content: Price pinned to bottom */}
        <div className="mt-3 pt-1">
          {hasSale && displayOriginalPrice ? (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-dark/45 line-through">{String(displayOriginalPrice)}</p>
              <p className="text-sm font-extrabold text-[#d94b3d]">{String(displayPrice)}</p>
            </div>
          ) : (
            <p className="text-sm font-extrabold text-brand">{String(displayPrice)}</p>
          )}
        </div>
      </div>
    </article>
  );

  if (targetHref) {
    return (
      <Link href={targetHref} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}