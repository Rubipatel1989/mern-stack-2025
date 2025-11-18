import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const SignupPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formState.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const payload = {
      name: formState.name,
      email: formState.email,
      password: formState.password,
      phone: formState.phone,
      dob: formState.dob,
      address: {
        line1: formState.addressLine1,
        line2: formState.addressLine2,
        city: formState.city,
        state: formState.state,
        postalCode: formState.postalCode,
        country: formState.country,
      },
    };

    // Remove empty address fields
    if (!payload.address.line1) delete payload.address.line1;
    if (!payload.address.line2) delete payload.address.line2;
    if (!payload.address.city) delete payload.address.city;
    if (!payload.address.state) delete payload.address.state;
    if (!payload.address.postalCode) delete payload.address.postalCode;
    if (!payload.address.country) delete payload.address.country;
    if (Object.keys(payload.address).length === 0) delete payload.address;

    try {
      const { data } = await api.post('/auth/register', payload);
      // Auto login after signup
      await login({ email: formState.email, password: formState.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="bg-light min-vh-100 d-flex align-items-center">
      <Row className="justify-content-center w-100">
        <Col xs={11} sm={8} md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="mb-3 text-center">Create Account</h3>
              <p className="text-muted text-center mb-4">
                Sign up to start shopping
              </p>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="name" className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    name="name"
                    value={formState.name}
                    placeholder="John Doe"
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formState.email}
                    placeholder="john@example.com"
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formState.password}
                    placeholder="At least 6 characters"
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Form.Group controlId="confirmPassword" className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formState.confirmPassword}
                    placeholder="Confirm your password"
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Form.Group controlId="phone" className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    name="phone"
                    value={formState.phone}
                    placeholder="+1-234-567-8900"
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="dob" className="mb-3">
                  <Form.Label>Date of Birth (dd-mm-yyyy)</Form.Label>
                  <Form.Control
                    name="dob"
                    value={formState.dob}
                    placeholder="17-05-1995"
                    onChange={handleChange}
                  />
                </Form.Group>

                <div className="d-grid mb-3">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </div>

                <div className="text-center">
                  <small className="text-muted">
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                  </small>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SignupPage;

