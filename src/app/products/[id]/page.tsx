import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/products/product-gallery";
import ProductAccordions from "@/components/products/product-accordion";
import ProductBuyBox from "@/components/products/product-buy-box";
import { getProductById } from "@/lib/data/data-products";
import { getProductReviews } from "@/lib/data/reviews";
import { isProductWishlisted } from "@/lib/wishlist-service";
import { getSession } from "@/lib/session";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  const session = await getSession();
  const reviews = await getProductReviews(product.id);
  const initialInWishlist = session ? await isProductWishlisted(session.userId, product.id) : false;

  const hasPreOrderDates = Boolean(product.preorder_start_date || product.preorder_end_date)
  const hasPreOrderTag = (product.tags ?? []).some((tag) => tag.toLowerCase().includes('pre-order'))
  const isPreOrderProduct = hasPreOrderDates || hasPreOrderTag

  const formatPreOrderPeriod = () => {
    if (!product.preorder_start_date && !product.preorder_end_date) {
      return 'Pre-order window now open.'
    }

    const formatDate = (value: string | null) => {
      if (!value) return 'TBD'
      return new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }

    const start = formatDate(product.preorder_start_date)
    const end = formatDate(product.preorder_end_date)
    return start === end ? `${start}` : `${start} – ${end}`
  }

  const basePrice = Number(product.price)
  const salePercentage = Number(product.sale_percentage ?? 0)
  const isSaleTagged = (product.tags ?? []).some((tag) => tag.toLowerCase().includes('sale') || tag.toLowerCase().includes('discount'))
  const hasSale = isSaleTagged && salePercentage > 0
  const salePrice = hasSale ? basePrice * (1 - salePercentage / 100) : basePrice
  const status = isPreOrderProduct ? 'Pre-orders Open' : product.status === 'out_of_stock' ? 'Out of Stock' : 'In Stock';
  const productDescription =
    product.description?.trim() ||
    `${product.name} is part of the Berry Co. collection and brings premium detail, collectible quality, and standout design to fans and collectors alike.`;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8 text-dark">
      <div className="mx-auto max-w-6xl">
        
        {/* Breadcrumb Hierarchy: Products > Category > Brand > Series > Item */}
        <div className="breadcrumbs mb-4 text-xs font-bold text-dark/60">
          <ul>
            <li>
              <Link href="/products" className="hover:text-brand transition-colors">
                Products
              </Link>
            </li>
            <li>
              <Link
                href={`/products?category=${encodeURIComponent(product.category_name ?? '')}`}
                className="hover:text-brand transition-colors"
              >
                {product.category_name ?? 'Uncategorized'}
              </Link>
            </li>
            <li>
              <Link
                href={`/products?category=${encodeURIComponent(product.subcategory_name ?? '')}`}
                className="hover:text-brand transition-colors"
              >
                {product.subcategory_name ?? 'Product'}
              </Link>
            </li>
            <li>
              <Link
                href={`/products?search=${encodeURIComponent(product.sku)}`}
                className="hover:text-brand transition-colors"
              >
                {product.sku}
              </Link>
            </li>
            {/* Current Active Item */}
            <li className="font-black text-dark">
              {product.name}
            </li>
          </ul>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* 1️⃣ Gallery Section (Mobile: 1st | Desktop: Top-Left) */}
          <div className="lg:col-span-8 lg:col-start-1 lg:row-start-1">
            <ProductGallery
            name={product.name}
            imageUrl={product.image_url}
            images={product.image_urls}
            />
          </div>

          {/* 2️⃣ Sticky Buy Box Panel (Mobile: 2nd | Desktop: Top-Right) */}
          <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
            <ProductBuyBox
              productId={product.id}
              sku={product.sku}
              stock={product.stock}
              name={product.name}
              price={`₱${Number(salePrice).toLocaleString('en-PH')}`}
              originalPrice={hasSale ? `₱${Number(basePrice).toLocaleString('en-PH')}` : undefined}
              salePercentage={hasSale ? salePercentage : null}
              status={status}
              tag={isPreOrderProduct ? 'Pre-Order' : product.category_name ?? 'Berry Co.'}
              preorderPeriod={formatPreOrderPeriod()}
              initialInWishlist={initialInWishlist}
            />
          </div>

          {/* 3️⃣ Accordions Card (Mobile: 3rd | Desktop: Bottom-Left) */}
          <div className="lg:col-span-8 lg:col-start-1 lg:row-start-2 rounded-4xl bg-[#F4ECE1] p-6 shadow-xs border border-dark/10">
            <ProductAccordions
              productId={product.id}
              canReview={Boolean(session)}
              reviews={reviews}
              description={productDescription}
              seriesName={product.series?.name ?? product.series_name}
              brandName={product.brand?.name ?? product.brand_name}
              categoryName={product.category?.name ?? product.category_name}
              specifications={product.specifications}
            />
          </div>

        </div>

      </div>
    </main>
  );
}