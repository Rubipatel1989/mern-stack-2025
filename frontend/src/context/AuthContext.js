import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

import api, { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) {
      return { token: null, user: null };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: parsed.user || null,
    };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [{ token, user }, setAuthState] = useState(() => {
    const stored = getStoredAuth();
    if (stored.token) {
      setAuthToken(stored.token);
    }
    return stored;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const persistAuth = (nextState) => {
    setAuthState(nextState);
    if (nextState.token) {
      localStorage.setItem('auth', JSON.stringify(nextState));
      setAuthToken(nextState.token);
    } else {
      localStorage.removeItem('auth');
      setAuthToken(null);
    }
  };

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data } = await api.post('/auth/login', credentials);
      persistAuth({
        token: data?.data?.token,
        user: data?.data?.user,
      });
      
      // Merge guest cart after login
      const guestCartKey = 'guest_cart';
      const guestCart = localStorage.getItem(guestCartKey);
      if (guestCart) {
        try {
          const parsedCart = JSON.parse(guestCart);
          if (parsedCart.items && parsedCart.items.length > 0) {
            // Merge guest cart items to user cart
            for (const item of parsedCart.items) {
              try {
                await api.post('/cart/add', {
                  productId: item.productId || item.product?._id,
                  quantity: item.quantity || 1,
                });
              } catch (err) {
                console.warn('Failed to merge cart item:', err);
              }
            }
            // Clear guest cart after merge
            localStorage.removeItem(guestCartKey);
          }
        } catch (err) {
          console.warn('Failed to merge guest cart:', err);
        }
      }
      
      // Dispatch event to refresh cart count after merge
      window.dispatchEvent(new Event('cart:refresh'));
      
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout error', error.message);
    } finally {
      persistAuth({ token: null, user: null });
    }
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      authError,
      login,
      logout,
      setUser: (nextUser) => persistAuth({ token, user: nextUser }),
    }),
    [token, user, loading, authError, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

