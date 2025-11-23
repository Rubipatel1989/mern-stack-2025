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
  email: '',
  password: '',
  phone: '',
  dob: '',
  role: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

const DashboardPage = () => {
  const { user } = useAuth();

  // data
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);

  // ui state
  const [formState, setFormState] = useState(initialFormState);
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // drawer & edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // refs for animation
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // permissions
  const canManageUsers = useMemo(() => {
    const roleName = user?.role?.name?.toLowerCase();
    return roleName === 'superadmin' || roleName === 'admin';
  }, [user]);

  const canDeleteUsers = useMemo(() => {
    const roleName = user?.role?.name?.toLowerCase();
    return roleName === 'superadmin' || roleName === 'admin';
  }, [user]);

  const getRoleName = (role) =>
    typeof role === 'string'
      ? role.toLowerCase()
      : role?.name?.toLowerCase() || role?.roleName?.toLowerCase();

  // --- data loaders ---
  const fetchRoles = async () => {
    setLoadingRoles(true);
    setFeedback({ type: null, message: null });
    try {
      const { data } = await api.get('/roles');
      setRoles(data?.data || []);
    } catch (error) {
      if (error.response?.status === 404) setRoles([]);
      else setFeedback({ type: 'danger', message: error.message });
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data?.data || []);
    } catch (error) {
      if (error.response?.status === 404) setUsers([]);
      else setFeedback({ type: 'danger', message: error.message });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStates = async () => {
    try {
      const { data } = await api.get('/states', { params: { status: 'active' } });
      setStates(data?.data || []);
    } catch (error) {
      console.error('Failed to load states:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    fetchStates();
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

  const formatDobToInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setEditingUserId(null);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // give the drawer time to animate out before clearing
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const pruneAddress = (payload) => {
    if (!payload.address) return;
    const clean = { ...payload.address };
    Object.entries(clean).forEach(([k, v]) => {
      if (!v) delete clean[k];
    });
    if (Object.keys(clean).length === 0) delete payload.address;
    else payload.address = clean;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: null, message: null });

    const payload = {
      name: formState.name,
      email: formState.email,
      password: formState.password, // omitted later if empty on edit
      phone: formState.phone,
      dob: formState.dob, // backend expects your string format; adjust if needed
      role: formState.role,
      address: {
        line1: formState.addressLine1,
        line2: formState.addressLine2,
        city: formState.city,
        state: formState.state,
        postalCode: formState.postalCode,
        country: formState.country,
      },
    };

    pruneAddress(payload);

    const isUpdate = isEditing && editingUserId;

    if (!isUpdate && !payload.password) {
      setFeedback({ type: 'danger', message: 'Password is required for new users.' });
      return;
    }
    if (!payload.password) delete payload.password;

    setSubmitting(true);
    try {
      if (isUpdate) {
        await api.put(`/users/${editingUserId}`, payload);
        setFeedback({ type: 'success', message: 'User updated successfully.' });
      } else {
        await api.post('/users', payload);
        setFeedback({ type: 'success', message: 'User created successfully.' });
      }
      await fetchUsers();
      closeDrawer();
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Operation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUser = () => {
    resetForm();
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleEditUser = (selectedUser) => {
    setIsEditing(true);
    setEditingUserId(selectedUser._id);
    setFormState({
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      password: '',
      phone: selectedUser.phone || '',
      dob: formatDobToInput(selectedUser.dateOfBirth || selectedUser.dob),
      role: selectedUser?.role?._id || selectedUser?.role || '',
      addressLine1: selectedUser.address?.line1 || '',
      addressLine2: selectedUser.address?.line2 || '',
      city: selectedUser.address?.city || '',
      state: selectedUser.address?.state || '',
      postalCode: selectedUser.address?.postalCode || '',
      country: selectedUser.address?.country || '',
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteUser = async (user) => {
    const targetRole = getRoleName(user.role);

    if (targetRole === 'superadmin') {
      setFeedback({
        type: 'danger',
        message: 'Superadmin account cannot be deleted.',
      });
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this user? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/users/${user._id}`);
      setFeedback({ type: 'success', message: 'User deleted successfully.' });
      fetchUsers();
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Failed to delete user.' });
    }
  };

  const renderUsers = () => {
    if (loadingUsers) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Loading users...</p>
        </div>
      );
    }

    if (!users.length) {
      return <div className="py-4 text-center text-muted">No users found yet.</div>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>DOB</th>
              <th>Address</th>
              <th>Created</th>
              {canManageUsers && <th style={{ width: 160 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>
                  <Badge bg="secondary" className="text-uppercase">
                    {item?.role?.name || item?.role || 'N/A'}
                  </Badge>
                </td>
                <td>{item.phone || '-'}</td>
                <td>
                  {item.dateOfBirth
                    ? new Date(item.dateOfBirth).toLocaleDateString()
                    : item.dob || '-'}
                </td>
                <td>
                  {item.address
                    ? [
                        item.address.line1,
                        item.address.line2,
                        item.address.city,
                        item.address.state,
                        item.address.postalCode,
                        item.address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : '-'}
                </td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
                {canManageUsers && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEditUser(item)}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <FiEdit2 />
                      </Button>
                      {canDeleteUsers && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteUser(item)}
                          className="d-flex align-items-center justify-content-center"
                        >
                          <FiTrash2 />
                        </Button>
                      )}
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
                    <Card.Title>User Directory</Card.Title>
                    <Card.Subtitle className="text-muted">
                      Manage customers, admins, and support users.
                    </Card.Subtitle>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={fetchUsers}
                      disabled={loadingUsers}
                    >
                      Refresh
                    </Button>
                    {canManageUsers && (
                      <Button size="sm" onClick={handleAddUser}>
                        + Add User
                      </Button>
                    )}
                  </div>
                </div>
                {renderUsers()}
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
            <h5 className="mb-1">{isEditing ? 'Edit User' : 'Create User'}</h5>
            <small className="text-muted">
              {isEditing ? 'Update the selected user details.' : 'Fill the details to create a new user.'}
            </small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={closeDrawer}>
            Close
          </Button>
        </div>

        {!canManageUsers && (
          <Alert variant="warning">You need to be an Admin or Superadmin to manage users.</Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col sm={12}>
              <Form.Group controlId="name">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                  disabled={!canManageUsers}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  required
                  disabled={!canManageUsers}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="password">
                <Form.Label>
                  Password{' '}
                  {isEditing && <small className="text-muted">(leave blank to keep same)</small>}
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formState.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  minLength={isEditing && !formState.password ? undefined : 6}
                  required={!isEditing}
                  disabled={!canManageUsers}
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
                  placeholder="+91-9876543210"
                  disabled={!canManageUsers}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="dob">
                <Form.Label>DOB (dd-mm-yyyy)</Form.Label>
                <Form.Control
                  name="dob"
                  value={formState.dob}
                  onChange={handleChange}
                  placeholder="17-05-1995"
                  disabled={!canManageUsers}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="role">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={formState.role}
                  onChange={handleChange}
                  required
                  disabled={!canManageUsers || loadingRoles}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="addressLine1">
                <Form.Label>Address Line 1</Form.Label>
                <Form.Control
                  name="addressLine1"
                  value={formState.addressLine1}
                  onChange={handleChange}
                  placeholder="Street, House no."
                  disabled={!canManageUsers}
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
                  placeholder="Landmark"
                  disabled={!canManageUsers}
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
                  disabled={!canManageUsers}
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
                  disabled={!canManageUsers}
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
                  disabled={!canManageUsers}
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
                  disabled={!canManageUsers}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <div className="d-grid">
                <Button type="submit" variant="primary" disabled={!canManageUsers || submitting}>
                  {submitting ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
};

const DashboardPageWithProtection = () => (
  <ProtectedRoute roles={['superadmin', 'admin', 'support']}>
    <DashboardPage />
  </ProtectedRoute>
);

export default DashboardPageWithProtection;
