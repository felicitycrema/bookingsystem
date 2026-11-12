/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api.js";

const EMPTY_FORM = {
  name: "",
  description: "",
  capacity: "",
  building: "",
  floor: "",
  room: "",
  hourlyPricing: "",
  dailyPricing: "",
  amenities: "",
  status: "active",
};

function Venues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState(EMPTY_FORM);

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (price) => {
    const amount = Number(price || 0);

    return `R${amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // =====================================================
  // FORMAT LOCATION
  // =====================================================

  const formatLocation = (location) => {
    if (!location) {
      return "—";
    }

    if (typeof location === "string") {
      return location;
    }

    if (typeof location === "object") {
      return (
        [
          location.building,
          location.floor,
          location.room,
        ]
          .filter(Boolean)
          .join(" • ") || "—"
      );
    }

    return "—";
  };

  // =====================================================
  // LOAD VENUES
  // =====================================================

  const loadVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/venues");

      setVenues(data.venues || []);
    } catch (err) {
      console.error("Load venues error:", err);

      setError(err.message || "Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingVenue(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (venue) => {
  setEditingVenue(venue);

  setForm({
    name: venue.name || "",
    description: venue.description || "",
    capacity: venue.capacity ?? "",

    building: venue.location?.building || "",
    floor: venue.location?.floor || "",
    room: venue.location?.room || "",

    hourlyPricing: venue.pricing?.hourly ?? "",
    dailyPricing: venue.pricing?.daily ?? "",

    amenities: Array.isArray(venue.amenities)
      ? venue.amenities.join(", ")
      : venue.amenities || "",

    status: venue.status || "active",
  });

  setError("");
  setSuccess("");
  setShowForm(true);
};

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingVenue(null);
    setForm({ ...EMPTY_FORM });
  };

  // =====================================================
  // SAVE VENUE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Venue name is required.");
      return;
    }

    if (!form.capacity || Number(form.capacity) <= 0) {
      setError("Capacity must be greater than zero.");
      return;
    }

    if (
      form.pricing !== "" &&
      Number(form.pricing) < 0
    ) {
      setError("Price cannot be negative.");
      return;
    }

    try {
      setSaving(true);

const venueData = {
  name: form.name.trim(),

  description: form.description.trim(),

  capacity: Number(form.capacity),

  location: {
    building: form.building.trim(),
    floor: form.floor.trim(),
    room: form.room.trim(),
  },

  pricing: {
    hourly:
      form.hourlyPricing === ""
        ? 0
        : Number(form.hourlyPricing),

    daily:
      form.dailyPricing === ""
        ? 0
        : Number(form.dailyPricing),
  },

  amenities: form.amenities
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),

  status: form.status,
};

      if (editingVenue) {
        const data = await apiRequest(
          `/venues/${editingVenue._id}`,
          {
            method: "PATCH",
            body: JSON.stringify(venueData),
          },
        );

        setVenues((currentVenues) =>
          currentVenues.map((venue) =>
            venue._id === editingVenue._id
              ? data.venue
              : venue,
          ),
        );

        setSuccess("Venue updated successfully.");
      } else {
        const data = await apiRequest("/venues", {
          method: "POST",
          body: JSON.stringify(venueData),
        });

        setVenues((currentVenues) => [
          data.venue,
          ...currentVenues,
        ]);

        setSuccess("Venue added successfully.");
      }

      setShowForm(false);
      setEditingVenue(null);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      console.error("Save venue error:", err);

      setError(err.message || "Failed to save venue");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE VENUE
  // =====================================================

  const handleDelete = async (venue) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${venue.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/venues/${venue._id}`, {
        method: "DELETE",
      });

      setVenues((currentVenues) =>
        currentVenues.filter(
          (item) => item._id !== venue._id,
        ),
      );

      setSuccess("Venue deleted successfully.");
    } catch (err) {
      console.error("Delete venue error:", err);

      setError(err.message || "Failed to delete venue");
    }
  };

  // =====================================================
  // FILTER VENUES
  // =====================================================

  const filteredVenues = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return venues.filter((venue) => {
      const locationText = formatLocation(
        venue.location,
      );

      const matchesSearch =
        !searchTerm ||
        venue.name
          ?.toLowerCase()
          .includes(searchTerm) ||
        locationText
          .toLowerCase()
          .includes(searchTerm) ||
        venue.description
          ?.toLowerCase()
          .includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        venue.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [venues, search, statusFilter]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="venues-page">
      <div className="venues-header">
        <div>
          <h1>Venues</h1>

          <p>
            Manage the venues available for your bookings.
          </p>
        </div>

        <button
          type="button"
          className="venue-primary-button"
          onClick={openAddForm}
        >
          + Add Venue
        </button>
      </div>

      {error && (
        <div className="venue-message venue-error">
          {error}
        </div>
      )}

      {success && (
        <div className="venue-message venue-success">
          {success}
        </div>
      )}

      <div className="venue-toolbar">
        <input
          type="search"
          placeholder="Search venues..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="venue-empty-state">
          <p>Loading venues...</p>
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="venue-empty-state">
          <h2>No venues found</h2>

          <p>
            {venues.length === 0
              ? "Add your first venue to get started."
              : "Try changing your search or status filter."}
          </p>

          {venues.length === 0 && (
            <button
              type="button"
              className="venue-primary-button"
              onClick={openAddForm}
            >
              + Add Your First Venue
            </button>
          )}
        </div>
      ) : (
        <div className="venue-table-card">
          <div className="venue-table-wrapper">
            <table className="venue-table">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Pricing</th>
                  <th>Amenities</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVenues.map((venue) => (
                  <tr key={venue._id}>
                    <td>
                      <div className="venue-name">
                        {venue.name}
                      </div>

                      {venue.description && (
                        <div className="venue-description">
                          {venue.description}
                        </div>
                      )}
                    </td>

                    <td>{venue.capacity}</td>

                    <td>
                      {formatLocation(venue.location)}
                    </td>

                    <td>
                       {/* {formatPrice(venue.pricing)} */}
<div className="venue-pricing-display">
  <div>
    <strong>
      {formatPrice(venue.pricing?.hourly)}
    </strong>
    <span>/hour</span>
  </div>

  <div>
    <strong>
      {formatPrice(venue.pricing?.daily)}
    </strong>
    <span>/day</span>
  </div>
</div>
                    </td>

                    <td>
                      {Array.isArray(
                        venue.amenities,
                      ) &&
                      venue.amenities.length > 0 ? (
                        <div className="venue-amenities">
                          {venue.amenities
                            .slice(0, 3)
                            .map((amenity) => (
                              <span key={amenity}>
                                {amenity}
                              </span>
                            ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <span
                        className={`venue-status venue-status-${venue.status}`}
                      >
                        {venue.status || "active"}
                      </span>
                    </td>

                    <td>
                      <div className="venue-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(venue)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="venue-delete-button"
                          onClick={() =>
                            handleDelete(venue)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="venue-table-footer">
            Showing {filteredVenues.length} of{" "}
            {venues.length} venue
            {venues.length === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {/* =================================================
          ADD / EDIT VENUE MODAL
      ================================================= */}

      {showForm && (
        <div
          className="venue-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="venue-modal">
            <div className="venue-modal-header">
              <div>
                <h2>
                  {editingVenue
                    ? "Edit Venue"
                    : "Add Venue"}
                </h2>

                <p>
                  {editingVenue
                    ? "Update the venue information."
                    : "Add a new venue to your business."}
                </p>
              </div>

              <button
                type="button"
                className="venue-close-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="venue-form-grid">
                {/* VENUE NAME */}

                <div className="venue-form-group venue-full">
                  <label htmlFor="venue-name">
                    Venue Name *
                  </label>

                  <input
                    id="venue-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Diamond Hall"
                    disabled={saving}
                  />
                </div>

                {/* CAPACITY */}

                <div className="venue-form-group">
                  <label htmlFor="venue-capacity">
                    Capacity *
                  </label>

                  <input
                    id="venue-capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="300"
                    disabled={saving}
                  />
                </div>

                {/* PRICE */}

                {/* HOURLY PRICE */}

<div className="venue-form-group">
  <label htmlFor="venue-hourly-pricing">
    Price per Hour
  </label>

  <input
    id="venue-hourly-pricing"
    name="hourlyPricing"
    type="number"
    min="0"
    step="0.01"
    value={form.hourlyPricing}
    onChange={handleChange}
    placeholder="250"
    disabled={saving}
  />
</div>

{/* DAILY PRICE */}

<div className="venue-form-group">
  <label htmlFor="venue-daily-pricing">
    Price per Day
  </label>

  <input
    id="venue-daily-pricing"
    name="dailyPricing"
    type="number"
    min="0"
    step="0.01"
    value={form.dailyPricing}
    onChange={handleChange}
    placeholder="2500"
    disabled={saving}
  />
</div>

                {/* BUILDING */}

                <div className="venue-form-group">
                  <label htmlFor="venue-building">
                    Building
                  </label>

                  <input
                    id="venue-building"
                    name="building"
                    value={form.building}
                    onChange={handleChange}
                    placeholder="Main Building"
                    disabled={saving}
                  />
                </div>

                {/* FLOOR */}

                <div className="venue-form-group">
                  <label htmlFor="venue-floor">
                    Floor
                  </label>

                  <input
                    id="venue-floor"
                    name="floor"
                    value={form.floor}
                    onChange={handleChange}
                    placeholder="Ground Floor"
                    disabled={saving}
                  />
                </div>

                {/* ROOM */}

                <div className="venue-form-group">
                  <label htmlFor="venue-room">
                    Room / Hall
                  </label>

                  <input
                    id="venue-room"
                    name="room"
                    value={form.room}
                    onChange={handleChange}
                    placeholder="Hall A"
                    disabled={saving}
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="venue-form-group venue-full">
                  <label htmlFor="venue-description">
                    Description
                  </label>

                  <textarea
                    id="venue-description"
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the venue..."
                    disabled={saving}
                  />
                </div>

                {/* AMENITIES */}

                <div className="venue-form-group venue-full">
                  <label htmlFor="venue-amenities">
                    Amenities
                  </label>

                  <input
                    id="venue-amenities"
                    name="amenities"
                    value={form.amenities}
                    onChange={handleChange}
                    placeholder="Parking, Wi-Fi, Projector"
                    disabled={saving}
                  />

                  <small>
                    Separate amenities with commas.
                  </small>
                </div>

                {/* STATUS */}

                <div className="venue-form-group">
                  <label htmlFor="venue-status">
                    Status
                  </label>

                  <select
                    id="venue-status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              {/* FORM ACTIONS */}

              <div className="venue-form-actions">
                <button
                  type="button"
                  className="venue-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="venue-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingVenue
                      ? "Save Changes"
                      : "Add Venue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Venues;