import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';

const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    shippingAddress: {
      line1: user?.address?.line1 || '',
      line2: user?.address?.line2 || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || '',
    },
    paymentMethod: 'cash',
    tax: 0,
    shipping: 0,
    notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    fetchCart();
  }, [isAuthenticated, navigate]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data?.data);
    } catch (error) {
      setError(error.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('shippingAddress.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    const subtotal = cart.items.reduce((total, item) => {
      const price = item.product?.price || item.price || 0;
      return total + price * (item.quantity || 0);
    }, 0);
    return subtotal + Number(formData.tax) + Number(formData.shipping);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { data } = await api.post('/orders', formData);
      refreshCart(); // Clear cart count after order
      if (data?.data?._id) {
        navigate(`/orders/${data.data._id}`);
      } else {
        navigate('/orders');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading checkout...</p>
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
              <Button variant="primary" onClick={() => navigate('/shop')}>
                Continue Shopping
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  const subtotal = cart.items.reduce((total, item) => {
    const price = item.product?.price || item.price || 0;
    return total + price * (item.quantity || 0);
  }, 0);

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
                <Card.Title className="mb-0">Shipping Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col sm={12}>
                      <Form.Group controlId="line1">
                        <Form.Label>Address Line 1 *</Form.Label>
                        <Form.Control
                          name="shippingAddress.line1"
                          value={formData.shippingAddress.line1}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12}>
                      <Form.Group controlId="line2">
                        <Form.Label>Address Line 2</Form.Label>
                        <Form.Control
                          name="shippingAddress.line2"
                          value={formData.shippingAddress.line2}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="city">
                        <Form.Label>City *</Form.Label>
                        <Form.Control
                          name="shippingAddress.city"
                          value={formData.shippingAddress.city}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="state">
                        <Form.Label>State *</Form.Label>
                        <Form.Control
                          name="shippingAddress.state"
                          value={formData.shippingAddress.state}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="postalCode">
                        <Form.Label>Postal Code *</Form.Label>
                        <Form.Control
                          name="shippingAddress.postalCode"
                          value={formData.shippingAddress.postalCode}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="country">
                        <Form.Label>Country *</Form.Label>
                        <Form.Control
                          name="shippingAddress.country"
                          value={formData.shippingAddress.country}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="paymentMethod">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleChange}
                        >
                          <option value="cash">Cash on Delivery</option>
                          <option value="card">Credit/Debit Card</option>
                          <option value="paypal">PayPal</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="tax">
                        <Form.Label>Tax ($)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          name="tax"
                          value={formData.tax}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="shipping">
                        <Form.Label>Shipping ($)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          name="shipping"
                          value={formData.shipping}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12}>
                      <Form.Group controlId="notes">
                        <Form.Label>Order Notes</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="Any special instructions..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={4}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Header>
                <Card.Title className="mb-0">Order Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  {cart.items.map((item) => {
                    const product = item.product || {};
                    const price = product.price || item.price || 0;
                    const quantity = item.quantity || 0;
                    return (
                      <div key={item._id} className="d-flex justify-content-between mb-2">
                        <div>
                          <div>{product.name}</div>
                          <small className="text-muted">Qty: {quantity}</small>
                        </div>
                        <div>${(price * quantity).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax:</span>
                  <span>${Number(formData.tax).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Shipping:</span>
                  <span>${Number(formData.shipping).toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <strong>Total:</strong>
                  <strong className="h5">${calculateTotal().toFixed(2)}</strong>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

const CheckoutPageWithProtection = () => (
  <ProtectedRoute>
    <CheckoutPage />
  </ProtectedRoute>
);

export default CheckoutPageWithProtection;

