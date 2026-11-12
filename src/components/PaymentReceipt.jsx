
import "./PaymentReceipt.css";

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "R0.00";

  return value.toLocaleString("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function capitalize(value) {
  if (!value || typeof value !== "string") return "-";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PaymentReceipt({
  selectedPayment,
  onClose,
}) {
  if (!selectedPayment) return null;

  const payment = selectedPayment;

  const isSuccessful = payment.status === "successful";

  const statusLabel = isSuccessful
    ? "PAID"
    : capitalize(payment.status);

  const billingCycle =
    payment.billingCycle === "yearly" ? "Yearly" : "Monthly";

  const planName = payment.planId?.name || "-";
  const transactionId = payment.transactionId || "-";

  const subscription =
    payment.subscriptionId &&
    typeof payment.subscriptionId === "object"
      ? payment.subscriptionId
      : null;

  const subscriptionStart = subscription?.currentPeriodStart;
  const subscriptionEnd = subscription?.currentPeriodEnd;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div
      className="receipt-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-receipt-heading"
      >
        {/* RECEIPT HEADER */}
        <div className="receipt-topbar">
          <div className="receipt-brand">
            <div className="receipt-brand-mark">TB</div>

            <div>
              <h2>Thelle Mogoerane</h2>
              <p>Venue Booking System</p>
            </div>
          </div>

          <div className="receipt-title">
            <span>PAYMENT RECEIPT</span>
            <strong>{statusLabel}</strong>
          </div>

          <button
            type="button"
            className="receipt-close-icon"
            onClick={onClose}
            aria-label="Close receipt"
          >
            X
          </button>
        </div>

        {/* RECEIPT CONTENT */}
        <div className="receipt-content">
          {/* INTRODUCTION */}
          <div className="receipt-intro">
            <div>
              <h3 id="payment-receipt-heading">
                Subscription Payment Receipt
              </h3>

              <p>
                {isSuccessful
                  ? "Thank you for your payment. This receipt confirms your subscription payment."
                  : "This document displays the current status and details of your subscription payment."}
              </p>
            </div>

            <div
              className="receipt-status-badge"
              style={
                isSuccessful
                  ? undefined
                  : {
                      color: "#92400e",
                      background: "#fffbeb",
                      borderColor: "#fde68a",
                    }
              }
            >
              {isSuccessful
                ? "✓ Payment Successful"
                : `Payment ${capitalize(payment.status)}`}
            </div>
          </div>

          {/* PAYMENT INFORMATION */}
          <div className="receipt-section">
            <div className="receipt-section-title">
              Payment Information
            </div>

            <div className="receipt-information-grid">
              <div className="receipt-information-item">
                <span>Payment Date</span>
                <strong>{formatDate(payment.paymentDate)}</strong>
              </div>

              <div className="receipt-information-item">
                <span>Transaction ID</span>
                <strong className="receipt-reference">
                  {transactionId}
                </strong>
              </div>

              <div className="receipt-information-item">
                <span>Payment Provider</span>
                <strong>{capitalize(payment.provider)}</strong>
              </div>

              <div className="receipt-information-item">
                <span>Payment Status</span>
                <strong
                  className={
                    isSuccessful ? "receipt-success-text" : ""
                  }
                >
                  {capitalize(payment.status)}
                </strong>
              </div>
            </div>
          </div>

          {/* SUBSCRIPTION DETAILS */}
          <div className="receipt-section">
            <div className="receipt-section-title">
              Subscription Details
            </div>

            <div className="receipt-information-grid">
              <div className="receipt-information-item">
                <span>Subscription Plan</span>
                <strong>{planName}</strong>
              </div>

              <div className="receipt-information-item">
                <span>Billing Cycle</span>
                <strong>{billingCycle}</strong>
              </div>
            </div>
          </div>

          {/* SUBSCRIPTION PERIOD */}
          {subscription && (
            <div className="receipt-period-card">
              <div className="receipt-period-header">
                <div>
                  <span>Subscription Period</span>
                  <strong>Subscription Details</strong>
                </div>

                <div className="receipt-period-icon">✓</div>
              </div>

              <div className="receipt-period-grid">
                <div className="receipt-period-item">
                  <span>Start Date</span>
                  <strong>{formatDate(subscriptionStart)}</strong>
                </div>

                <div className="receipt-period-arrow">→</div>

                <div className="receipt-period-item">
                  <span>End Date</span>
                  <strong>{formatDate(subscriptionEnd)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT SUMMARY */}
          <div className="receipt-summary">
            <div className="receipt-summary-line">
              <span>Subscription</span>
              <strong>{planName}</strong>
            </div>

            <div className="receipt-summary-line">
              <span>Billing</span>
              <strong>{billingCycle}</strong>
            </div>

            <div className="receipt-summary-divider" />

            <div className="receipt-total">
              <div>
                <span>
                  {isSuccessful ? "Amount Paid" : "Payment Amount"}
                </span>

                <small>Subscription payment</small>
              </div>

              <strong>{formatCurrency(payment.amount)}</strong>
            </div>
          </div>

          {/* TRANSACTION REFERENCE */}
          <div className="receipt-reference-box">
            <span>Transaction Reference</span>
            <strong>{transactionId}</strong>
          </div>

          {/* FOOTER MESSAGE */}
          <div className="receipt-thank-you">
            <strong>
              Thank you for choosing our Venue Booking System.
            </strong>

            <p>
              {isSuccessful
                ? "Please retain this receipt for your records."
                : "Please retain this payment record for your reference."}
            </p>
          </div>
        </div>

        {/* RECEIPT FOOTER */}
        <div className="receipt-footer">
          <div className="receipt-footer-note">
            <span>
              Payment provider: {capitalize(payment.provider)}
            </span>
            <span>•</span>
            <span>
              {isSuccessful
                ? "Transaction confirmed"
                : "Transaction not confirmed"}
            </span>
          </div>

          <div className="receipt-footer-actions">
            <button
              type="button"
              className="print-receipt-button"
              onClick={handlePrintReceipt}
            >
              Print / Save as PDF
            </button>

            <button
              type="button"
              className="receipt-close-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
