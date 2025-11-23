import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, InputGroup } from 'react-bootstrap';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, isAuthenticated, authError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formState, setFormState] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      await login(formState);
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
  };

  return (
    <Container fluid className="bg-light min-vh-100 d-flex align-items-center">
      <Row className="justify-content-center w-100">
        <Col xs={11} sm={8} md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="mb-3 text-center">Login</h3>
              <p className="text-muted text-center mb-4">
                Sign in to your account
              </p>

              {(error || authError) && (
                <Alert variant="danger">{error || authError}</Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formState.email}
                    placeholder="admin@example.com"
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="password" className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formState.password}
                      placeholder="••••••••"
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ borderLeft: 'none' }}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="text-muted small text-center">
              <div>
                Don't have an account? <Link to="/signup">Sign up</Link>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;

