import { Navbar, Nav, Button, Container, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiMoon, FiSun } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const AppNavbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';
  const isCustomer = user?.role?.name?.toLowerCase() === 'customer';

  return (
    <Navbar 
      bg={isDarkMode ? 'dark' : 'light'} 
      variant={isDarkMode ? 'dark' : 'light'} 
      expand="lg" 
      className="mb-4 theme-navbar" 
      style={{ 
        backgroundColor: isDarkMode ? '#212529' : '#f8f9fa', 
        borderBottom: `1px solid ${isDarkMode ? '#495057' : '#dee2e6'}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}
    >
      <Container fluid>
        <Navbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.svg" 
            alt="Soft Chilli" 
            style={{ 
              height: '45px', 
              width: 'auto',
              objectFit: 'contain',
              display: 'block'
            }} 
            onError={(e) => {
              console.error('Logo failed to load');
              e.target.style.display = 'none';
            }}
          />
          {isAdmin && <span className="d-none d-md-inline" style={{ color: isDarkMode ? '#fff' : '#333' }}>Admin Panel</span>}
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
                        <>
                          <Nav.Link onClick={() => navigate('/profile')}>Profile</Nav.Link>
                          <Nav.Link onClick={() => navigate('/addresses')}>Addresses</Nav.Link>
                        </>
                      )}
                    </>
                  )}
          </Nav>
          {!isAdmin && (
            <Nav>
              <Nav.Link
                onClick={() => navigate('/cart')}
                className="d-flex align-items-center position-relative"
                style={{ cursor: 'pointer', color: isDarkMode ? '#fff' : '#333' }}
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
          <div className="d-flex align-items-center gap-3" style={{ color: isDarkMode ? '#fff' : '#333' }}>
            {/* Dark Mode Toggle */}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={toggleTheme}
              style={{
                minWidth: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </Button>
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
                <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
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

