import { Navbar, Nav, Button, Container, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const AppNavbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';
  const isCustomer = user?.role?.name?.toLowerCase() === 'customer';

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container fluid>
        <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          {isAdmin ? 'MERN Admin Panel' : 'MERN Store'}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate('/')}>Shop</Nav.Link>
            {isAdmin && (
              <>
                <Nav.Link onClick={() => navigate('/admin')}>Users</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/products')}>Products</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/vendors')}>Vendors</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/categories')}>Categories</Nav.Link>
              </>
            )}
            {user && (
              <>
                <Nav.Link onClick={() => navigate('/orders')}>My Orders</Nav.Link>
                {isCustomer && (
                  <Nav.Link onClick={() => navigate('/profile')}>Profile</Nav.Link>
                )}
              </>
            )}
          </Nav>
          {!isAdmin && (
            <Nav>
              <Nav.Link
                onClick={() => navigate('/cart')}
                className="d-flex align-items-center position-relative"
                style={{ cursor: 'pointer', color: 'white' }}
              >
                <FiShoppingCart size={20} />
                {cartCount > 0 && (
                  <Badge
                    bg="danger"
                    className="position-absolute"
                    style={{
                      top: '-5px',
                      right: '-5px',
                      fontSize: '0.7rem',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </Badge>
                )}
              </Nav.Link>
            </Nav>
          )}
          <div className="d-flex align-items-center gap-3 text-light">
            {user ? (
              <>
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span>{user.name || user.email}</span>
                )}
                <span className="badge bg-secondary text-uppercase">
                  {user?.role?.name || user?.role}
                </span>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline-light" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="light" size="sm" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;

