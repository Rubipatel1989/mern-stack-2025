import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Container,
  Spinner,
  Table,
} from 'react-bootstrap';
import { FiEye, FiFileText } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const OrdersPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/orders', { params: { limit: 50 } });
      setOrders(data?.data || []);
    } catch (error) {
      setError(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading orders...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">
                {isAdmin ? 'All Orders' : 'My Orders'}
              </Card.Title>
              <Button variant="outline-primary" size="sm" onClick={fetchOrders}>
                Refresh
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {orders.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No orders found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      {isAdmin && <th>Customer</th>}
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        {isAdmin && (
                          <td>
                            {order.user?.name || order.user?.email || 'N/A'}
                          </td>
                        )}
                        <td>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td>{order.items?.length || 0}</td>
                        <td>${order.total?.toFixed(2) || '0.00'}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => navigate(`/orders/${order._id}`)}
                              title="View Details"
                            >
                              <FiEye />
                            </Button>
                            {order.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => navigate(`/invoices/${order._id}`)}
                                title="View Invoice"
                              >
                                <FiFileText />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

const OrdersPageWithProtection = () => (
  <ProtectedRoute>
    <OrdersPage />
  </ProtectedRoute>
);

export default OrdersPageWithProtection;

