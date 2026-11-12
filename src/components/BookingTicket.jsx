import "./BookingTicket.css";

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(timeValue) {
  if (!timeValue) return "—";

  if (
    typeof timeValue === "string" &&
    /^\d{2}:\d{2}$/.test(timeValue)
  ) {
    return timeValue;
  }

  return "—";
}

// =====================================================
// FORMAT AMOUNT
// =====================================================

function formatAmount(amount) {
  const value = Number(amount || 0);

  return `R${value.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// =====================================================
// CUSTOMER NAME
// =====================================================

function getCustomerName(customer) {
  if (!customer) return "Customer";

  return (
    `${customer.firstName || ""} ${
      customer.lastName || ""
    }`.trim() || "Customer"
  );
}

// =====================================================
// BOOKING TICKET
// =====================================================

function BookingTicket({ booking }) {
  if (!booking) {
    return null;
  }

  // ================================================
  // BOOKING DATA
  // ================================================

  const customer = booking.customerId || {};
  const venue = booking.venueId || {};
  const business = booking.businessId || {};

  // ================================================
  // BUSINESS INFORMATION
  // ================================================

  /*
   * The backend populates booking.businessId:
   *
   * booking.businessId = {
   *   name,
   *   email,
   *   phone,
   *   address
   * }
   *
   * We also support booking.businessName as a
   * fallback.
   */

  const businessName =
    business.name ||
    booking.businessName ||
    "Booking System";

  const businessEmail =
    business.email ||
    booking.businessEmail ||
    "";

  const businessPhone =
    business.phone ||
    booking.businessPhone ||
    "";

  // ================================================
  // CUSTOMER INFORMATION
  // ================================================

  const customerName = getCustomerName(customer);

  // ================================================
  // BOOKING NUMBER
  // ================================================

  const bookingNumber =
    booking.bookingNumber ||
    booking._id ||
    "N/A";

  // ================================================
  // STATUS
  // ================================================

  const bookingStatus =
    booking.status || "pending";

  // ================================================
  // TIME
  // ================================================

  const startTime = formatTime(
    booking.startTime
  );

  const endTime = formatTime(
    booking.endTime
  );

  return (
    <div className="booking-ticket">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="booking-ticket-header">

        <div>
          <h1>
            {businessName}
          </h1>

          <p>
            Booking Confirmation
          </p>
        </div>

        <div className="booking-ticket-status">
          {bookingStatus === "confirmed"
            ? "CONFIRMED"
            : bookingStatus.toUpperCase()}
        </div>

      </div>

      {/* ==========================================
          TICKET BODY
      ========================================== */}

      <div className="booking-ticket-body">

        {/* GREETING */}

        <div className="booking-ticket-greeting">

          <h2>
            {bookingStatus === "confirmed"
              ? "Booking Confirmed"
              : "Booking Confirmation"}
          </h2>

          <p>
            Dear{" "}
            <strong>
              {customerName}
            </strong>,
          </p>

          <p>
            Thank you for your booking.
            Your booking details are shown
            below.
          </p>

        </div>

        {/* ========================================
            BOOKING NUMBER
        ======================================== */}

        <div className="booking-ticket-number">

          <span>
            Booking Number
          </span>

          <strong>
            {bookingNumber}
          </strong>

        </div>

        {/* ========================================
            BOOKING DETAILS
        ======================================== */}

        <div className="booking-ticket-details">

          {/* VENUE */}

          <div className="booking-ticket-row">

            <span>
              Venue
            </span>

            <strong>
              {venue.name || "—"}
            </strong>

          </div>

          {/* DATE */}

          <div className="booking-ticket-row">

            <span>
              Date
            </span>

            <strong>
              {formatDate(
                booking.bookingDate
              )}
            </strong>

          </div>

          {/* TIME */}

          <div className="booking-ticket-row">

            <span>
              Time
            </span>

            <strong>
              {startTime} – {endTime}
            </strong>

          </div>

          {/* CUSTOMER */}

          <div className="booking-ticket-row">

            <span>
              Customer
            </span>

            <strong>
              {customerName}
            </strong>

          </div>

          {/* CUSTOMER EMAIL */}

          {customer.email && (
            <div className="booking-ticket-row">

              <span>
                Email
              </span>

              <strong>
                {customer.email}
              </strong>

            </div>
          )}

          {/* CUSTOMER PHONE */}

          {customer.phone && (
            <div className="booking-ticket-row">

              <span>
                Phone
              </span>

              <strong>
                {customer.phone}
              </strong>

            </div>
          )}

          {/* ORGANISATION */}

          {customer.organization && (
            <div className="booking-ticket-row">

              <span>
                Organisation
              </span>

              <strong>
                {customer.organization}
              </strong>

            </div>
          )}

          {/* TOTAL AMOUNT */}

          <div className="booking-ticket-row">

            <span>
              Total Amount
            </span>

            <strong>
              {formatAmount(
                booking.totalAmount
              )}
            </strong>

          </div>

          {/* PAYMENT STATUS */}

          <div className="booking-ticket-row">

            <span>
              Payment Status
            </span>

            <strong>
              {booking.paymentStatus ||
                "unpaid"}
            </strong>

          </div>

        </div>

        {/* ========================================
            NOTES
        ======================================== */}

        {booking.notes && (
          <div className="booking-ticket-notes">

            <h3>
              Booking Notes
            </h3>

            <p>
              {booking.notes}
            </p>

          </div>
        )}

        {/* ========================================
            IMPORTANT INFORMATION
        ======================================== */}

        <div className="booking-ticket-instructions">

          <h3>
            Important Information
          </h3>

          <ul>

            <li>
              Please keep this booking
              ticket for your records.
            </li>

            <li>
              Please present your booking
              number when arriving at the
              venue.
            </li>

            <li>
              Please contact us if you
              need to make changes to your
              booking.
            </li>

          </ul>

        </div>

      </div>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <div className="booking-ticket-footer">
        <span><strong>{customer.organization}:</strong></span>
        <span><strong>
          {businessName}
        </strong></span>

        {businessEmail && (
          <span>
            {businessEmail}
          </span>
        )}

        {businessPhone && (
          <span>
            {businessPhone}
          </span>
        )}

      </div>

    </div>
  );
}

export default BookingTicket;

