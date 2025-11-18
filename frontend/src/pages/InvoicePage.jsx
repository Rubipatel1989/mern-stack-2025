import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const InvoicePage = () => {
  const { id: orderId } = useParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadInvoice();
  }, [orderId, isAuthenticated]);

  const loadInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/invoices/${orderId}/html`, {
        responseType: 'text',
      });
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(response.data);
        newWindow.document.close();
      }
    } catch (error) {
      setError(error.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading invoice...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <div className="text-center">
          <p>Invoice will open in a new window.</p>
          <Button variant="primary" onClick={loadInvoice}>
            Open Invoice
          </Button>
          <Button variant="outline-primary" className="ms-2" onClick={handleDownload}>
            Print / Save as PDF
          </Button>
        </div>
      </Container>
    </>
  );
};

const InvoicePageWithProtection = () => (
  <ProtectedRoute>
    <InvoicePage />
  </ProtectedRoute>
);

export default InvoicePageWithProtection;

