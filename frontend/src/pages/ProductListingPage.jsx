import { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Row, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ProductListingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);
  const [cartMessage, setCartMessage] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    status: 'active',
    featured: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        status: 'active',
        ...filters,
      };

      if (!params.search) delete params.search;
      if (!params.category) delete params.category;
      if (!params.minPrice) delete params.minPrice;
      if (!params.maxPrice) delete params.maxPrice;
      if (!params.featured) delete params.featured;

      const { data } = await api.get('/products', { params });
      setProducts(data?.data || []);
      setPagination(data?.pagination || pagination);
    } catch (error) {
      if (error.response?.status === 404) {
        setProducts([]);
      } else {
        console.error('Error fetching products:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingToCart(productId);
    setCartMessage(null);
    try {
      await api.post('/cart/add', { productId, quantity: 1 });
      setCartMessage({ type: 'success', text: 'Added to cart!' });
      setTimeout(() => setCartMessage(null), 3000);
    } catch (error) {
      setCartMessage({ type: 'danger', text: error.message || 'Failed to add to cart' });
      setTimeout(() => setCartMessage(null), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <>
      <AppNavbar />
      <Container fluid className="py-4">
        <Row className="g-4">
          {/* Filters Sidebar */}
          <Col xs={12} md={3}>
            <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
              <Card.Header>
                <Card.Title className="mb-0">Filters</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Search</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Category"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Min Price</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Price</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Featured</Form.Label>
                    <Form.Select
                      value={filters.featured}
                      onChange={(e) => handleFilterChange('featured', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="true">Featured Only</option>
                    </Form.Select>
                  </Form.Group>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setFilters({
                        search: '',
                        category: '',
                        minPrice: '',
                        maxPrice: '',
                        status: 'active',
                        featured: '',
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Products Grid */}
          <Col xs={12} md={9}>
            {cartMessage && (
              <Alert
                variant={cartMessage.type}
                dismissible
                onClose={() => setCartMessage(null)}
                className="mb-3"
              >
                {cartMessage.text}
              </Alert>
            )}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" />
                <p className="mt-2 text-muted">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <Card>
                <Card.Body className="text-center py-5">
                  <p className="text-muted">No products found.</p>
                </Card.Body>
              </Card>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>
                    {pagination.total} {pagination.total === 1 ? 'Product' : 'Products'} Found
                  </h5>
                </div>
                <Row className="g-4">
                  {products.map((product) => (
                    <Col key={product._id} xs={12} sm={6} lg={4}>
                      <Card className="h-100 shadow-sm product-card">
                        {product.images && product.images.length > 0 && (
                          <div
                            className="product-image"
                            style={{
                              height: '200px',
                              backgroundImage: `url(${product.images[0]})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: '#f8f9fa',
                            }}
                          />
                        )}
                        <Card.Body className="d-flex flex-column">
                          <div className="mb-2">
                            {product.featured && (
                              <Badge bg="primary" className="me-2">
                                Featured
                              </Badge>
                            )}
                            {product.category && (
                              <Badge bg="secondary">{product.category}</Badge>
                            )}
                          </div>
                          <Card.Title className="h6">{product.name}</Card.Title>
                          {product.description && (
                            <Card.Text className="text-muted small flex-grow-1">
                              {product.description.length > 100
                                ? `${product.description.substring(0, 100)}...`
                                : product.description}
                            </Card.Text>
                          )}
                          <div className="mt-auto">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="h5 mb-0 text-primary">
                                ${product.price?.toFixed(2) || '0.00'}
                              </span>
                              {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <span className="text-muted text-decoration-line-through">
                                  ${product.compareAtPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                Stock: {product.stock ?? 0}
                              </small>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={addingToCart === product._id || (product.stock ?? 0) === 0}
                                onClick={() => handleAddToCart(product._id)}
                              >
                                {addingToCart === product._id ? (
                                  <>
                                    <Spinner size="sm" className="me-1" />
                                    Adding...
                                  </>
                                ) : (
                                  'Add to Cart'
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
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
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ProductListingPage;

