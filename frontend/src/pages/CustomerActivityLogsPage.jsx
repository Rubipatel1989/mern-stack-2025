import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Container,
  Form,
  Row,
  Col,
  Spinner,
  Table,
  Alert,
} from 'react-bootstrap';
import { FiRefreshCw, FiFilter, FiX } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const CustomerActivityLogsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.userId) params.userId = filters.userId;
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const { data } = await api.get('/customer-activity-logs', { params });
      setLogs(data?.data || []);
      setPagination(data?.pagination || pagination);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const getActionBadge = (action) => {
    const colorMap = {
      login: 'success',
      logout: 'secondary',
      view_product: 'info',
      add_to_cart: 'primary',
      remove_from_cart: 'warning',
      update_cart: 'warning',
      place_order: 'success',
      view_order: 'info',
      view_orders: 'info',
      view_invoice: 'info',
      download_invoice: 'primary',
      reorder: 'primary',
      update_profile: 'secondary',
      add_address: 'success',
      update_address: 'warning',
      delete_address: 'danger',
      view_addresses: 'info',
      view_cart: 'info',
      checkout: 'primary',
      search_products: 'info',
      filter_products: 'info',
      view_product_details: 'info',
    };
    return <Badge bg={colorMap[action] || 'secondary'}>{action.replace(/_/g, ' ')}</Badge>;
  };

  const actionOptions = [
    'login',
    'logout',
    'view_product',
    'add_to_cart',
    'remove_from_cart',
    'update_cart',
    'place_order',
    'view_order',
    'view_orders',
    'view_invoice',
    'download_invoice',
    'reorder',
    'update_profile',
    'add_address',
    'update_address',
    'delete_address',
    'view_addresses',
    'view_cart',
    'checkout',
    'search_products',
    'filter_products',
    'view_product_details',
  ];

  if (loading && logs.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading activity logs...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">Customer Activity Logs</Card.Title>
              <Button variant="outline-primary" size="sm" onClick={fetchLogs}>
                <FiRefreshCw className="me-1" />
                Refresh
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Filters */}
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0" style={{ fontSize: '1rem' }}>
                    <FiFilter className="me-2" />
                    Filters
                  </Card.Title>
                  <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                    <FiX className="me-1" />
                    Clear
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Search</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search in description or path..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Action</Form.Label>
                      <Form.Select
                        value={filters.action}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                      >
                        <option value="">All Actions</option>
                        {actionOptions.map((action) => (
                          <option key={action} value={action}>
                            {action.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>User ID</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="User ID"
                        value={filters.userId}
                        onChange={(e) => handleFilterChange('userId', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Button variant="primary" onClick={handleApplyFilters}>
                      Apply Filters
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {logs.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No activity logs found.</p>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>
                    {pagination.total} {pagination.total === 1 ? 'Log' : 'Logs'} Found
                  </h6>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Description</th>
                        <th>Resource</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td>
                            {log.user ? (
                              <div>
                                <div>{log.user.name || log.user.email}</div>
                                <small className="text-muted">{log.user.email}</small>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{getActionBadge(log.action)}</td>
                          <td>{log.description || '-'}</td>
                          <td>
                            {log.resourceId ? (
                              <div>
                                <small className="text-muted">{log.resourceType || 'resource'}</small>
                                <div>{log.resourceId}</div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <small>{log.ipAddress || '-'}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === pagination.pages ||
                            (page >= pagination.page - 1 && page <= pagination.page + 1)
                        )
                        .map((page, idx, arr) => (
                          <div key={page} className="d-flex gap-1">
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-2">...</span>
                            )}
                            <Button
                              variant={pagination.page === page ? 'primary' : 'outline-primary'}
                              size="sm"
                              onClick={() => setPagination((prev) => ({ ...prev, page }))}
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

const CustomerActivityLogsPageWithProtection = () => (
  <ProtectedRoute roles={['admin', 'superadmin']}>
    <CustomerActivityLogsPage />
  </ProtectedRoute>
);

export default CustomerActivityLogsPageWithProtection;

