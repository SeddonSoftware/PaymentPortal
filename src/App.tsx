import React, { useRef, useState, useEffect } from 'react';
import './App.css'

interface OpaqueData {
  dataDescriptor: string;
  dataValue: string;
}

interface AcceptJsResponse {
  opaqueData?: OpaqueData;
  messages: {
    resultCode: string;
    message: { code: string; text: string }[];
  };
}

function App() {
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window.Accept === 'undefined') {
      console.error('Accept.js is not loaded');
    } else {
      console.log('Accept.js loaded and ready');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const expValue = expiryRef.current?.value || '';
    const [expMonth, expYear] = expValue.split('/').map(s => s.trim());

    const cardData = {
      cardNumber: cardNumberRef.current?.value,
      month: expMonth,
      year: expYear,
      cardCode: cvvRef.current?.value,
      zip: zipRef.current?.value,
    };

    const authData = {
      clientKey:  '2ax7q5wmr3VTU92Ks6QPm5DPb6Pg6sjBjzRQWzBGGnE67qJPbNtVsAH2bT7M34q6',
      apiLoginID: '242K8yweW3',
    };

    const secureData = {
      cardData,
      authData,
    };

    window.Accept.dispatchData(secureData, (response: AcceptJsResponse) => {
      console.log("RESPONSE", response)
      if (response.messages.resultCode === 'Error') {
        const errorMessages = response.messages.message.map(m => `${m.code}: ${m.text}`);
        setError(errorMessages.join(', '));
        setLoading(false);
      } else if (response.opaqueData) {
        sendOpaqueDataToServer(response.opaqueData);
      }
    });
  };

  const sendOpaqueDataToServer = async (opaqueData: OpaqueData) => {
    try {
      const res = await fetch('https://localhost:44379/api/submit-payment-acceptjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienttoken: opaqueData.dataValue }),
      });

      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(result.message || 'Payment failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="paymentForm" onSubmit={handleSubmit}>
      <div className='formRow'>
        <label>Card Number:</label>
        <input type="text" ref={cardNumberRef} required />
      </div>
      <div className='formRow'>
        <label>Expiry (MM/YYYY):</label>
        <input type="text" ref={expiryRef} required />
      </div>
      <div className='formRow'>
        <label>CVV:</label>
        <input type="text" ref={cvvRef} required />
      </div>
      <div className='formRow'>
        <label>ZIP Code:</label>
        <input type="text" ref={zipRef} required />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Payment successful!</p>}
    </form>
  );
};

export default App
