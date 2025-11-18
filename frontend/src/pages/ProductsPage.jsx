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
  price: '',
  compareAtPrice: '',
  sku: '',
  category: '',
  tags: '',
  images: '',
  stock: '',
  status: 'active',
  featured: false,
  weight: '',
  vendor: '',
};

const ProductsPage = () => {
  const { user } = useAuth();

  // data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  // ui state
  const [formState, setFormState] = useState(initialFormState);
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [submitting, setSubmitting] = useState(false);

  // drawer & edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // refs for animation
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // permissions
  const canManageProducts = useMemo(() => {
    const roleName = user?.role?.name?.toLowerCase();
    return roleName === 'superadmin' || roleName === 'admin';
  }, [user]);

  // --- data loaders ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get('/products', { params: { limit: 100 } });
      setProducts(data?.data || []);
    } catch (error) {
      if (error.response?.status === 404) setProducts([]);
      else setFeedback({ type: 'danger', message: error.message });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data } = await api.get('/vendors', { params: { status: 'active' } });
      setVendors(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories', { params: { status: 'active' } });
      setCategories(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    setLoadingMasters(true);
    Promise.all([fetchVendors(), fetchCategories()]).finally(() => {
      setLoadingMasters(false);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
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

  const resetForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setEditingProductId(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: null, message: null });

    const payload = {
      name: formState.name,
      description: formState.description,
      price: Number(formState.price),
      compareAtPrice: formState.compareAtPrice ? Number(formState.compareAtPrice) : undefined,
      sku: formState.sku,
      category: formState.category || undefined,
      tags: formState.tags ? formState.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      images: formState.images ? formState.images.split(',').map((i) => i.trim()).filter(Boolean) : [],
      stock: formState.stock ? Number(formState.stock) : 0,
      status: formState.status,
      featured: formState.featured,
      weight: formState.weight ? Number(formState.weight) : undefined,
      vendor: formState.vendor || undefined,
    };

    const isUpdate = isEditing && editingProductId;

    setSubmitting(true);
    try {
      if (isUpdate) {
        await api.put(`/products/${editingProductId}`, payload);
        setFeedback({ type: 'success', message: 'Product updated successfully.' });
      } else {
        await api.post('/products', payload);
        setFeedback({ type: 'success', message: 'Product created successfully.' });
      }
      await fetchProducts();
      closeDrawer();
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Operation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProduct = () => {
    resetForm();
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setEditingProductId(product._id);
    setFormState({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      compareAtPrice: product.compareAtPrice || '',
      sku: product.sku || '',
      category: product.category?._id || product.category || '',
      tags: product.tags?.join(', ') || '',
      images: product.images?.join(', ') || '',
      stock: product.stock || '',
      status: product.status || 'active',
      featured: product.featured || false,
      weight: product.weight || '',
      vendor: product.vendor?._id || product.vendor || '',
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      await api.delete(`/products/${productId}`);
      setFeedback({ type: 'success', message: 'Product deleted successfully.' });
      fetchProducts();
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Failed to delete product.' });
    }
  };

  const renderProducts = () => {
    if (loadingProducts) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Loading products...</p>
        </div>
      );
    }

    if (!products.length) {
      return <div className="py-4 text-center text-muted">No products found yet.</div>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Featured</th>
              {canManageProducts && <th style={{ width: 120 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.category?.name || item.category || '-'}</td>
                <td>${item.price?.toFixed(2) || '0.00'}</td>
                <td>{item.stock ?? 0}</td>
                <td>
                  <Badge bg={item.status === 'active' ? 'success' : 'secondary'}>
                    {item.status}
                  </Badge>
                </td>
                <td>
                  {item.featured ? (
                    <Badge bg="primary">Yes</Badge>
                  ) : (
                    <span className="text-muted">No</span>
                  )}
                </td>
                {canManageProducts && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEditProduct(item)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteProduct(item._id)}
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
      <Container fluid className="pb-4 position-relative">
        <Row className="g-4">
          <Col xs={12}>
            {feedback.message && (
              <Alert
                variant={feedback.type === 'success' ? 'success' : 'danger'}
                onClose={() => setFeedback({ type: null, message: null })}
                dismissible
              >
                {feedback.message}
              </Alert>
            )}
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                  <div>
                    <Card.Title>Product Management</Card.Title>
                    <Card.Subtitle className="text-muted">
                      Manage your eCommerce product catalog.
                    </Card.Subtitle>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={fetchProducts}
                      disabled={loadingProducts}
                    >
                      Refresh
                    </Button>
                    {canManageProducts && (
                      <Button size="sm" onClick={handleAddProduct}>
                        + Add Product
                      </Button>
                    )}
                  </div>
                </div>
                {renderProducts()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* overlay */}
      <div
        ref={overlayRef}
        className="drawer-overlay"
        onClick={closeDrawer}
        role="presentation"
      />

      {/* drawer */}
      <div ref={drawerRef} className="user-drawer">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="mb-1">{isEditing ? 'Edit Product' : 'Create Product'}</h5>
            <small className="text-muted">
              {isEditing ? 'Update product details.' : 'Fill the details to create a new product.'}
            </small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={closeDrawer}>
            Close
          </Button>
        </div>

        {!canManageProducts && (
          <Alert variant="warning">You need to be an Admin or Superadmin to manage products.</Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col sm={12}>
              <Form.Group controlId="name">
                <Form.Label>Product Name *</Form.Label>
                <Form.Control
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Product name"
                  required
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formState.description}
                  onChange={handleChange}
                  placeholder="Product description"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="price">
                <Form.Label>Price *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formState.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="compareAtPrice">
                <Form.Label>Compare At Price</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="compareAtPrice"
                  value={formState.compareAtPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="sku">
                <Form.Label>SKU</Form.Label>
                <Form.Control
                  name="sku"
                  value={formState.sku}
                  onChange={handleChange}
                  placeholder="SKU-001"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="category">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={formState.category}
                  onChange={handleChange}
                  disabled={!canManageProducts}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="stock">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="stock"
                  value={formState.stock}
                  onChange={handleChange}
                  placeholder="0"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formState.status}
                  onChange={handleChange}
                  disabled={!canManageProducts}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="tags">
                <Form.Label>Tags (comma-separated)</Form.Label>
                <Form.Control
                  name="tags"
                  value={formState.tags}
                  onChange={handleChange}
                  placeholder="tag1, tag2, tag3"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="images">
                <Form.Label>Image URLs (comma-separated)</Form.Label>
                <Form.Control
                  name="images"
                  value={formState.images}
                  onChange={handleChange}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="weight">
                <Form.Label>Weight (kg)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="weight"
                  value={formState.weight}
                  onChange={handleChange}
                  placeholder="0.00"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="vendor">
                <Form.Label>Vendor</Form.Label>
                <Form.Select
                  name="vendor"
                  value={formState.vendor}
                  onChange={handleChange}
                  disabled={!canManageProducts}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Check
                type="checkbox"
                id="featured"
                name="featured"
                label="Featured Product"
                checked={formState.featured}
                onChange={handleChange}
                disabled={!canManageProducts}
              />
            </Col>
            <Col xs={12}>
              <div className="d-grid">
                <Button type="submit" variant="primary" disabled={!canManageProducts || submitting}>
                  {submitting ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
};

const ProductsPageWithProtection = () => (
  <ProtectedRoute roles={['superadmin', 'admin']}>
    <ProductsPage />
  </ProtectedRoute>
);

export default ProductsPageWithProtection;

