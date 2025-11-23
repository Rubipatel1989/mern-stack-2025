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
  Modal,
} from 'react-bootstrap';
import { FiRefreshCw, FiFilter, FiX, FiCheckCircle, FiTrash2, FiEye } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ErrorLogsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [filters, setFilters] = useState({
    module: '',
    level: '',
    resolved: '',
    userId: '',
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

      if (filters.module) params.module = filters.module;
      if (filters.level) params.level = filters.level;
      if (filters.resolved !== '') params.resolved = filters.resolved;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

      const { data } = await api.get('/error-logs', { params });
      setLogs(data?.data || []);
      setPagination(data?.pagination || pagination);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load error logs');
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
      module: '',
      level: '',
      resolved: '',
      userId: '',
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

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const handleResolve = async () => {
    if (!selectedLog) return;

    setResolving(true);
    try {
      await api.put(`/error-logs/${selectedLog._id}/resolve`, { note: resolveNote });
      setShowResolveModal(false);
      setResolveNote('');
      setSelectedLog(null);
      fetchLogs();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to resolve error log');
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this error log?')) {
      return;
    }

    try {
      await api.delete(`/error-logs/${logId}`);
      fetchLogs();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete error log');
    }
  };

  const getLevelBadge = (level) => {
    const colorMap = {
      critical: 'danger',
      error: 'danger',
      warning: 'warning',
      info: 'info',
    };
    return <Badge bg={colorMap[level] || 'secondary'}>{level.toUpperCase()}</Badge>;
  };

  const levelOptions = ['error', 'warning', 'critical', 'info'];

  if (loading && logs.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading error logs...</p>
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
              <Card.Title className="mb-0">Error Logs</Card.Title>
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
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Search</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Search in message, stack, or module..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Module</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Module name..."
                        value={filters.module}
                        onChange={(e) => handleFilterChange('module', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Level</Form.Label>
                      <Form.Select
                        value={filters.level}
                        onChange={(e) => handleFilterChange('level', e.target.value)}
                      >
                        <option value="">All Levels</option>
                        {levelOptions.map((level) => (
                          <option key={level} value={level}>
                            {level.toUpperCase()}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Resolved</Form.Label>
                      <Form.Select
                        value={filters.resolved}
                        onChange={(e) => handleFilterChange('resolved', e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="false">Unresolved</option>
                        <option value="true">Resolved</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>User ID / Email</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="User ID or email..."
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
                <p className="text-muted">No error logs found.</p>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>
                    {pagination.total} {pagination.total === 1 ? 'Error' : 'Errors'} Found
                  </h6>
                </div>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Module</th>
                        <th>Level</th>
                        <th>Message</th>
                        <th>Status Code</th>
                        <th>User</th>
                        <th>Resolved</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <Badge bg="secondary">{log.module}</Badge>
                          </td>
                          <td>{getLevelBadge(log.level)}</td>
                          <td>
                            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.message}
                            </div>
                          </td>
                          <td>
                            <Badge bg={log.statusCode >= 500 ? 'danger' : log.statusCode >= 400 ? 'warning' : 'info'}>
                              {log.statusCode}
                            </Badge>
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
                          <td>
                            {log.resolved ? (
                              <Badge bg="success">Resolved</Badge>
                            ) : (
                              <Badge bg="danger">Unresolved</Badge>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewDetails(log)}
                              >
                                <FiEye />
                              </Button>
                              {!log.resolved && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setShowResolveModal(true);
                                  }}
                                >
                                  <FiCheckCircle />
                                </Button>
                              )}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(log._id)}
                              >
                                <FiTrash2 />
                              </Button>
                            </div>
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

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Error Log Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Module:</strong> {selectedLog.module}
                </Col>
                <Col md={6}>
                  <strong>Level:</strong> {getLevelBadge(selectedLog.level)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Status Code:</strong> {selectedLog.statusCode}
                </Col>
                <Col md={6}>
                  <strong>Resolved:</strong>{' '}
                  {selectedLog.resolved ? (
                    <Badge bg="success">Yes</Badge>
                  ) : (
                    <Badge bg="danger">No</Badge>
                  )}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Date:</strong> {new Date(selectedLog.createdAt).toLocaleString()}
                </Col>
                <Col md={6}>
                  <strong>User:</strong>{' '}
                  {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'N/A'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>IP Address:</strong> {selectedLog.ipAddress || 'N/A'}
                </Col>
                <Col md={6}>
                  <strong>User Agent:</strong> {selectedLog.userAgent || 'N/A'}
                </Col>
              </Row>
              <div className="mb-3">
                <strong>Message:</strong>
                <div className="p-2 bg-light rounded mt-1">{selectedLog.message}</div>
              </div>
              {selectedLog.stack && (
                <div className="mb-3">
                  <strong>Stack Trace:</strong>
                  <pre className="p-2 bg-dark text-light rounded mt-1" style={{ maxHeight: '300px', overflow: 'auto', fontSize: '12px' }}>
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
              {selectedLog.request && (
                <div className="mb-3">
                  <strong>Request:</strong>
                  <pre className="p-2 bg-light rounded mt-1" style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
                    {JSON.stringify(selectedLog.request, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="mb-3">
                  <strong>Metadata:</strong>
                  <pre className="p-2 bg-light rounded mt-1" style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.resolved && selectedLog.resolvedNote && (
                <div className="mb-3">
                  <strong>Resolution Note:</strong>
                  <div className="p-2 bg-light rounded mt-1">{selectedLog.resolvedNote}</div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Resolve Modal */}
      <Modal show={showResolveModal} onHide={() => setShowResolveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Resolve Error Log</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Resolution Note (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Add a note about how this error was resolved..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleResolve} disabled={resolving}>
            {resolving ? 'Resolving...' : 'Mark as Resolved'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const ErrorLogsPageWithProtection = () => (
  <ProtectedRoute roles={['admin', 'superadmin']}>
    <ErrorLogsPage />
  </ProtectedRoute>
);

export default ErrorLogsPageWithProtection;

