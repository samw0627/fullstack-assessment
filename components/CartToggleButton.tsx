"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

export default function CartToggleButton() {
  const { totalItems, toggleSidebar } = useCart();

  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-4 right-4 z-30 flex items-center gap-2 bg-background border rounded-full px-3 py-2 shadow-md hover:shadow-lg transition-shadow"
      aria-label="Toggle cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
