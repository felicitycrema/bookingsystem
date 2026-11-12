/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api.js";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organization: "",
  status: "active",
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState(EMPTY_FORM);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/customers");

      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Load customers error:", err);
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingCustomer(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (customer) => {
    setEditingCustomer(customer);

    setForm({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      organization: customer.organization || "",
      status: customer.status || "active",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCustomer(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email address is required.");
      return;
    }

    try {
      setSaving(true);

      const customerData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        organization: form.organization.trim(),
        status: form.status,
      };

      if (editingCustomer) {
        const data = await apiRequest(
          `/customers/${editingCustomer._id}`,
          {
            method: "PUT",
            body: JSON.stringify(customerData),
          },
        );

        setCustomers((currentCustomers) =>
          currentCustomers.map((customer) =>
            customer._id === editingCustomer._id
              ? data.customer
              : customer,
          ),
        );

        setSuccess("Customer updated successfully.");
      } else {
        const data = await apiRequest("/customers", {
          method: "POST",
          body: JSON.stringify(customerData),
        });

        setCustomers((currentCustomers) => [
          data.customer,
          ...currentCustomers,
        ]);

        setSuccess("Customer added successfully.");
      }

      setShowForm(false);
      setEditingCustomer(null);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      console.error("Save customer error:", err);
      setError(err.message || "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.firstName} ${customer.lastName}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/customers/${customer._id}`, {
        method: "DELETE",
      });

      setCustomers((currentCustomers) =>
        currentCustomers.filter(
          (item) => item._id !== customer._id,
        ),
      );

      setSuccess("Customer deleted successfully.");
    } catch (err) {
      console.error("Delete customer error:", err);
      setError(err.message || "Failed to delete customer.");
    }
  };

  const filteredCustomers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const fullName =
        `${customer.firstName || ""} ${customer.lastName || ""}`.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        fullName.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm) ||
        customer.organization?.toLowerCase().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1>Customers</h1>
          <p>
            Manage the customers who make bookings with your business.
          </p>
        </div>

        <button
          type="button"
          className="customer-primary-button"
          onClick={openAddForm}
        >
          + Add Customer
        </button>
      </div>

      {error && (
        <div className="customer-message customer-error">
          {error}
        </div>
      )}

      {success && (
        <div className="customer-message customer-success">
          {success}
        </div>
      )}

      <div className="customer-toolbar">
        <input
          type="search"
          placeholder="Search customers..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="customer-empty-state">
          <p>Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="customer-empty-state">
          <h2>No customers found</h2>

          <p>
            {customers.length === 0
              ? "Add your first customer to get started."
              : "Try changing your search or status filter."}
          </p>

          {customers.length === 0 && (
            <button
              type="button"
              className="customer-primary-button"
              onClick={openAddForm}
            >
              + Add Your First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="customer-table-card">
          <div className="customer-table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <div className="customer-name">
                        {customer.firstName} {customer.lastName}
                      </div>
                    </td>

                    <td>
                      {customer.email || "—"}
                    </td>

                    <td>
                      {customer.phone || "—"}
                    </td>

                    <td>
                      {customer.organization || "—"}
                    </td>

                    <td>
                      <span
                        className={`customer-status customer-status-${customer.status}`}
                      >
                        {customer.status || "active"}
                      </span>
                    </td>

                    <td>
                      <div className="customer-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(customer)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="customer-delete-button"
                          onClick={() => handleDelete(customer)}
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

          <div className="customer-table-footer">
            Showing {filteredCustomers.length} of{" "}
            {customers.length} customer
            {customers.length === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="customer-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="customer-modal">
            <div className="customer-modal-header">
              <div>
                <h2>
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p>
                  {editingCustomer
                    ? "Update the customer information."
                    : "Add a new customer to your business."}
                </p>
              </div>

              <button
                type="button"
                className="customer-close-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label htmlFor="customer-firstName">
                    First Name *
                  </label>

                  <input
                    id="customer-firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Peter"
                    disabled={saving}
                  />
                </div>

                <div className="customer-form-group">
                  <label htmlFor="customer-lastName">
                    Last Name *
                  </label>

                  <input
                    id="customer-lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Molefe"
                    disabled={saving}
                  />
                </div>

                <div className="customer-form-group">
                  <label htmlFor="customer-email">
                    Email *
                  </label>

                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                    disabled={saving}
                  />
                </div>

                <div className="customer-form-group">
                  <label htmlFor="customer-phone">
                    Phone
                  </label>

                  <input
                    id="customer-phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="071 234 5678"
                    disabled={saving}
                  />
                </div>

                <div className="customer-form-group customer-full">
                  <label htmlFor="customer-organization">
                    Organization
                  </label>

                  <input
                    id="customer-organization"
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                    placeholder="ABC Events"
                    disabled={saving}
                  />
                </div>

                <div className="customer-form-group">
                  <label htmlFor="customer-status">
                    Status
                  </label>

                  <select
                    id="customer-status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="customer-form-actions">
                <button
                  type="button"
                  className="customer-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                      ? "Save Changes"
                      : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;