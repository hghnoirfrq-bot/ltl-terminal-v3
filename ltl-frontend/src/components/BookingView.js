import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// --- Configuration ---
const API_URL = process.env.REACT_APP_API_URL;
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const BookingView = ({ setView }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch(`${API_URL}/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to create payment intent. Is the backend server running?');
        }
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const appearance = { theme: 'night', variables: { colorPrimary: '#00ff00', colorBackground: '#0a0a0a', colorText: '#00ff00', colorDanger: '#ff0000', fontFamily: 'JetBrains Mono, monospace', borderRadius: '4px' } };
  const options = { clientSecret, appearance };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setView('terminal')}>← Back to Terminal</button>
      <div className="form-container">
        <h2 style={{ color: '#00ff00', marginBottom: '20px' }}>Book Your Creative Session</h2>
        
        {isLoading && <p>Loading Payment Form...</p>}
        
        {error && <p style={{color: '#ff0000'}}>Error: {error}</p>}

        {clientSecret && !error && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm setView={setView} />
          </Elements>
        )}
      </div>
    </div>
  );
};

const CheckoutForm = ({ setView }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [formData, setFormData] = useState({ clientName: '', clientEmail: '', serviceType: '', sessionFormat: '', preferredDate: '', experienceLevel: 'beginner', projectDescription: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevData => ({ ...prevData, [id]: value }));
  };

  const createBookingInDB = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to create booking.');
      
      const tempPassword = result.tempPassword;
      alert(`Payment successful! Your temporary password is: ${tempPassword}`);
      setView('terminal');
    } catch (error) {
      console.error('Booking failed:', error);
      setMessage(`Booking failed after payment: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: window.location.href }, redirect: "if_required" });
    if (error) {
      setMessage(error.type === "card_error" || error.type === "validation_error" ? error.message : "An unexpected error occurred.");
    } else {
      await createBookingInDB();
    }
    setIsProcessing(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="form-group"><label htmlFor="clientName">Full Name *</label><input type="text" id="clientName" value={formData.clientName} onChange={handleInputChange} required /></div>
      <div className="form-group"><label htmlFor="clientEmail">Email Address *</label><input type="email" id="clientEmail" value={formData.clientEmail} onChange={handleInputChange} required /></div>
      <div className="form-group"><label htmlFor="serviceType">Service Type *</label><select id="serviceType" value={formData.serviceType} onChange={handleInputChange} required><option value="">Select a service...</option><option value="music-production">Music Production - $75</option><option value="creative-writing">Creative Writing Support - $75</option><option value="concept-development">Concept Development - $75</option><option value="building-strategy">Building Strategy - $75</option></select></div>
      <div className="form-group"><label htmlFor="sessionFormat">Session Format *</label><select id="sessionFormat" value={formData.sessionFormat} onChange={handleInputChange} required><option value="">Select format...</option><option value="online">Online (Discord)</option><option value="in-person">In-Person (Atlanta Area)</option></select></div>
      <div className="form-group"><label htmlFor="preferredDate">Preferred Date</label><input type="date" id="preferredDate" value={formData.preferredDate} onChange={handleInputChange} /></div>
      <div className="form-group"><label htmlFor="experienceLevel">Experience Level</label><select id="experienceLevel" value={formData.experienceLevel} onChange={handleInputChange}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
      <div className="form-group"><label htmlFor="projectDescription">Project Description *</label><textarea id="projectDescription" value={formData.projectDescription} onChange={handleInputChange} required placeholder="Tell us about your creative project and goals..."></textarea></div>
      <PaymentElement id="payment-element" />
      <button disabled={isProcessing || !stripe || !elements} id="submit" className="btn"><span id="button-text">{isProcessing ? <div className="loading"></div> : "Pay $75 & Book"}</span></button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
};

export default BookingView;