import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { FiUser } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ProfilePage = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [states, setStates] = useState([]);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    profilePicture: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchStates();
  }, [isAuthenticated, navigate]);

  const fetchStates = async () => {
    try {
      const { data } = await api.get('/states', { params: { status: 'active' } });
      setStates(data?.data || []);
    } catch (error) {
      console.error('Failed to load states:', error);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/me');
      const profile = data?.data;
      setFormState({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dob: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB').split('/').reverse().join('-').split('-').reverse().join('-')
          : '',
        profilePicture: profile.profilePicture || '',
        addressLine1: profile.address?.line1 || '',
        addressLine2: profile.address?.line2 || '',
        city: profile.address?.city || '',
        state: profile.address?.state || '',
        postalCode: profile.address?.postalCode || '',
        country: profile.address?.country || '',
      });
    } catch (error) {
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDobToInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const payload = {
      name: formState.name,
      email: formState.email,
      phone: formState.phone,
      dob: formState.dob,
      profilePicture: formState.profilePicture,
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
      const { data } = await api.put('/users/me', payload);
      const updatedUser = data?.data;
      setUser(updatedUser);
      // Update localStorage as well
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      if (authData.token) {
        localStorage.setItem('auth', JSON.stringify({ ...authData, user: updatedUser }));
      }
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading profile...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">My Profile</Card.Title>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}

                <div className="text-center mb-4">
                  {formState.profilePicture ? (
                    <img
                      src={formState.profilePicture}
                      alt="Profile"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #dee2e6',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: '#dee2e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                      }}
                    >
                      <FiUser size={60} color="#6c757d" />
                    </div>
                  )}
                  <div className="mt-3">
                    <Form.Group>
                      <Form.Label>Upload Profile Picture</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </Form.Group>
                  </div>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col sm={12}>
                      <Form.Group controlId="name">
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control
                          name="name"
                          value={formState.name}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12}>
                      <Form.Group controlId="email">
                        <Form.Label>Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formState.email}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="phone">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          name="phone"
                          value={formState.phone}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="dob">
                        <Form.Label>Date of Birth (dd-mm-yyyy)</Form.Label>
                        <Form.Control
                          name="dob"
                          value={formState.dob}
                          onChange={handleChange}
                          placeholder="17-05-1995"
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12}>
                      <hr />
                      <h6>Address</h6>
                    </Col>
                    <Col sm={12}>
                      <Form.Group controlId="addressLine1">
                        <Form.Label>Address Line 1</Form.Label>
                        <Form.Control
                          name="addressLine1"
                          value={formState.addressLine1}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12}>
                      <Form.Group controlId="addressLine2">
                        <Form.Label>Address Line 2</Form.Label>
                        <Form.Control
                          name="addressLine2"
                          value={formState.addressLine2}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="city">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          name="city"
                          value={formState.city}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="state">
                        <Form.Label>State</Form.Label>
                        <Form.Select
                          name="state"
                          value={formState.state}
                          onChange={handleChange}
                        >
                          <option value="">Select State</option>
                          {states.map((state) => (
                            <option key={state._id} value={state.name}>
                              {state.name} ({state.code})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="postalCode">
                        <Form.Label>Postal Code</Form.Label>
                        <Form.Control
                          name="postalCode"
                          value={formState.postalCode}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="country">
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          name="country"
                          value={formState.country}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <div className="d-grid">
                        <Button type="submit" variant="primary" disabled={saving}>
                          {saving ? 'Saving...' : 'Update Profile'}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

const ProfilePageWithProtection = () => (
  <ProtectedRoute>
    <ProfilePage />
  </ProtectedRoute>
);

export default ProfilePageWithProtection;

