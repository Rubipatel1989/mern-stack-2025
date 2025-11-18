import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/client';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'guest_cart';

const getGuestCart = () => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : { items: [] };
  } catch {
    return { items: [] };
  }
};

const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save guest cart:', error);
  }
};

const getGuestCartCount = () => {
  const cart = getGuestCart();
  return cart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCartCount = async () => {
    if (!isAuthenticated) {
      // For guests, get count from localStorage
      const count = getGuestCartCount();
      setCartCount(count);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      const count = data?.data?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      setCartCount(count);
    } catch (error) {
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [isAuthenticated]);

  const refreshCart = () => {
    fetchCartCount();
  };

  const value = {
    cartCount,
    refreshCart,
    loading,
    getGuestCart,
    saveGuestCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

