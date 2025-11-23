import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const StatesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    country: 'India',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

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
    fetchStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchStates = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/states');
      setStates(data?.data || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load states');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (state = null) => {
    if (state) {
      setEditingState(state);
      setFormState({
        name: state.name || '',
        code: state.code || '',
        country: state.country || 'India',
        status: state.status || 'active',
      });
    } else {
      setEditingState(null);
      setFormState({
        name: '',
        code: '',
        country: 'India',
        status: 'active',
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingState(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (editingState) {
        await api.put(`/states/${editingState._id}`, formState);
        setSuccess('State updated successfully');
      } else {
        await api.post('/states', formState);
        setSuccess('State created successfully');
      }
      fetchStates();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save state');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this state?')) {
      return;
    }

    try {
      await api.delete(`/states/${id}`);
      setSuccess('State deleted successfully');
      fetchStates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete state');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading && states.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading states...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <Row className="mb-3">
          <Col>
            <h3>Manage States</h3>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FiPlus className="me-2" />
              Add State
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
            {success}
          </Alert>
        )}

        <Card>
          <Card.Body>
            {states.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No states found. Add your first state to get started.</p>
              </div>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((state) => (
                    <tr key={state._id}>
                      <td>{state.name}</td>
                      <td>
                        <Badge bg="secondary">{state.code}</Badge>
                      </td>
                      <td>{state.country}</td>
                      <td>
                        <Badge bg={state.status === 'active' ? 'success' : 'secondary'}>
                          {state.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal(state)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(state._id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingState ? 'Edit State' : 'Add New State'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>State Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      placeholder="e.g., Uttar Pradesh"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>State Code *</Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      value={formState.code}
                      onChange={handleChange}
                      placeholder="e.g., UP"
                      maxLength={10}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                    <Form.Text className="text-muted">2-10 character code (e.g., UP, MH, DL)</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Country *</Form.Label>
                    <Form.Control
                      type="text"
                      name="country"
                      value={formState.country}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status *</Form.Label>
                    <Form.Select name="status" value={formState.status} onChange={handleChange} required>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
                <FiX className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiPlus className="me-1" />
                    {editingState ? 'Update' : 'Add'} State
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

const StatesPageWithProtection = () => (
  <ProtectedRoute roles={['admin', 'superadmin']}>
    <StatesPage />
  </ProtectedRoute>
);

export default StatesPageWithProtection;

