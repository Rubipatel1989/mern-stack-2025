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
  parent: '',
  image: '',
  status: 'active',
};

const CategoriesPage = () => {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [formState, setFormState] = useState(initialFormState);
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [submitting, setSubmitting] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  const canManageCategories = useMemo(() => {
    const roleName = user?.role?.name?.toLowerCase();
    return roleName === 'superadmin' || roleName === 'admin';
  }, [user]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data?.data || []);
    } catch (error) {
      if (error.response?.status === 404) setCategories([]);
      else setFeedback({ type: 'danger', message: error.message });
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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
      parent: formState.parent || undefined,
      image: formState.image || undefined,
      status: formState.status,
    };

    const isUpdate = isEditing && editingCategoryId;

    setSubmitting(true);
    try {
      if (isUpdate) {
        await api.put(`/categories/${editingCategoryId}`, payload);
        setFeedback({ type: 'success', message: 'Category updated successfully.' });
      } else {
        await api.post('/categories', payload);
        setFeedback({ type: 'success', message: 'Category created successfully.' });
      }
      setIsDrawerOpen(false);
      resetForm();
      fetchCategories();
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
    setEditingCategoryId(null);
  };

  const handleAddCategory = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleEditCategory = (category) => {
    setFormState({
      name: category.name || '',
      description: category.description || '',
      parent: category.parent?._id || category.parent || '',
      image: category.image || '',
      status: category.status || 'active',
    });
    setEditingCategoryId(category._id);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmed = window.confirm('Are you sure you want to delete this category?');
    if (!confirmed) return;

    try {
      await api.delete(`/categories/${categoryId}`);
      setFeedback({ type: 'success', message: 'Category deleted successfully.' });
      fetchCategories();
    } catch (error) {
      setFeedback({
        type: 'danger',
        message: error.response?.data?.message || error.message || 'Failed to delete category.',
      });
    }
  };

  const renderCategories = () => {
    if (loadingCategories) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Loading categories...</p>
        </div>
      );
    }

    if (!categories.length) {
      return <div className="py-4 text-center text-muted">No categories found yet.</div>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Parent Category</th>
              <th>Status</th>
              {canManageCategories && <th style={{ width: 120 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.parent?.name || '-'}</td>
                <td>
                  <Badge bg={item.status === 'active' ? 'success' : 'secondary'}>
                    {item.status}
                  </Badge>
                </td>
                {canManageCategories && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEditCategory(item)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteCategory(item._id)}
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

  // Filter out the current category being edited from parent options
  const parentOptions = categories.filter((cat) => cat._id !== editingCategoryId);

  return (
    <>
      <AppNavbar />
      <Container fluid className="py-4">
        <Row className="mb-3">
          <Col>
            <h2>Category Management</h2>
            <p className="text-muted">Manage your product categories</p>
          </Col>
          {canManageCategories && (
            <Col xs="auto">
              <Button variant="primary" onClick={handleAddCategory}>
                + Add Category
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

        <Card>{renderCategories()}</Card>
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
              {isEditing ? 'Edit Category' : 'Add Category'}
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
                      disabled={!canManageCategories}
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
                      disabled={!canManageCategories}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="parent">
                    <Form.Label>Parent Category</Form.Label>
                    <Form.Select
                      name="parent"
                      value={formState.parent}
                      onChange={handleChange}
                      disabled={!canManageCategories}
                    >
                      <option value="">None (Top Level)</option>
                      {parentOptions.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group controlId="image">
                    <Form.Label>Image URL</Form.Label>
                    <Form.Control
                      name="image"
                      value={formState.image}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      disabled={!canManageCategories}
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
                      disabled={!canManageCategories}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {canManageCategories && (
                  <Col xs={12}>
                    <div className="d-grid gap-2">
                      <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting
                          ? 'Saving...'
                          : isEditing
                            ? 'Update Category'
                            : 'Create Category'}
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

const CategoriesPageWithProtection = () => (
  <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
    <CategoriesPage />
  </ProtectedRoute>
);

export default CategoriesPageWithProtection;

