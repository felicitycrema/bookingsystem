/* eslint-disable react-hooks/set-state-in-effect */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "../services/api.js";
import BookingTicket from "../components/BookingTicket.jsx";
import "./Bookings.css";

import {
  sendBookingConfirmation,
  sendBookingCancellation,
} from "../services/email.js";

const EMPTY_FORM = {
  venueId: "",
  customerId: "",
  bookingDate: "",
  startTime: "",
  endTime: "",
  pricingType: "hourly",
  status: "pending",
  paymentStatus: "unpaid",
  notes: "",
};

// =====================================================
// HELPERS
// =====================================================

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount) {
  const value = Number(amount || 0);

  return `R${value.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getVenueName(booking) {
  if (!booking?.venueId) {
    return "—";
  }

  if (
    typeof booking.venueId === "object"
  ) {
    return booking.venueId.name || "—";
  }

  return "—";
}

function getCustomerName(booking) {
  if (!booking?.customerId) {
    return "—";
  }

  if (
    typeof booking.customerId === "object"
  ) {
    return (
      `${booking.customerId.firstName || ""} ${
        booking.customerId.lastName || ""
      }`.trim() || "—"
    );
  }

  return "—";
}

// =====================================================
// FORM VALUE NORMALISATION
// =====================================================

function getIdValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value._id || value.id || "";
  }

  return String(value);
}

function getDateInputValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date
      .toISOString()
      .split("T")[0];
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return value
      .toISOString()
      .split("T")[0];
  }

  if (typeof value === "object") {
    if (value.$date) {
      return getDateInputValue(
        value.$date,
      );
    }

    if (value.date) {
      return getDateInputValue(
        value.date,
      );
    }

    return "";
  }

  return "";
}

function getTimeInputValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return "";
}

// =====================================================
// BOOKINGS COMPONENT
// =====================================================

function Bookings() {
  const [
    bookings,
    setBookings,
  ] = useState([]);

  const [venues, setVenues] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingBooking,
    setEditingBooking,
  ] = useState(null);

  const [
    viewingBooking,
    setViewingBooking,
  ] = useState(null);

  const [showBookingTicket, setShowBookingTicket] = useState(false);
  
  const [sendingBookingTicket, setSendingBookingTicket] =
  useState(false);

  const [
    availability,
    setAvailability,
  ] = useState([]);

  const [
    availabilityLoading,
    setAvailabilityLoading,
  ] = useState(false);

  const [
    timeConflict,
    setTimeConflict,
  ] = useState(false);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    dateFilter,
    setDateFilter,
  ] = useState("");

  const [form, setForm] =
    useState(EMPTY_FORM);

  // ===================================================
  // LOAD BOOKINGS
  // ===================================================

  const loadBookings =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await apiRequest(
            "/bookings",
          );

        setBookings(
          data.bookings || [],
        );
      } catch (err) {
        console.error(
          "Load bookings error:",
          err,
        );

        setError(
          err.message ||
            "Failed to load bookings.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // ===================================================
  // LOAD VENUES + CUSTOMERS
  // ===================================================

  const loadFormData =
    useCallback(async () => {
      try {
        const [
          venuesData,
          customersData,
        ] = await Promise.all([
          apiRequest("/venues"),
          apiRequest("/customers"),
        ]);

        setVenues(
          venuesData.venues || [],
        );

        setCustomers(
          customersData.customers || [],
        );
      } catch (err) {
        console.error(
          "Load booking form data error:",
          err,
        );

        setError(
          err.message ||
            "Failed to load venues and customers.",
        );
      }
    }, []);

  useEffect(() => {
    loadBookings();
    loadFormData();
  }, [
    loadBookings,
    loadFormData,
  ]);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      }),
    );
  };


  // ===================================================
// BOOKING PRICING
// ===================================================

const selectedVenue = venues.find(
  (venue) => venue._id === form.venueId
);

const selectedRate =
  form.pricingType === "daily"
    ? Number(selectedVenue?.pricing?.daily || 0)
    : Number(selectedVenue?.pricing?.hourly || 0);

let durationHours = 0;
let calculatedTotal = 0;

if (
  form.pricingType === "hourly" &&
  form.startTime &&
  form.endTime
) {
  const [startHour, startMinute] =
    form.startTime.split(":").map(Number);

  const [endHour, endMinute] =
    form.endTime.split(":").map(Number);

  const startMinutes =
    startHour * 60 + startMinute;

  const endMinutes =
    endHour * 60 + endMinute;

  const durationMinutes =
    endMinutes - startMinutes;

  if (durationMinutes > 0) {
    durationHours =
      durationMinutes / 60;

    calculatedTotal =
      durationHours * selectedRate;
  }
}

if (
  form.pricingType === "daily" &&
  selectedVenue
) {
  calculatedTotal = selectedRate;
}
  // ===================================================
  // AVAILABILITY
  // ===================================================

  const loadAvailability =
    useCallback(async () => {
      if (
        !form.venueId ||
        !form.bookingDate
      ) {
        setAvailability([]);
        return;
      }

      try {
        setAvailabilityLoading(
          true,
        );

        const data =
          await apiRequest(
            `/bookings/availability?venueId=${encodeURIComponent(
              form.venueId,
            )}&date=${encodeURIComponent(
              form.bookingDate,
            )}`,
          );

        setAvailability(
          data.bookings || [],
        );
      } catch (err) {
        console.error(
          "Load availability error:",
          err,
        );

        setAvailability([]);
      } finally {
        setAvailabilityLoading(
          false,
        );
      }
    }, [
      form.venueId,
      form.bookingDate,
    ]);

  useEffect(() => {
    if (showForm) {
      loadAvailability();
    }
  }, [
    showForm,
    loadAvailability,
  ]);

  useEffect(() => {
  if (viewingBooking) {
    console.log("VIEWING BOOKING:", viewingBooking);
    console.log("BUSINESS:", viewingBooking.businessId);
  }
}, [viewingBooking]);
  // ===================================================
  // TIME CONFLICT
  // ===================================================

  const checkTimeConflict =
    useCallback(() => {
      if (
        !form.startTime ||
        !form.endTime
      ) {
        setTimeConflict(false);
        return;
      }

      const conflict =
        availability.some(
          (booking) => {
            if (
              editingBooking &&
              booking._id ===
                editingBooking._id
            ) {
              return false;
            }

            return (
              form.startTime <
                booking.endTime &&
              form.endTime >
                booking.startTime
            );
          },
        );

      setTimeConflict(
        conflict,
      );
    }, [
      availability,
      form.startTime,
      form.endTime,
      editingBooking,
    ]);

  useEffect(() => {
    checkTimeConflict();
  }, [checkTimeConflict]);

  // ===================================================
  // ADD BOOKING
  // ===================================================

  const openAddForm = () => {
    setEditingBooking(null);

    setForm({
      ...EMPTY_FORM,

      bookingDate:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setAvailability([]);
    setTimeConflict(false);

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // ===================================================
  // EDIT BOOKING
  // ===================================================

  const openEditForm = (
    booking,
  ) => {
    const venueId =
      getIdValue(
        booking.venueId,
      );

    const customerId =
      getIdValue(
        booking.customerId,
      );

    const bookingDate =
      getDateInputValue(
        booking.bookingDate,
      );

    const startTime =
      getTimeInputValue(
        booking.startTime,
      );

    const endTime =
      getTimeInputValue(
        booking.endTime,
      );

    setEditingBooking(
      booking,
    );

    setForm({
      venueId,
      customerId,
      bookingDate,
      startTime,
      endTime,

  pricingType:
  booking.pricingType === "daily"
    ? "daily"
    : "hourly",
  
    status:
        typeof booking.status ===
        "string"
          ? booking.status
          : "pending",

      paymentStatus:
        typeof booking.paymentStatus ===
        "string"
          ? booking.paymentStatus
          : "unpaid",

      notes:
        typeof booking.notes ===
        "string"
          ? booking.notes
          : "",
    });

    setAvailability([]);
    setTimeConflict(false);

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // ===================================================
  // CLOSE FORM
  // ===================================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingBooking(null);

    setAvailability([]);
    setTimeConflict(false);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // ===================================================
  // CREATE / UPDATE BOOKING
  // ===================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (!form.venueId) {
        setError(
          "Please select a venue.",
        );
        return;
      }

      if (!form.customerId) {
        setError(
          "Please select a customer.",
        );
        return;
      }

      if (!form.bookingDate) {
        setError(
          "Booking date is required.",
        );
        return;
      }

      if (
        !form.startTime ||
        !form.endTime
      ) {
        setError(
          "Start time and end time are required.",
        );
        return;
      }

      if (
        form.startTime >=
        form.endTime
      ) {
        setError(
          "End time must be later than start time.",
        );
        return;
      }

      if (timeConflict) {
        setError(
          "The selected venue is already booked during the selected time. Please choose another time.",
        );
        return;
      }

    if (
  !["hourly", "daily"].includes(
    form.pricingType
  )
) {
  setError("Please select a valid pricing type.");
  return;
}

if (!selectedVenue) {
  setError("Please select a valid venue.");
  return;
}

if (form.pricingType === "hourly") {
  if (selectedRate <= 0) {
    setError(
      "This venue does not have a valid hourly rate."
    );
    return;
  }

  if (calculatedTotal <= 0) {
    setError(
      "Please select a valid booking duration."
    );
    return;
  }
}

if (form.pricingType === "daily") {
  if (selectedRate <= 0) {
    setError(
      "This venue does not have a valid daily rate."
    );
    return;
  }
}  

      try {
        setSaving(true);

        const bookingData = {
  venueId: form.venueId,

  customerId: form.customerId,

  bookingDate: form.bookingDate,

  startTime: form.startTime,

  endTime: form.endTime,

  pricingType: form.pricingType,

  status: form.status,

  paymentStatus: form.paymentStatus,

  notes: form.notes.trim(),
};

        const endpoint =
          editingBooking
            ? `/bookings/${editingBooking._id}`
            : "/bookings";

        const method =
          editingBooking
            ? "PATCH"
            : "POST";

        const data =
          await apiRequest(
            endpoint,
            {
              method,
              body: JSON.stringify(
                bookingData,
              ),
            },
          );

        if (editingBooking) {
          setBookings(
            (
              currentBookings,
            ) =>
              currentBookings.map(
                (booking) =>
                  booking._id ===
                  editingBooking._id
                    ? data.booking
                    : booking,
              ),
          );

          setSuccess(
            "Booking updated successfully.",
          );
        } else {
          setBookings(
            (
              currentBookings,
            ) => [
              data.booking,
              ...currentBookings,
            ],
          );

          setSuccess(
            "Booking created successfully.",
          );
        }

        setShowForm(false);
        setEditingBooking(null);

        setAvailability([]);
        setTimeConflict(false);

        setForm({
          ...EMPTY_FORM,
        });

        await loadBookings();
      } catch (err) {
        console.error(
          "Save booking error:",
          err,
        );

        setError(
          err.message ||
            (editingBooking
              ? "Failed to update booking."
              : "Failed to create booking."),
        );
      } finally {
        setSaving(false);
      }
    };

  // ===================================================
  // VIEW BOOKING
  // ===================================================

  const handleView = (
    booking,
  ) => {
    setViewingBooking(
      booking,
    );
  };

  const closeView = () => {
  setViewingBooking(null);
  setShowBookingTicket(false);
};

  // ===================================================
  // CANCEL BOOKING
  // ===================================================

  // ===================================================
// CANCEL BOOKING
// ===================================================


const handleCancel = async (booking) => {
  const customerName = getCustomerName(booking);
  const venueName = getVenueName(booking);

  const confirmed = window.confirm(
    `Cancel the booking for ${customerName} at ${venueName}?`
  );

  if (!confirmed) return;

  try {
    setError("");
    setSuccess("");

    const data = await apiRequest(
      `/bookings/${booking._id}/cancel`,
      { method: "PATCH" }
    );

    // Update the booking list.
    setBookings((currentBookings) =>
      currentBookings.map((item) =>
        item._id === booking._id ? data.booking : item
      )
    );

    // Update the open booking details if necessary.
    setViewingBooking((current) =>
      current && current._id === booking._id
        ? data.booking
        : current
    );

    // Send the cancellation email only once.
    try {
      await sendBookingCancellation(data.booking);

      setSuccess(
        "Booking cancelled successfully and cancellation email sent to the customer."
      );
    } catch (emailError) {
      console.error("Cancellation email error:", emailError);

      setSuccess(
        "Booking cancelled successfully, but the cancellation email could not be sent."
      );
    }
  } catch (err) {
    console.error("Cancel booking error:", err);

    setError(err.message || "Failed to cancel booking.");
  }
};


  // ===================================================
  // DELETE BOOKING
  // ===================================================

  const handleDelete =
    async (booking) => {
      const customerName =
        getCustomerName(
          booking,
        );

      const venueName =
        getVenueName(
          booking,
        );

      const confirmed =
        window.confirm(
          `Delete this booking permanently?\n\n` +
            `Customer: ${customerName}\n` +
            `Venue: ${venueName}\n` +
            `Date: ${formatDate(
              booking.bookingDate,
            )}\n` +
            `Time: ${booking.startTime} - ${booking.endTime}\n\n` +
            `This action cannot be undone.`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setSuccess("");

        await apiRequest(
          `/bookings/${booking._id}`,
          {
            method: "DELETE",
          },
        );

        setBookings(
          (
            currentBookings,
          ) =>
            currentBookings.filter(
              (item) =>
                item._id !==
                booking._id,
            ),
        );

        if (
          viewingBooking?._id ===
          booking._id
        ) {
          setViewingBooking(
            null,
          );
        }

        setSuccess(
          "Booking deleted successfully.",
        );
      } catch (err) {
        console.error(
          "Delete booking error:",
          err,
        );

        setError(
          err.message ||
            "Failed to delete booking.",
        );
      }
    };

  // ===================================================
  // FILTER BOOKINGS
  // ===================================================

  const filteredBookings =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {
          const customerName =
            getCustomerName(
              booking,
            );

          const venueName =
            getVenueName(
              booking,
            );

          const matchesSearch =
            !searchTerm ||
            customerName
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            venueName
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            (
              booking.notes ||
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              ) ||
            (
              booking.bookingNumber ||
              ""
            )
              .toLowerCase()
              .includes(
                searchTerm,
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            booking.status ===
              statusFilter;

          const bookingDate =
            booking.bookingDate
              ? new Date(
                  booking.bookingDate,
                )
                  .toISOString()
                  .split("T")[0]
              : "";

          const matchesDate =
            !dateFilter ||
            bookingDate ===
              dateFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesDate
          );
        },
      );
    }, [
      bookings,
      search,
      statusFilter,
      dateFilter,
    ]);

  // ===================================================
// SEND BOOKING TICKET
// ===================================================

const handleSendBookingTicket = async () => {
  if (!viewingBooking) {
    alert("No booking selected.");
    return;
  }

  const customerEmail =
    viewingBooking.customerId?.email;

  if (!customerEmail) {
    alert(
      "The selected customer does not have an email address."
    );
    return;
  }

  try {
    setSendingBookingTicket(true);

    console.log(
      "================================="
    );
    console.log(
      "SENDING BOOKING TICKET"
    );
    console.log(
      "================================="
    );

    console.log(
      "Booking:",
      viewingBooking
    );

    console.log(
      "Customer:",
      viewingBooking.customerId
    );

    console.log(
      "Customer Email:",
      customerEmail
    );

    console.log(
      "Business:",
      viewingBooking.businessId
    );

    console.log(
      "Venue:",
      viewingBooking.venueId
    );

    const response =
      await sendBookingConfirmation(
        viewingBooking
      );

    console.log(
      "================================="
    );
    console.log(
      "EMAILJS SUCCESS"
    );
    console.log(
      "================================="
    );

    console.log(
      "Status:",
      response?.status
    );

    console.log(
      "Text:",
      response?.text
    );

    console.log(
      "Full response:",
      response
    );

    alert(
      `Booking ticket sent successfully to ${customerEmail}.`
    );
  } catch (error) {
    console.error(
      "================================="
    );
    console.error(
      "EMAILJS FAILED"
    );
    console.error(
      "================================="
    );

    console.error(
      "Error:",
      error
    );

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

    alert(
      `Failed to send booking ticket.\n\n${
        error?.text ||
        error?.message ||
        "Unknown EmailJS error"
      }`
    );
  } finally {
    setSendingBookingTicket(false);
  }
};

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="bookings-page">

      {/* =============================================
          HEADER
      ============================================= */}

      <div className="bookings-header">
        <div>
          <h1>Bookings</h1>

          <p>
            Manage venue bookings for
            your business.
          </p>
        </div>

        <button
          type="button"
          className="booking-primary-button"
          onClick={
            openAddForm
          }
        >
          + New Booking
        </button>
      </div>

      {/* =============================================
          MESSAGES
      ============================================= */}

      {error && (
        <div className="booking-message booking-error">
          {error}
        </div>
      )}

      {success && (
        <div className="booking-message booking-success">
          {success}
        </div>
      )}

      {/* =============================================
          FILTERS
      ============================================= */}

      <div className="booking-toolbar">
        <input
          type="search"
          placeholder="Search booking number, customer, venue or notes..."
          value={search}
          onChange={(
            event,
          ) =>
            setSearch(
              event.target.value,
            )
          }
        />

        <select
          value={
            statusFilter
          }
          onChange={(
            event,
          ) =>
            setStatusFilter(
              event.target.value,
            )
          }
        >
          <option value="all">
            All statuses
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="confirmed">
            Confirmed
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>

        <input
          type="date"
          value={
            dateFilter
          }
          onChange={(
            event,
          ) =>
            setDateFilter(
              event.target.value,
            )
          }
        />

        {dateFilter && (
          <button
            type="button"
            className="booking-clear-filter"
            onClick={() =>
              setDateFilter("")
            }
          >
            Clear Date
          </button>
        )}
      </div>

      {/* =============================================
          BOOKINGS TABLE
      ============================================= */}

      {loading ? (
        <div className="booking-empty-state">
          <p>
            Loading bookings...
          </p>
        </div>
      ) : filteredBookings.length ===
        0 ? (
        <div className="booking-empty-state">
          <h2>
            No bookings found
          </h2>

          <p>
            {bookings.length ===
            0
              ? "Create your first booking to get started."
              : "Try changing your search or filters."}
          </p>

          {bookings.length ===
            0 && (
            <button
              type="button"
              className="booking-primary-button"
              onClick={
                openAddForm
              }
            >
              + Create First
              Booking
            </button>
          )}
        </div>
      ) : (
        <div className="booking-table-card">

          <div className="booking-table-wrapper">
            <table className="booking-table">

              <thead>
                <tr>
                  <th>
                    Booking #
                  </th>

                  <th>Date</th>

                  <th>Time</th>

                  <th>Venue</th>

                  <th>Customer</th>

                  <th>Amount</th>

                  <th>Payment</th>

                  <th>Status</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map(
                  (booking) => (
                    <tr
                      key={
                        booking._id
                      }
                    >

                      <td>
                        <strong>
                          {booking.bookingNumber ||
                            booking._id}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          booking.bookingDate,
                        )}
                      </td>

                      <td>
                        {
                          booking.startTime
                        }{" "}
                        –{" "}
                        {
                          booking.endTime
                        }
                      </td>

                      <td>
                        {getVenueName(
                          booking,
                        )}
                      </td>

                      <td>
                        {getCustomerName(
                          booking,
                        )}
                      </td>

                      <td>
                        {formatAmount(
                          booking.totalAmount,
                        )}
                      </td>

                      <td>
                        <span
                          className={`booking-payment booking-payment-${booking.paymentStatus}`}
                        >
                          {booking.paymentStatus ||
                            "unpaid"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`booking-status booking-status-${booking.status}`}
                        >
                          {booking.status ||
                            "pending"}
                        </span>
                      </td>

                      <td>
                        <div className="booking-actions">

                          <button
                            type="button"
                            className="booking-view-button"
                            onClick={() =>
                              handleView(
                                booking,
                              )
                            }
                          >
                            View
                          </button>

                          {(booking.status ===
                            "pending" ||
                            booking.status ===
                              "confirmed") && (
                            <>
                              <button
                                type="button"
                                className="booking-edit-button"
                                onClick={() =>
                                  openEditForm(
                                    booking,
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="booking-cancel-button"
                                onClick={() =>
                                  handleCancel(
                                    booking,
                                  )
                                }
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {booking.status !==
                            "completed" && (
                            <button
                              type="button"
                              className="booking-delete-button"
                              onClick={() =>
                                handleDelete(
                                  booking,
                                )
                              }
                            >
                              Delete
                            </button>
                          )}

                          {booking.status ===
                            "completed" && (
                            <span className="booking-action-status">
                              Completed
                            </span>
                          )}

                        </div>
                      </td>

                    </tr>
                  ),
                )}
              </tbody>

            </table>
          </div>

          <div className="booking-table-footer">
            Showing{" "}
            {
              filteredBookings.length
            }{" "}
            of{" "}
            {bookings.length}{" "}
            booking
            {bookings.length ===
            1
              ? ""
              : "s"}
          </div>

        </div>
      )}

      {/* =============================================
          CREATE / EDIT BOOKING MODAL
      ============================================= */}

      {showForm && (
        <div
          className="booking-modal-overlay"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="booking-modal">

            <div className="booking-modal-header">

              <div>
                <h2>
                  {editingBooking
                    ? "Edit Booking"
                    : "New Booking"}
                </h2>

                <p>
                  {editingBooking
                    ? "Update the booking details."
                    : "Create a new venue booking."}
                </p>
              </div>

              <button
                type="button"
                className="booking-close-button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="booking-form-grid">

                {/* VENUE */}

                <div className="booking-form-group">
                  <label htmlFor="booking-venue">
                    Venue *
                  </label>

                  <select
                    id="booking-venue"
                    name="venueId"
                    value={
                      form.venueId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  >
                    <option value="">
                      Select venue
                    </option>

                    {venues
                      .filter(
                        (
                          venue,
                        ) =>
                          venue.status ===
                          "active",
                      )
                      .map(
                        (
                          venue,
                        ) => (
                          <option
                            key={
                              venue._id
                            }
                            value={
                              venue._id
                            }
                          >
                            {
                              venue.name
                            }
                          </option>
                        ),
                      )}
                  </select>
                </div>



{/* PRICING TYPE */}
<div className="booking-form-group">
  <label htmlFor="booking-pricing-type">
    Pricing Type *
  </label>

  <select
    id="booking-pricing-type"
    name="pricingType"
    value={form.pricingType}
    onChange={handleChange}
    disabled={saving}
  >
    <option value="hourly">Hourly</option>
    <option value="daily">Daily</option>
  </select>
</div>

                {/* CUSTOMER */}

                <div className="booking-form-group">
                  <label htmlFor="booking-customer">
                    Customer *
                  </label>

                  <select
                    id="booking-customer"
                    name="customerId"
                    value={
                      form.customerId
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  >
                    <option value="">
                      Select customer
                    </option>

                    {customers.length ===
                    0 ? (
                      <option
                        value=""
                        disabled
                      >
                        No customers
                        available
                      </option>
                    ) : (
                      customers.map(
                        (
                          customer,
                        ) => (
                          <option
                            key={
                              customer._id
                            }
                            value={
                              customer._id
                            }
                          >
                            {
                              customer.firstName
                            }{" "}
                            {
                              customer.lastName
                            }
                            {customer.organization
                              ? ` — ${customer.organization}`
                              : ""}
                          </option>
                        ),
                      )
                    )}
                  </select>
                </div>

                {/* DATE */}

                <div className="booking-form-group">
                  <label htmlFor="booking-date">
                    Booking Date *
                  </label>

                  <input
                    id="booking-date"
                    name="bookingDate"
                    type="date"
                    value={
                      form.bookingDate
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  />
                </div>

                {/* AVAILABILITY */}

                {form.venueId &&
                  form.bookingDate && (
                    <div className="booking-availability booking-full">

                      <div className="booking-availability-header">
                        <div>

                          <h3>
                            Existing
                            Bookings
                          </h3>

                          <p>
                            {availabilityLoading
                              ? "Checking availability..."
                              : availability.filter(
                                    (
                                      item,
                                    ) =>
                                      !editingBooking ||
                                      item._id !==
                                        editingBooking._id,
                                  ).length ===
                                  0
                                ? "No bookings for this venue on this date."
                                : "The following times are already booked."}
                          </p>

                        </div>
                      </div>

                      {!availabilityLoading &&
                        availability.filter(
                          (
                            item,
                          ) =>
                            !editingBooking ||
                            item._id !==
                              editingBooking._id,
                        ).length >
                          0 && (
                          <div className="booking-availability-list">

                            {availability
                              .filter(
                                (
                                  item,
                                ) =>
                                  !editingBooking ||
                                  item._id !==
                                    editingBooking._id,
                              )
                              .map(
                                (
                                  item,
                                ) => (
                                  <div
                                    className="booking-availability-item"
                                    key={
                                      item._id
                                    }
                                  >

                                    <strong>
                                      {
                                        item.startTime
                                      }{" "}
                                      –{" "}
                                      {
                                        item.endTime
                                      }
                                    </strong>

                                    <span>
                                      {getCustomerName(
                                        item,
                                      )}
                                    </span>

                                    <span
                                      className={`booking-status booking-status-${item.status}`}
                                    >
                                      {
                                        item.status
                                      }
                                    </span>

                                  </div>
                                ),
                              )}

                          </div>
                        )}

                      {timeConflict && (
                        <div className="booking-time-conflict">

                          <strong>
                            Time
                            unavailable
                          </strong>

                          <span>
                            The selected
                            venue is
                            already booked
                            during this
                            time period.
                          </span>

                        </div>
                      )}

                    </div>
                  )}

                {/* STATUS */}

                <div className="booking-form-group">
                  <label htmlFor="booking-status">
                    Status
                  </label>

                  <select
                    id="booking-status"
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    {editingBooking && (
                      <option value="completed">
                        Completed
                      </option>
                    )}
                  </select>
                </div>

                {/* START TIME */}

                <div className="booking-form-group">
                  <label htmlFor="booking-start">
                    Start Time *
                  </label>

                  <input
                    id="booking-start"
                    name="startTime"
                    type="time"
                    value={
                      form.startTime
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  />
                </div>

                {/* END TIME */}

                <div className="booking-form-group">
                  <label htmlFor="booking-end">
                    End Time *
                  </label>

                  <input
                    id="booking-end"
                    name="endTime"
                    type="time"
                    value={
                      form.endTime
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  />

                  {timeConflict && (
                    <div className="booking-time-conflict">

                      <strong>
                        Time
                        unavailable
                      </strong>

                      <span>
                        Please select
                        another time.
                      </span>

                    </div>
                  )}
                </div>

               {/* PRICING SUMMARY */}

<div className="booking-pricing-summary booking-full">
  <div className="booking-pricing-header">
    <strong>Booking Pricing</strong>
  </div>

  {!selectedVenue ? (
    <p>
      Select a venue to view pricing.
    </p>
  ) : (
    <>
      <div className="booking-pricing-row">
        <span>Pricing Type</span>

        <strong>
          {form.pricingType === "daily"
            ? "Daily"
            : "Hourly"}
        </strong>
      </div>

      <div className="booking-pricing-row">
        <span>Rate</span>

        <strong>
          {formatAmount(selectedRate)}
          {form.pricingType === "daily"
            ? " / day"
            : " / hour"}
        </strong>
      </div>

      {form.pricingType === "hourly" && (
        <div className="booking-pricing-row">
          <span>Duration</span>

          <strong>
            {durationHours > 0
              ? `${durationHours} ${
                  durationHours === 1
                    ? "hour"
                    : "hours"
                }`
              : "—"}
          </strong>
        </div>
      )}

      <div className="booking-pricing-total">
        <span>Total Amount</span>

        <strong>
          {formatAmount(calculatedTotal)}
        </strong>
      </div>
    </>
  )}
</div>

                {/* PAYMENT */}

                <div className="booking-form-group">
                  <label htmlFor="booking-payment">
                    Payment Status
                  </label>

                  <select
                    id="booking-payment"
                    name="paymentStatus"
                    value={
                      form.paymentStatus
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  >
                    <option value="unpaid">
                      Unpaid
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="paid">
                      Paid
                    </option>

                    <option value="refunded">
                      Refunded
                    </option>
                  </select>
                </div>

                {/* NOTES */}

                <div className="booking-form-group booking-full">

                  <label htmlFor="booking-notes">
                    Notes
                  </label>

                  <textarea
                    id="booking-notes"
                    name="notes"
                    rows="4"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Additional booking notes..."
                    disabled={
                      saving
                    }
                  />

                </div>

              </div>

              {/* FORM ACTIONS */}

              <div className="booking-form-actions">

                <button
                  type="button"
                  className="booking-cancel-form-button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="booking-primary-button"
                  disabled={
                    saving ||
                    timeConflict
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingBooking
                      ? "Update Booking"
                      : "Create Booking"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =============================================
          VIEW BOOKING MODAL
      ============================================= */}

      {viewingBooking && (
        <div
          className="booking-modal-overlay"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeView();
            }
          }}
        >

         <div className="booking-modal booking-details-modal">

  {/* =========================================
      MODAL HEADER
  ========================================= */}

  <div className="booking-modal-header">

    <div>
      <h2>
        Booking Details
      </h2>

      <p>
        View and manage booking information.
      </p>
    </div>

    <button
      type="button"
      className="booking-close-button"
      onClick={closeView}
      aria-label="Close booking details"
      title="Close"
    >
      ×
    </button>

  </div>


  {/* Booking details and ticket share one scrollable area. */}
  <div className="booking-details-scroll">

  {/* =========================================
      BOOKING INFORMATION
  ========================================= */}

  <div className="booking-details">

    {/* -----------------------------------------
        BOOKING NUMBER
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Booking Number
      </span>

      <strong>
        {viewingBooking.bookingNumber ||
          viewingBooking._id ||
          "N/A"}
      </strong>

    </div>


    {/* -----------------------------------------
        CUSTOMER
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Customer
      </span>

      <strong>
        {getCustomerName(viewingBooking)}
      </strong>

    </div>


    {/* -----------------------------------------
        CUSTOMER EMAIL
    ----------------------------------------- */}

    {viewingBooking.customerId?.email && (
      <div className="booking-detail-row">

        <span>
          Customer Email
        </span>

        <strong>
          {viewingBooking.customerId.email}
        </strong>

      </div>
    )}


    {/* -----------------------------------------
        CUSTOMER PHONE
    ----------------------------------------- */}

    {viewingBooking.customerId?.phone && (
      <div className="booking-detail-row">

        <span>
          Customer Phone
        </span>

        <strong>
          {viewingBooking.customerId.phone}
        </strong>

      </div>
    )}


    {/* -----------------------------------------
        ORGANISATION
    ----------------------------------------- */}

    {viewingBooking.customerId?.organization && (
      <div className="booking-detail-row">

        <span>
          Organisation
        </span>

        <strong>
          {viewingBooking.customerId.organization}
        </strong>

      </div>
    )}


    {/* -----------------------------------------
        VENUE
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Venue
      </span>

      <strong>
        {getVenueName(viewingBooking)}
      </strong>

    </div>


    {/* -----------------------------------------
        BOOKING DATE
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Date
      </span>

      <strong>
        {formatDate(
          viewingBooking.bookingDate
        )}
      </strong>

    </div>


    {/* -----------------------------------------
        BOOKING TIME
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Time
      </span>

      <strong>
        {viewingBooking.startTime || "—"}
        {" - "}
        {viewingBooking.endTime || "—"}
      </strong>

    </div>

    {/* -----------------------------------------
    PRICING TYPE
----------------------------------------- */}

<div className="booking-detail-row">
  <span>
    Pricing Type
  </span>

  <strong>
    {viewingBooking.pricingType === "daily"
      ? "Daily"
      : "Hourly"}
  </strong>
</div>

{/* -----------------------------------------
    VENUE RATE
----------------------------------------- */}

<div className="booking-detail-row">
  <span>
    Rate
  </span>

  <strong>
    {(() => {
      const venue =
        typeof viewingBooking.venueId === "object"
          ? viewingBooking.venueId
          : null;

      const pricingType =
        viewingBooking.pricingType === "daily"
          ? "daily"
          : "hourly";

      const rate =
        Number(
          venue?.pricing?.[pricingType] || 0
        );

      return (
        <>
          {formatAmount(rate)}
          {pricingType === "daily"
            ? " / day"
            : " / hour"}
        </>
      );
    })()}
  </strong>
</div>

{/* -----------------------------------------
    DURATION
----------------------------------------- */}

{viewingBooking.pricingType !== "daily" &&
  viewingBooking.startTime &&
  viewingBooking.endTime && (
    <div className="booking-detail-row">
      <span>
        Duration
      </span>

      <strong>
        {(() => {
          const [startHour, startMinute] =
            viewingBooking.startTime
              .split(":")
              .map(Number);

          const [endHour, endMinute] =
            viewingBooking.endTime
              .split(":")
              .map(Number);

          const startMinutes =
            startHour * 60 + startMinute;

          const endMinutes =
            endHour * 60 + endMinute;

          const durationMinutes =
            endMinutes - startMinutes;

          if (durationMinutes <= 0) {
            return "—";
          }

          const hours =
            durationMinutes / 60;

          return `${hours} ${
            hours === 1 ? "hour" : "hours"
          }`;
        })()}
      </strong>
    </div>
  )}

    {/* -----------------------------------------
        TOTAL AMOUNT
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Total Amount
      </span>

      <strong>
        {formatAmount(
          viewingBooking.totalAmount
        )}
      </strong>

    </div>


    {/* -----------------------------------------
        PAYMENT STATUS
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Payment Status
      </span>

      <strong>
        {viewingBooking.paymentStatus ||
          "unpaid"}
      </strong>

    </div>


    {/* -----------------------------------------
        BOOKING STATUS
    ----------------------------------------- */}

    <div className="booking-detail-row">

      <span>
        Booking Status
      </span>

      <strong>
        {viewingBooking.status ||
          "pending"}
      </strong>

    </div>


    {/* -----------------------------------------
        NOTES
    ----------------------------------------- */}

    <div className="booking-detail-row booking-detail-notes">

      <span>
        Notes
      </span>

      <strong>
        {viewingBooking.notes ||
          "No notes"}
      </strong>

    </div>

  </div>


  {/* =========================================
      BOOKING TICKET PREVIEW

      The ticket is NOT rendered until the
      user clicks "Prepare Booking Ticket".
  ========================================= */}

 {/* {showBookingTicket && (

  <button
    type="button"
    className="booking-primary-button"
    onClick={handleSendBookingTicket}
    disabled={sendingBookingTicket}
  >
    {sendingBookingTicket
      ? "Sending..."
      : "Send Booking Ticket"}
  </button>

)} */}

{showBookingTicket && (

  <div className="booking-ticket-preview">
    <BookingTicket booking={viewingBooking} />

<button
  type="button"
  className="booking-primary-button"
  onClick={handleSendBookingTicket}
  disabled={sendingBookingTicket}
>
  {sendingBookingTicket
    ? "Sending..."
    : "Send Booking Ticket"}
</button>

  </div>
)}

  </div>{/* end booking-details-scroll */}

  {/* =========================================
      VIEW ACTIONS
  ========================================= */}

  <div className="booking-form-actions booking-details-actions">


    {/* -----------------------------------------
        CLOSE
    ----------------------------------------- */}

    <button
      type="button"
      className="booking-cancel-form-button"
      onClick={closeView}
    >
      Close
    </button>


    {/* -----------------------------------------
        PREPARE BOOKING TICKET

        Only displayed before the ticket
        has been prepared.
    ----------------------------------------- */}

    {!showBookingTicket && (

      <button
        type="button"
        className="booking-primary-button"
        onClick={() => {

          setShowBookingTicket(true);

        }}
      >
        Prepare Booking Ticket
      </button>

    )}


    {/* -----------------------------------------
        SEND BOOKING TICKET

        Only displayed after the ticket
        has been prepared.
    ----------------------------------------- */}

    {/* {showBookingTicket &&
  viewingBooking.status !== "cancelled" && (

      <button
        type="button"
        className="booking-primary-button"
        onClick={() => {

          console.log(
            "Ready to send booking ticket:",
            viewingBooking
          );

        }}
      >
        Send Booking Ticket
      </button>

    )} */}


    {/* -----------------------------------------
        EDIT BOOKING

        Available for pending and confirmed
        bookings.
    ----------------------------------------- */}

    {(viewingBooking.status === "pending" ||
      viewingBooking.status === "confirmed") && (

      <button
        type="button"
        className="booking-primary-button"
        onClick={() => {

          const booking =
            viewingBooking;

          closeView();

          openEditForm(
            booking
          );

        }}
      >
        Edit Booking
      </button>

    )}

  </div>

</div> 

          
        </div>
      )}

    </div>
  );
}

export default Bookings;
