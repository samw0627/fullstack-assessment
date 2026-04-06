"use client";

import { CartProvider } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";
import CartToggleButton from "@/components/CartToggleButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartToggleButton />
      <CartSidebar />
    </CartProvider>
  );
}
