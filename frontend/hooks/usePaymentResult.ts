import { useEffect, useState } from 'react';

export interface PaymentResultData {
  transactionId: string;
  amount?: number;
  errorReason?: string;
}

export function usePaymentResult() {
  const [data, setData] = useState<PaymentResultData>({
    transactionId: '',
    amount: 0,
    errorReason: ''
  });

  useEffect(() => {
    // Read URL parameters for transaction details
    const urlParams = new URLSearchParams(window.location.search);
    const txId = urlParams.get('id') || urlParams.get('transaction_id') || '';
    const amountCents = urlParams.get('amount_cents');
    const amountDirect = urlParams.get('amount');
    const reason = urlParams.get('reason') || urlParams.get('error') || '';

    let amount = 0;
    if (amountCents) {
      amount = parseFloat(amountCents) / 100;
    } else if (amountDirect) {
      amount = parseFloat(amountDirect);
    }

    setData({
      transactionId: txId,
      amount,
      errorReason: reason
    });

    // Clean up URL parameters after a short delay
    const timeout = setTimeout(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  return data;
}