"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  sku: string;
  title: string;
  retailPrice: number;
  imageUrl: string;
  quantity: number;
}

type Cart = Record<string, CartItem>;

interface CartContextValue {
  cart: Cart;
  totalItems: number;
  isOpen: boolean;
  toggleSidebar: () => void;
  addToCart: (item: Omit<CartItem, "quantity">, qty: number) => void;
  incrementItem: (sku: string) => void;
  decrementItem: (sku: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "stackshop-cart";

function readCart(): Cart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Cart) : {};
  } catch {
    return {};
  }
}

function writeCart(cart: Cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const updateCart = useCallback((updater: (prev: Cart) => Cart) => {
    setCart((prev) => {
      const next = updater(prev);
      writeCart(next);
      return next;
    });
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity">, qty: number) => {
      updateCart((prev) => {
        const existing = prev[item.sku];
        return {
          ...prev,
          [item.sku]: {
            ...item,
            quantity: (existing?.quantity ?? 0) + qty,
          },
        };
      });
    },
    [updateCart]
  );

  const incrementItem = useCallback(
    (sku: string) => {
      updateCart((prev) => {
        if (!prev[sku]) return prev;
        return { ...prev, [sku]: { ...prev[sku], quantity: prev[sku].quantity + 1 } };
      });
    },
    [updateCart]
  );

  // Decrements quantity; removes the item entirely when quantity reaches 0
  const decrementItem = useCallback(
    (sku: string) => {
      updateCart((prev) => {
        if (!prev[sku]) return prev;
        if (prev[sku].quantity <= 1) {
          const { [sku]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [sku]: { ...prev[sku], quantity: prev[sku].quantity - 1 } };
      });
    },
    [updateCart]
  );

  const toggleSidebar = useCallback(() => setIsOpen((v) => !v), []);

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, totalItems, isOpen, toggleSidebar, addToCart, incrementItem, decrementItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
