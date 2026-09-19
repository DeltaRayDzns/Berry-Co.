"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BuyBoxProps = {
  productId: string;
  sku?: string;
  stock?: number;
  name: string;
  price: string;
  originalPrice?: string;
  salePercentage?: number | null;
  status: "In Stock" | "Pre-orders Open" | "Out of Stock" | "Sold Out" | string;
  tag: string;
  preorderPeriod?: string;
  initialInWishlist?: boolean;
};

export default function ProductBuyBox({
  productId,
  sku,
  stock,
  name,
  price,
  originalPrice,
  salePercentage,
  status,
  tag,
  preorderPeriod,
  initialInWishlist = false,
}: BuyBoxProps) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistUpdating, setWishlistUpdating] = useState(false);

  const handleCartClick = async () => {
    if (isOutOfStock) return;

    setError(null);
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await response.json();
    if (response.status === 401) {
      router.push('/login');
      return;
    }
    if (!response.ok) {
      setError(data.error ?? 'Unable to add this item to your cart.');
      return;
    }
    setAdded(true);
    window.dispatchEvent(new CustomEvent('cart-updated'));
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlistToggle = async () => {
    if (wishlistUpdating) return;

    setError(null);
    setWishlistUpdating(true);

    try {
      const response = inWishlist
        ? await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' })
        : await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          });
      const data = await response.json();

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        setError(data.error ?? 'Unable to update your wishlist.');
        return;
      }

      const wasInWishlist = inWishlist;
      setInWishlist(!wasInWishlist);
      window.dispatchEvent(new CustomEvent('wishlist-updated', {
        detail: { delta: wasInWishlist ? -1 : 1 },
      }));
    } catch {
      setError('Unable to reach the wishlist service. Please try again.');
    } finally {
      setWishlistUpdating(false);
    }
  };

  // Status Helper Flags
  const isOutOfStock =
    status.toLowerCase().includes("out of stock") ||
    status.toLowerCase().includes("sold out");

  const isPreOrder = status.toLowerCase().includes("pre-order");
  const hasSale = Boolean(salePercentage && salePercentage > 0) && Boolean(originalPrice && originalPrice !== price);

  // Status Text Color Formatting
  const getStatusColor = () => {
    if (isOutOfStock) return "text-red-600";
    if (isPreOrder) return "text-brand";
    return "text-emerald-700"; // In Stock
  };

  return (
    <div className="relative rounded-4xl bg-[#F4ECE1] p-6 shadow-xs border border-dark/10 space-y-5">
      {isPreOrder && (
        <div className="absolute -top-3 left-4 z-10 rounded-full bg-[#d94b3d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-md">
          Pre-Order Sale
        </div>
      )}

      {/* SKU & Product Title */}
      <div className="text-right">
        {sku && (
          <p className="text-[11px] font-black uppercase tracking-wider text-dark/40 mb-1">
            SKU: {sku}
          </p>
        )}
        <h1 className="text-3xl font-black leading-tight tracking-tight text-dark sm:text-4xl">{name}</h1>
      </div>

      {/* Price, Status & Stock */}
      <div className="text-right space-y-0.5">
        {hasSale && originalPrice ? (
          <div className="space-y-1">
            <p className="text-xs font-bold text-dark/45 line-through">{originalPrice}</p>
            <p className="text-2xl font-black text-[#d94b3d]">{price}</p>
            {salePercentage ? (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d94b3d]">-{salePercentage}% OFF</p>
            ) : null}
          </div>
        ) : (
          <p className="text-2xl font-black text-dark">{price}</p>
        )}
        <p className={`text-xs font-bold ${getStatusColor()}`}>
          {status}
        </p>
        {typeof stock === "number" && (
          <p className="text-[11px] font-semibold text-dark/50">
            {stock > 0 ? `${stock} unit(s) available` : "0 units in stock"}
          </p>
        )}
      </div>

      {/* 📅 Pre-order Period Banner */}
      {isPreOrder && preorderPeriod && (
        <div className="rounded-2xl bg-cream p-3 text-center text-xs text-dark/80 border border-dark/5">
          <p className="font-extrabold uppercase text-[10px] tracking-wider text-dark/60">
            Pre-order Period
          </p>
          <p className="text-[11px] font-bold text-dark mt-0.5">
            {preorderPeriod}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-1">
        
        {/* Cart Button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleCartClick}
          className={`w-full rounded-full border py-3 text-xs font-extrabold transition-all shadow-xs ${
            isOutOfStock
              ? "border-dark/10 bg-dark/10 text-dark/40 cursor-not-allowed"
              : isPreOrder
                ? "border-[#d94b3d] bg-[#d94b3d] text-white hover:bg-[#b93a2f] active:scale-95 cursor-pointer"
                : "border-dark/30 bg-cream text-dark hover:bg-dark hover:text-white active:scale-95 cursor-pointer"
          }`}
        >
          {isOutOfStock
            ? "Out of Stock"
            : added
            ? "Added to Cart! ✓"
            : isPreOrder
            ? "Pre-Order Now"
            : "Add to Cart"}
        </button>

        {/* Wishlist / Restock Alert Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={wishlistUpdating}
          className={`w-full rounded-full border border-dark/30 py-3 text-xs font-extrabold transition-all active:scale-95 shadow-xs ${
            inWishlist
              ? "bg-brand text-white border-brand"
              : "bg-cream text-dark hover:bg-dark hover:text-white"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {wishlistUpdating
            ? "Updating..."
            : inWishlist
            ? "Remove from Wishlist"
            : isOutOfStock
            ? "Notify Me When Restocked 🔔"
            : "Add to Wishlist"}
        </button>
      </div>

      {error && <p className="text-right text-xs font-bold text-brand">{error}</p>}

    </div>
  );
}