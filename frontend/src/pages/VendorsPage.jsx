import { useEffect, useMemo, useRef, useState } from 'react';
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
  Table,
} from 'react-bootstrap';
import { gsap } from 'gsap';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const initialFormState = {
  name: '',
  description: '',
  contactEmail: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  status: 'active',
};

const VendorsPage = () => {
  const { user } = useAuth();

  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const [formState, setFormState] = useState(initialFormState);
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [submitting, setSubmitting] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);

  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  const canManageVendors = useMemo(() => {
    const roleName = user?.role?.name?.toLowerCase();
    return roleName === 'superadmin' || roleName === 'admin';
  }, [user]);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const { data } = await api.get('/vendors');
      setVendors(data?.data || []);
    } catch (error) {
      if (error.response?.status === 404) setVendors([]);
      else setFeedback({ type: 'danger', message: error.message });
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (drawerRef.current) {
      gsap.to(drawerRef.current, {
        x: isDrawerOpen ? 0 : '100%',
        duration: 0.5,
        ease: 'power3.inOut',
      });
    }
    if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = isDrawerOpen ? 'auto' : 'none';
      gsap.to(overlayRef.current, {
        opacity: isDrawerOpen ? 0.45 : 0,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }, [isDrawerOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: null, message: null });

    const payload = {
      name: formState.name,
      description: formState.description,
      contactEmail: formState.contactEmail,
      contactPhone: formState.contactPhone,
      address: {
        line1: formState.addressLine1,
        line2: formState.addressLine2,
        city: formState.city,
        state: formState.state,
        postalCode: formState.postalCode,
        country: formState.country,
      },
      status: formState.status,
    };

    // Remove empty address fields
    Object.keys(payload.address).forEach((key) => {
      if (!payload.address[key]) delete payload.address[key];
    });
    if (Object.keys(payload.address).length === 0) delete payload.address;

    const isUpdate = isEditing && editingVendorId;

    setSubmitting(true);
    try {
      if (isUpdate) {
        await api.put(`/vendors/${editingVendorId}`, payload);
        setFeedback({ type: 'success', message: 'Vendor updated successfully.' });
      } else {
        await api.post('/vendors', payload);
        setFeedback({ type: 'success', message: 'Vendor created successfully.' });
      }
      setIsDrawerOpen(false);
      resetForm();
      fetchVendors();
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.response?.data?.message || error.message || 'Operation failed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setEditingVendorId(null);
  };

  const handleAddVendor = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleEditVendor = (vendor) => {
    setFormState({
      name: vendor.name || '',
      description: vendor.description || '',
      contactEmail: vendor.contactEmail || '',
      contactPhone: vendor.contactPhone || '',
      addressLine1: vendor.address?.line1 || '',
      addressLine2: vendor.address?.line2 || '',
      city: vendor.address?.city || '',
      state: vendor.address?.state || '',
      postalCode: vendor.address?.postalCode || '',
      country: vendor.address?.country || '',
      status: vendor.status || 'active',
    });
    setEditingVendorId(vendor._id);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleDeleteVendor = async (vendorId) => {
    const confirmed = window.confirm('Are you sure you want to delete this vendor?');
    if (!confirmed) return;

    try {
      await api.delete(`/vendors/${vendorId}`);
      setFeedback({ type: 'success', message: 'Vendor deleted successfully.' });
      fetchVendors();
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.response?.data?.message || error.message || 'Failed to delete vendor.',
      });
    }
  };

  const renderVendors = () => {
    if (loadingVendors) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Loading vendors...</p>
        </div>
      );
    }

    if (!vendors.length) {
      return <div className="py-4 text-center text-muted">No vendors found yet.</div>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Contact Email</th>
              <th>Contact Phone</th>
              <th>Status</th>
              {canManageVendors && <th style={{ width: 120 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vendors.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.contactEmail || '-'}</td>
                <td>{item.contactPhone || '-'}</td>
                <td>
                  <Badge bg={item.status === 'active' ? 'success' : 'secondary'}>
                    {item.status}
                  </Badge>
                </td>
                {canManageVendors && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEditVendor(item)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteVendor(item._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <AppNavbar />
      <Container fluid className="py-4">
        <Row className="mb-3">
          <Col>
            <h2>Vendor Management</h2>
            <p className="text-muted">Manage your vendors</p>
          </Col>
          {canManageVendors && (
            <Col xs="auto">
              <Button variant="primary" onClick={handleAddVendor}>
                + Add Vendor
              </Button>
            </Col>
          )}
        </Row>

        {feedback.message && (
          <Alert
            variant={feedback.type}
            dismissible
            onClose={() => setFeedback({ type: null, message: null })}
          >
            {feedback.message}
          </Alert>
        )}

        <Card>{renderVendors()}</Card>
      </Container>

      {/* Drawer */}
      <div
        ref={overlayRef}
        onClick={() => setIsDrawerOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'black',
          zIndex: 1040,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '500px',
          maxWidth: '90vw',
          height: '100vh',
          background: 'white',
          zIndex: 1050,
          boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          transform: 'translateX(100%)',
        }}
      >
        <Card className="h-100 border-0 rounded-0">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">
              {isEditing ? 'Edit Vendor' : 'Add Vendor'}
            </Card.Title>
            <Button variant="link" onClick={() => setIsDrawerOpen(false)}>
              ✕
            </Button>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group controlId="name">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formState.description}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="contactEmail">
                    <Form.Label>Contact Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="contactEmail"
                      value={formState.contactEmail}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="contactPhone">
                    <Form.Label>Contact Phone</Form.Label>
                    <Form.Control
                      name="contactPhone"
                      value={formState.contactPhone}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <hr />
                  <h6>Address</h6>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="addressLine1">
                    <Form.Label>Address Line 1</Form.Label>
                    <Form.Control
                      name="addressLine1"
                      value={formState.addressLine1}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="addressLine2">
                    <Form.Label>Address Line 2</Form.Label>
                    <Form.Control
                      name="addressLine2"
                      value={formState.addressLine2}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      name="city"
                      value={formState.city}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="state">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      name="state"
                      value={formState.state}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="postalCode">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control
                      name="postalCode"
                      value={formState.postalCode}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="country">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      name="country"
                      value={formState.country}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="status">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={formState.status}
                      onChange={handleChange}
                      disabled={!canManageVendors}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {canManageVendors && (
                  <Col xs={12}>
                    <div className="d-grid gap-2">
                      <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Saving...' : isEditing ? 'Update Vendor' : 'Create Vendor'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Col>
                )}
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

const VendorsPageWithProtection = () => (
  <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
    <VendorsPage />
  </ProtectedRoute>
);

export default VendorsPageWithProtection;

