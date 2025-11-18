import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const CartPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/cart');
      setCart(data?.data);
    } catch (error) {
      setError(error.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdating(itemId);
    try {
      await api.put(`/cart/item/${itemId}`, { quantity: newQuantity });
      await fetchCart();
    } catch (error) {
      setError(error.message || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdating(itemId);
    try {
      await api.delete(`/cart/item/${itemId}`);
      await fetchCart();
    } catch (error) {
      setError(error.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      const price = item.product?.price || item.price || 0;
      const quantity = item.quantity || 0;
      return total + price * quantity;
    }, 0);
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading cart...</p>
          </div>
        </Container>
      </>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <Card>
            <Card.Body className="text-center py-5">
              <h5>Your cart is empty</h5>
              <p className="text-muted">Add some products to get started!</p>
              <Button variant="primary" onClick={() => navigate('/shop')}>
                Continue Shopping
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Row className="g-4">
          <Col xs={12} lg={8}>
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Shopping Cart</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.items.map((item) => {
                        const product = item.product || {};
                        const price = product.price || item.price || 0;
                        const quantity = item.quantity || 0;
                        const itemTotal = price * quantity;
                        const isUpdating = updating === item._id;

                        return (
                          <tr key={item._id}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                {product.images && product.images.length > 0 && (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div>
                                  <strong>{product.name || 'Product'}</strong>
                                  {product.sku && (
                                    <div className="text-muted small">SKU: {product.sku}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>${price.toFixed(2)}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled={isUpdating || quantity <= 1}
                                  onClick={() => handleUpdateQuantity(item._id, quantity - 1)}
                                >
                                  <FiMinus />
                                </Button>
                                <span>{quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateQuantity(item._id, quantity + 1)}
                                >
                                  <FiPlus />
                                </Button>
                              </div>
                            </td>
                            <td>${itemTotal.toFixed(2)}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                disabled={isUpdating}
                                onClick={() => handleRemoveItem(item._id)}
                                title="Remove"
                              >
                                <FiTrash2 />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={4}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Header>
                <Card.Title className="mb-0">Order Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <span>Subtotal:</span>
                  <strong>${calculateTotal().toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Shipping:</span>
                  <span>$0.00</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <strong>Total:</strong>
                  <strong className="h5">${calculateTotal().toFixed(2)}</strong>
                </div>
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/shop')}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

const CartPageWithProtection = () => (
  <ProtectedRoute>
    <CartPage />
  </ProtectedRoute>
);

export default CartPageWithProtection;

