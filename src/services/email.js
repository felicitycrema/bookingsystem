import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID =
  import.meta.env.VITE_EMAILJS_SERVICE_ID;

const EMAILJS_TEMPLATE_ID =
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

const EMAILJS_CANCELLATION_TEMPLATE_ID =
  import.meta.env.VITE_EMAILJS_CANCELLATION_TEMPLATE_ID;

const EMAILJS_PUBLIC_KEY =
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY;


// =====================================================
// FORMAT BOOKING DATE
// =====================================================

function formatBookingDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
// GET CUSTOMER NAME
// =====================================================

function getCustomerName(customer) {
  if (!customer) {
    return "Customer";
  }

  return (
    `${customer.firstName || ""} ${
      customer.lastName || ""
    }`.trim() || "Customer"
  );
}


// =====================================================
// SEND BOOKING CONFIRMATION EMAIL
// =====================================================

export async function sendBookingConfirmation(booking) {
  if (!booking) {
    throw new Error("Booking information is missing.");
  }

  console.log("=================================");
  console.log("EMAILJS CONFIGURATION");
  console.log("=================================");

  console.log(
    "Service ID:",
    EMAILJS_SERVICE_ID
  );

  console.log(
    "Confirmation Template ID:",
    EMAILJS_TEMPLATE_ID
  );

  console.log(
    "Public Key exists:",
    Boolean(EMAILJS_PUBLIC_KEY)
  );

  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY
  ) {
    throw new Error(
      "EmailJS configuration is missing. Check the client .env file."
    );
  }

  const customer = booking.customerId || {};
  const venue = booking.venueId || {};
  const business = booking.businessId || {};

  const customerName =
    getCustomerName(customer);

  const customerEmail =
    customer.email || "";

  if (!customerEmail) {
    throw new Error(
      "The customer does not have an email address."
    );
  }

  const businessName =
    business.name ||
    booking.businessName ||
    "Thelle Mogoerane: Venue Booking System";

  const businessEmail =
    business.email ||
    booking.businessEmail ||
    "";

  const businessPhone =
    business.phone ||
    booking.businessPhone ||
    "";

  const bookingNumber =
    booking.bookingNumber ||
    booking._id ||
    "N/A";

  const venueName =
    venue.name ||
    "Venue";

  const bookingDate =
    formatBookingDate(
      booking.bookingDate
    );

  const startTime =
    booking.startTime || "";

  const endTime =
    booking.endTime || "";

  const totalAmount =
    formatAmount(
      booking.totalAmount
    );

  const paymentStatus =
    booking.paymentStatus ||
    "unpaid";

  const bookingStatus =
    booking.status ||
    "pending";

  const notes =
    booking.notes ||
    "No additional notes.";

  const templateParams = {
    customer_email: customerEmail,
    customer_name: customerName,

    booking_number: bookingNumber,

    venue_name: venueName,

    booking_date: bookingDate,

    start_time: startTime,
    end_time: endTime,

    total_amount: totalAmount,

    payment_status: paymentStatus,
    booking_status: bookingStatus,

    notes,

    business_name: businessName,
    business_email: businessEmail,
    business_phone: businessPhone,
  };

  console.log("=================================");
  console.log(
    "EMAILJS CONFIRMATION PARAMETERS"
  );
  console.log("=================================");

  console.log(templateParams);

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: EMAILJS_PUBLIC_KEY,
      }
    );

    console.log("=================================");
    console.log(
      "EMAILJS CONFIRMATION EMAIL SENT"
    );
    console.log("=================================");

    console.log(
      "Status:",
      response.status
    );

    console.log(
      "Text:",
      response.text
    );

    return response;

  } catch (error) {

    console.error("=================================");
    console.error(
      "EMAILJS CONFIRMATION EMAIL FAILED"
    );
    console.error("=================================");

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Text:",
      error?.text
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(error);

    throw error;
  }
}


// =====================================================
// SEND BOOKING CANCELLATION EMAIL
// =====================================================

export async function sendBookingCancellation(booking) {

  if (!booking) {
    throw new Error(
      "Booking information is missing."
    );
  }

  // ---------------------------------------------------
  // Validate EmailJS configuration
  // ---------------------------------------------------

  if (!EMAILJS_SERVICE_ID) {
    throw new Error(
      "EmailJS Service ID is missing."
    );
  }

  if (!EMAILJS_CANCELLATION_TEMPLATE_ID) {
    throw new Error(
      "EmailJS cancellation template ID is missing. Check VITE_EMAILJS_CANCELLATION_TEMPLATE_ID."
    );
  }

  if (!EMAILJS_PUBLIC_KEY) {
    throw new Error(
      "EmailJS Public Key is missing."
    );
  }

  // ---------------------------------------------------
  // Booking information
  // ---------------------------------------------------

  const customer =
    booking.customerId || {};

  const venue =
    booking.venueId || {};

  const business =
    booking.businessId || {};

  // ---------------------------------------------------
  // Customer
  // ---------------------------------------------------

  const customerName =
    getCustomerName(customer);

  const customerEmail =
    customer.email || "";

  if (!customerEmail) {
    throw new Error(
      "The customer does not have an email address."
    );
  }

  // ---------------------------------------------------
  // Business
  // ---------------------------------------------------

  const businessName =
    business.name ||
    booking.businessName ||
    "Thelle Mogoerane: Venue Booking System";

  const businessEmail =
    business.email ||
    booking.businessEmail ||
    "";

  const businessPhone =
    business.phone ||
    booking.businessPhone ||
    "";

  // ---------------------------------------------------
  // Booking
  // ---------------------------------------------------

  const bookingNumber =
    booking.bookingNumber ||
    booking._id ||
    "N/A";

  const venueName =
    venue.name ||
    "Venue";

  const bookingDate =
    formatBookingDate(
      booking.bookingDate
    );

  const startTime =
    booking.startTime || "";

  const endTime =
    booking.endTime || "";

  const totalAmount =
    formatAmount(
      booking.totalAmount
    );

  const paymentStatus =
    booking.paymentStatus ||
    "unpaid";

  const bookingStatus =
    "cancelled";

  const notes =
    booking.notes ||
    "No additional notes.";

  // ---------------------------------------------------
  // EmailJS parameters
  // ---------------------------------------------------

  const templateParams = {

    customer_email:
      customerEmail,

    customer_name:
      customerName,

    booking_number:
      bookingNumber,

    venue_name:
      venueName,

    booking_date:
      bookingDate,

    start_time:
      startTime,

    end_time:
      endTime,

    total_amount:
      totalAmount,

    payment_status:
      paymentStatus,

    booking_status:
      bookingStatus,

    notes,

    business_name:
      businessName,

    business_email:
      businessEmail,

    business_phone:
      businessPhone,
  };

  // ---------------------------------------------------
  // Debug information
  // ---------------------------------------------------

  console.log("=================================");
  console.log(
    "SENDING BOOKING CANCELLATION EMAIL"
  );
  console.log("=================================");

  console.log(
    "Service ID:",
    EMAILJS_SERVICE_ID
  );

  console.log(
    "Cancellation Template ID:",
    EMAILJS_CANCELLATION_TEMPLATE_ID
  );

  console.log(
    "Public Key exists:",
    Boolean(EMAILJS_PUBLIC_KEY)
  );

  console.log(
    "Customer:",
    customerName
  );

  console.log(
    "Recipient:",
    customerEmail
  );

  console.log(
    "Booking:",
    bookingNumber
  );

  console.log(
    "Venue:",
    venueName
  );

  console.log(
    "Booking Date:",
    bookingDate
  );

  console.log(
    "Template Parameters:",
    templateParams
  );

  // ---------------------------------------------------
  // Send cancellation email
  // ---------------------------------------------------

  try {

    const response =
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_CANCELLATION_TEMPLATE_ID,
        templateParams,
        {
          publicKey:
            EMAILJS_PUBLIC_KEY,
        }
      );

    console.log("=================================");
    console.log(
      "CANCELLATION EMAIL SENT SUCCESSFULLY"
    );
    console.log("=================================");

    console.log(
      "Status:",
      response.status
    );

    console.log(
      "Text:",
      response.text
    );

    return response;

  } catch (error) {

    console.error("=================================");
    console.error(
      "CANCELLATION EMAIL FAILED"
    );
    console.error("=================================");

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Text:",
      error?.text
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Full Error:",
      error
    );

    throw error;
  }
}