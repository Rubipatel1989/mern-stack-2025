import { useEffect, useState, useCallback } from 'react';
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
  ProgressBar,
  Tabs,
  Tab,
} from 'react-bootstrap';
import { FiRefreshCw, FiFilter, FiX, FiUser, FiCalendar, FiTrendingUp, FiList, FiClock } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const CustomerActivityLogsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
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
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isAdmin && isAuthenticated) {
      fetchLogs();
      if (filters.userId) {
        fetchStatistics();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await api.get('/users');
      const allUsers = data?.data || [];
      
      // Filter only customers - check multiple possible role structures
      const customerList = allUsers.filter((u) => {
        // Handle different role structures
        let roleName = '';
        if (u.role) {
          if (typeof u.role === 'string') {
            roleName = u.role;
          } else if (u.role.name) {
            roleName = u.role.name;
          } else if (u.role.roleName) {
            roleName = u.role.roleName;
          }
        }
        const roleNameLower = roleName.toLowerCase().trim();
        return roleNameLower === 'customer';
      });
      
      // Remove duplicates by _id
      const uniqueCustomers = customerList.reduce((acc, customer) => {
        const existing = acc.find(c => c._id === customer._id);
        if (!existing) {
          acc.push(customer);
        }
        return acc;
      }, []);
      
      // If no customers found, log for debugging
      if (customerList.length === 0 && allUsers.length > 0) {
        console.log('No customers found. Available users and their roles:', allUsers.map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          roleName: u.role?.name,
          roleType: typeof u.role
        })));
      }
      
      setCustomers(uniqueCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setError('Failed to load customers. Please refresh the page.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchLogs = useCallback(async () => {
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
      setPagination((prev) => ({
        ...prev,
        ...data?.pagination,
      }));
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchStatistics = async () => {
    if (!filters.userId) return;
    
    setLoadingStats(true);
    try {
      const params = {};
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await api.get('/customer-activity-logs/statistics', { params });
      setStatistics(data?.data || null);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    
    // Update selected customer when userId changes
    if (name === 'userId') {
      const customer = customers.find((c) => c._id === value || c.email === value);
      setSelectedCustomer(customer || null);
    }
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    setSelectedCustomer(customer || null);
    setFilters((prev) => ({ ...prev, userId: customerId || '' }));
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
    setSelectedCustomer(null);
    setStatistics(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = async () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    await fetchLogs();
    if (filters.userId) {
      await fetchStatistics();
    } else {
      setStatistics(null);
    }
  };

  // Auto-apply filters when customer or dates change
  useEffect(() => {
    if (filters.userId || filters.startDate || filters.endDate || filters.action) {
      const timeoutId = setTimeout(() => {
        fetchLogs();
        if (filters.userId) {
          fetchStatistics();
        } else {
          setStatistics(null);
        }
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.userId, filters.startDate, filters.endDate, filters.action]);

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
            {/* Customer Selection & Statistics */}
            {selectedCustomer && (
              <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                  <div className="d-flex align-items-center">
                    <FiUser className="me-2" />
                    <strong>
                      {selectedCustomer.name || selectedCustomer.email}
                      {selectedCustomer.email && selectedCustomer.name && (
                        <small className="ms-2 opacity-75">({selectedCustomer.email})</small>
                      )}
                    </strong>
                  </div>
                </Card.Header>
                <Card.Body>
                  {loadingStats ? (
                    <div className="text-center py-3">
                      <Spinner size="sm" /> Loading statistics...
                    </div>
                  ) : statistics ? (
                    <Row>
                      <Col md={3}>
                        <div className="text-center p-3 bg-light rounded">
                          <div className="h4 mb-0 text-primary">{statistics.totalLogs || 0}</div>
                          <small className="text-muted">Total Activities</small>
                        </div>
                      </Col>
                      <Col md={9}>
                        <div className="mb-2">
                          <small className="text-muted d-block mb-2">
                            <FiTrendingUp className="me-1" />
                            Activity Breakdown
                          </small>
                          {statistics.statistics && statistics.statistics.length > 0 ? (
                            statistics.statistics.map((stat) => (
                              <div key={stat._id} className="mb-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="text-capitalize">{stat._id.replace(/_/g, ' ')}</span>
                                  <Badge bg="primary">{stat.count}</Badge>
                                </div>
                                <ProgressBar
                                  now={(stat.count / statistics.totalLogs) * 100}
                                  variant="primary"
                                  style={{ height: '8px' }}
                                />
                              </div>
                            ))
                          ) : (
                            <p className="text-muted mb-0">No activity data available</p>
                          )}
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    <p className="text-muted mb-0">Select date range to see statistics</p>
                  )}
                </Card.Body>
              </Card>
            )}

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
                    Clear All
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        <FiUser className="me-1" />
                        Select Customer
                      </Form.Label>
                      {loadingCustomers ? (
                        <Form.Control as="div">
                          <Spinner size="sm" className="me-2" />
                          Loading customers...
                        </Form.Control>
                      ) : customers.length === 0 ? (
                        <div>
                          <Form.Select disabled>
                            <option>No customers found</option>
                          </Form.Select>
                          <Form.Text className="text-muted">
                            No customers available. Make sure there are users with "customer" role in the system.
                          </Form.Text>
                        </div>
                      ) : (
                        <Form.Select
                          value={filters.userId}
                          onChange={(e) => handleCustomerChange(e.target.value)}
                        >
                          <option value="">All Customers</option>
                          {customers.map((customer) => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name || customer.email} ({customer.email})
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      {selectedCustomer && (
                        <Form.Text className="text-muted">
                          Showing activities for: <strong>{selectedCustomer.name || selectedCustomer.email}</strong>
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>
                        <FiCalendar className="me-1" />
                        Start Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>
                        <FiCalendar className="me-1" />
                        End Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        min={filters.startDate || undefined}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <div className="d-flex gap-2 flex-wrap">
                      <small className="text-muted align-self-center me-2">Quick Filters:</small>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
                          const endOfToday = new Date().toISOString().split('T')[0];
                          setFilters((prev) => ({ ...prev, startDate: startOfToday, endDate: endOfToday }));
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                          startOfWeek.setHours(0, 0, 0, 0);
                          const endOfWeek = new Date();
                          setFilters((prev) => ({
                            ...prev,
                            startDate: startOfWeek.toISOString().split('T')[0],
                            endDate: endOfWeek.toISOString().split('T')[0],
                          }));
                        }}
                      >
                        This Week
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                          const endOfMonth = new Date();
                          setFilters((prev) => ({
                            ...prev,
                            startDate: startOfMonth.toISOString().split('T')[0],
                            endDate: endOfMonth.toISOString().split('T')[0],
                          }));
                        }}
                      >
                        This Month
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const today = new Date();
                          const last30Days = new Date(today.setDate(today.getDate() - 30));
                          const todayDate = new Date();
                          setFilters((prev) => ({
                            ...prev,
                            startDate: last30Days.toISOString().split('T')[0],
                            endDate: todayDate.toISOString().split('T')[0],
                          }));
                        }}
                      >
                        Last 30 Days
                      </Button>
                    </div>
                  </Col>
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
                      <Form.Label>Action Type</Form.Label>
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
                  <Col xs={12}>
                    <div className="d-flex gap-2">
                      <Button variant="primary" onClick={handleApplyFilters}>
                        Apply Filters
                      </Button>
                      {(filters.userId || filters.startDate || filters.endDate || filters.action || filters.search) && (
                        <Button variant="outline-secondary" onClick={handleClearFilters}>
                          <FiX className="me-1" />
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {!filters.userId && logs.length === 0 ? (
              <Alert variant="info" className="text-center">
                <FiUser className="me-2" />
                <strong>Select a customer</strong> from the dropdown above to view their activity logs.
                <br />
                <small>You can also filter by date range to see activities for a specific period.</small>
              </Alert>
            ) : logs.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">
                  {selectedCustomer
                    ? `No activity logs found for ${selectedCustomer.name || selectedCustomer.email}${filters.startDate || filters.endDate ? ' in the selected date range' : ''}.`
                    : 'No activity logs found.'}
                </p>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-0">
                      {pagination.total} {pagination.total === 1 ? 'Activity' : 'Activities'} Found
                      {selectedCustomer && (
                        <span className="text-muted ms-2">
                          for <strong>{selectedCustomer.name || selectedCustomer.email}</strong>
                        </span>
                      )}
                      {(filters.startDate || filters.endDate) && (
                        <span className="text-muted ms-2">
                          {filters.startDate && filters.endDate
                            ? `from ${new Date(filters.startDate).toLocaleDateString()} to ${new Date(filters.endDate).toLocaleDateString()}`
                            : filters.startDate
                            ? `from ${new Date(filters.startDate).toLocaleDateString()}`
                            : `until ${new Date(filters.endDate).toLocaleDateString()}`}
                        </span>
                      )}
                    </h6>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <FiList className="me-1" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'timeline' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setViewMode('timeline')}
                    >
                      <FiClock className="me-1" />
                      Timeline
                    </Button>
                  </div>
                </div>
                {viewMode === 'timeline' ? (
                  <div className="timeline-view">
                    {logs.map((log, index) => {
                      const logDate = new Date(log.createdAt);
                      const prevLogDate = index > 0 ? new Date(logs[index - 1].createdAt) : null;
                      const showDateHeader = !prevLogDate || 
                        logDate.toDateString() !== prevLogDate.toDateString();
                      
                      return (
                        <div key={log._id}>
                          {showDateHeader && (
                            <div className="d-flex align-items-center my-4">
                              <hr className="flex-grow-1" />
                              <Badge bg="secondary" className="mx-3">
                                {logDate.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Badge>
                              <hr className="flex-grow-1" />
                            </div>
                          )}
                          <div className="d-flex mb-3">
                            <div className="me-3 text-center" style={{ minWidth: '80px' }}>
                              <div className="text-muted small">
                                {logDate.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div 
                                className="bg-primary rounded-circle mx-auto mt-2"
                                style={{ width: '12px', height: '12px' }}
                              />
                            </div>
                            <Card className="flex-grow-1">
                              <Card.Body className="py-2">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      {getActionBadge(log.action)}
                                      <span className="text-muted small">
                                        {log.user ? (log.user.name || log.user.email) : 'Unknown User'}
                                      </span>
                                    </div>
                                    <div className="text-muted small">
                                      {log.description || '-'}
                                    </div>
                                    {log.resourceId && (
                                      <div className="text-muted small mt-1">
                                        Resource: {log.resourceType || 'resource'} - {log.resourceId}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-end">
                                    <small className="text-muted d-block">
                                      {log.ipAddress || 'N/A'}
                                    </small>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
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
                )}

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

