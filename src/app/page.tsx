import SearchBar from "@/components/searchbar";
import Hero from "@/components/ui/hero";
import ItemCard from "@/components/item-card";
import { getProducts } from "@/lib/data/data-products";

export default async function HomePage() {
  const { products } = await getProducts({ page: 1, pageSize: 500 });

  const priorityMap: Record<string, number> = {
    featured: 0,
    popular: 1,
    new: 2,
    limited: 3,
    'pre-order': 4,
    sale: 5,
  };

  const getPriority = (tags: Array<string | null | undefined>) => {
    const normalized = (tags ?? [])
      .map((tag) => String(tag ?? '').trim().toLowerCase().replace(/\s+/g, '-'))
      .filter(Boolean);

    if (normalized.length === 0) return 999;

    const priorities = normalized.map((tag) => {
      if (tag.includes('featured')) return priorityMap.featured;
      if (tag.includes('popular')) return priorityMap.popular;
      if (tag.includes('new')) return priorityMap.new;
      if (tag.includes('limited')) return priorityMap.limited;
      if (tag.includes('pre-order')) return priorityMap['pre-order'];
      if (tag.includes('sale')) return priorityMap.sale;
      return 999;
    });

    return Math.min(...priorities);
  };

  const hasSaleTag = (tags?: string[] | null) =>
    (tags ?? []).some((tag) => {
      const value = String(tag ?? '').trim().toLowerCase();
      return value.includes('sale') || value.includes('discount');
    });

  const featuredProducts = products
    .filter((item) => {
      const itemTags = (item.tags ?? []).map((tag) => String(tag).trim().toLowerCase());
      const matches = itemTags.some((tag) => {
        const normalized = tag.replace(/\s+/g, '-');
        return priorityMap[normalized] !== undefined || Object.keys(priorityMap).some((key) => normalized.includes(key));
      });
      return matches || (hasSaleTag(item.tags) && Number(item.sale_percentage ?? 0) > 0);
    })
    .sort((a, b) => getPriority(a.tags ?? []) - getPriority(b.tags ?? []))
    .slice(0, 12)
    .map((item) => {
      const basePrice = Number(item.price);
      const salePercentage = Number(item.sale_percentage ?? 0);
      const hasSale = hasSaleTag(item.tags) && salePercentage > 0;
      const salePrice = hasSale ? basePrice * (1 - salePercentage / 100) : basePrice;
      const displayPrice = `₱${Number(salePrice).toLocaleString('en-PH')}`;
      const displayOriginalPrice = hasSale ? `₱${Number(basePrice).toLocaleString('en-PH')}` : null;

      return {
        ...item,
        displayPrice,
        displayOriginalPrice,
        salePrice: displayPrice,
        originalPrice: displayOriginalPrice ?? undefined,
        salePercentage: hasSale ? salePercentage : null,
      };
    });

  return (
    <div className="flex-1 flex flex-col">
      <Hero />
      <SearchBar />

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 pb-12">
        <div className="bg-[#faf5eb] rounded-t-[3rem] p-8 shadow-sm min-h-125 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
              Featured Products
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {featuredProducts.map((item) => (
                  <ItemCard
                  key={item.id}
                  item={{
                        id: item.id,
                        company: item.brand_name ?? "Berry Co.",
                        name: item.name,
                        description: item.description ?? undefined,
                        shortDescription: item.short_description ?? undefined,
                        price: item.displayOriginalPrice ?? item.displayPrice,
                        originalPrice: item.displayOriginalPrice ?? undefined,
                        salePrice: item.displayPrice,
                        salePercentage: item.salePercentage ?? null,
                        imageUrl: item.image_url ?? undefined,
                        category: item.category_name ?? undefined,
                        status: item.status,
                        tags: item.tags ?? [],
                      }}
                  />
                ))}
              </div>

            {featuredProducts.length === 0 && (
              <p className="py-12 text-center text-sm font-semibold text-dark/60">
                No featured products are available yet.
              </p>
            )}
          </div>

          <hr className="border-gray-400 mt-12 w-full" />
        </div>
      </div>
    </div>
  );
}