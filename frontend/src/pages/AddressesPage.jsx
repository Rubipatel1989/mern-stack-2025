import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { gsap } from 'gsap';
import { FiEdit2, FiTrash2, FiPlus, FiCheck } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const AddressesPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formState, setFormState] = useState({
    type: 'shipping',
    label: 'Home',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });
  const [formErrors, setFormErrors] = useState({});

  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAddresses();
    fetchStates();
  }, [isAuthenticated, navigate]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const { data } = await api.get('/states', { params: { status: 'active' } });
      setStates(data?.data || []);
    } catch (error) {
      console.error('Failed to load states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      gsap.fromTo(
        drawerRef.current,
        { x: '100%' },
        { x: 0, duration: 0.3, ease: 'power3.out' }
      );
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
    } else {
      if (drawerRef.current) {
        gsap.to(drawerRef.current, { x: '100%', duration: 0.3, ease: 'power3.in' });
      }
      if (overlayRef.current) {
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
      }
    }
  }, [showModal]);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/addresses');
      setAddresses(data?.data || []);
    } catch (error) {
      setError(error.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormState({
        type: address.type,
        label: address.label || 'Home',
        name: address.name || '',
        phone: address.phone || '',
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
        isDefault: address.isDefault || false,
      });
    } else {
      setEditingAddress(null);
      setFormState({
        type: 'shipping',
        label: 'Home',
        name: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Phone validation - only allow digits and limit to 10
    if (name === 'phone') {
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormState((prev) => ({
        ...prev,
        [name]: phoneValue,
      }));
      // Clear error when user starts typing
      if (formErrors.phone) {
        setFormErrors((prev) => ({ ...prev, phone: '' }));
      }
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Phone validation - must be exactly 10 digits
    if (formState.phone && formState.phone.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormErrors({});

    // Validate form
    if (!validateForm()) {
      setError('Please fix the form errors');
      return;
    }

    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress._id}`, formState);
        setSuccess('Address updated successfully');
      } else {
        await api.post('/addresses', formState);
        setSuccess('Address added successfully');
      }
      fetchAddresses();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await api.delete(`/addresses/${id}`);
      setSuccess('Address deleted successfully');
      fetchAddresses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete address');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/default`);
      setSuccess('Default address updated successfully');
      fetchAddresses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to set default address');
      setTimeout(() => setError(null), 3000);
    }
  };

  const shippingAddresses = addresses.filter((addr) => addr.type === 'shipping');
  const billingAddresses = addresses.filter((addr) => addr.type === 'billing');

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading addresses...</p>
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
            <h3>Manage Addresses</h3>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FiPlus className="me-2" />
              Add Address
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

        <Row className="g-4">
          {/* Shipping Addresses */}
          <Col xs={12} lg={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Shipping Addresses</h5>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => handleOpenModal()}
                >
                  <FiPlus className="me-1" />
                  Add
                </Button>
              </Card.Header>
              <Card.Body>
                {shippingAddresses.length === 0 ? (
                  <p className="text-muted text-center py-3">No shipping addresses yet</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {shippingAddresses.map((address) => (
                      <Card key={address._id} className="border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <Badge bg={address.isDefault ? 'primary' : 'secondary'} className="me-2">
                                {address.label}
                              </Badge>
                              {address.isDefault && (
                                <Badge bg="success">
                                  <FiCheck className="me-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleOpenModal(address)}
                                title="Edit"
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete(address._id)}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 fw-bold">{address.name}</p>
                            {address.phone && <p className="mb-1 text-muted small">{address.phone}</p>}
                            <p className="mb-1">
                              {address.line1}
                              {address.line2 && `, ${address.line2}`}
                            </p>
                            <p className="mb-0 text-muted small">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="mb-2 text-muted small">{address.country}</p>
                            {!address.isDefault && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => handleSetDefault(address._id)}
                              >
                                Set as Default
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Billing Addresses */}
          <Col xs={12} lg={6}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Billing Addresses</h5>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => {
                    const newFormState = { ...formState };
                    newFormState.type = 'billing';
                    setFormState(newFormState);
                    handleOpenModal();
                  }}
                >
                  <FiPlus className="me-1" />
                  Add
                </Button>
              </Card.Header>
              <Card.Body>
                {billingAddresses.length === 0 ? (
                  <p className="text-muted text-center py-3">No billing addresses yet</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {billingAddresses.map((address) => (
                      <Card key={address._id} className="border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <Badge bg={address.isDefault ? 'primary' : 'secondary'} className="me-2">
                                {address.label}
                              </Badge>
                              {address.isDefault && (
                                <Badge bg="success">
                                  <FiCheck className="me-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleOpenModal(address)}
                                title="Edit"
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDelete(address._id)}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 fw-bold">{address.name}</p>
                            {address.phone && <p className="mb-1 text-muted small">{address.phone}</p>}
                            <p className="mb-1">
                              {address.line1}
                              {address.line2 && `, ${address.line2}`}
                            </p>
                            <p className="mb-0 text-muted small">
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="mb-2 text-muted small">{address.country}</p>
                            {!address.isDefault && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => handleSetDefault(address._id)}
                              >
                                Set as Default
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Add/Edit Address Modal/Drawer */}
      {showModal && (
        <>
          <div
            ref={overlayRef}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040,
              opacity: 0,
            }}
            onClick={handleCloseModal}
          />
          <div
            ref={drawerRef}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '90%',
              maxWidth: '500px',
              backgroundColor: 'white',
              zIndex: 1050,
              overflowY: 'auto',
              boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Card className="h-100 border-0 rounded-0">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h5>
                <Button variant="link" onClick={handleCloseModal} className="p-0">
                  ×
                </Button>
              </Card.Header>
              <Card.Body>
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

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address Type *</Form.Label>
                    <Form.Select
                      name="type"
                      value={formState.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="shipping">Shipping</option>
                      <option value="billing">Billing</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Label</Form.Label>
                    <Form.Control
                      type="text"
                      name="label"
                      value={formState.label}
                      onChange={handleChange}
                      placeholder="Home, Office, etc."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone *</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={formState.phone}
                      onChange={handleChange}
                      placeholder="Enter 10 digit phone number"
                      maxLength={10}
                      required
                      isInvalid={!!formErrors.phone}
                    />
                    {formErrors.phone && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.phone}
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-muted">
                      {formState.phone.length}/10 digits
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address Line 1 *</Form.Label>
                    <Form.Control
                      type="text"
                      name="line1"
                      value={formState.line1}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address Line 2</Form.Label>
                    <Form.Control
                      type="text"
                      name="line2"
                      value={formState.line2}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>City *</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={formState.city}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State *</Form.Label>
                        {loadingStates ? (
                          <Form.Control as="div">
                            <Spinner size="sm" className="me-2" />
                            Loading states...
                          </Form.Control>
                        ) : (
                          <Form.Select
                            name="state"
                            value={formState.state}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select State</option>
                            {states.map((state) => (
                              <option key={state._id} value={state.name}>
                                {state.name} ({state.code})
                              </option>
                            ))}
                          </Form.Select>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Postal Code *</Form.Label>
                        <Form.Control
                          type="text"
                          name="postalCode"
                          value={formState.postalCode}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
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
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="isDefault"
                      label="Set as default address"
                      checked={formState.isDefault}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button type="submit" variant="primary">
                      {editingAddress ? 'Update Address' : 'Add Address'}
                    </Button>
                    <Button type="button" variant="outline-secondary" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </>
      )}
    </>
  );
};

const AddressesPageWithProtection = () => (
  <ProtectedRoute>
    <AddressesPage />
  </ProtectedRoute>
);

export default AddressesPageWithProtection;

