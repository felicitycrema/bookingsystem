import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

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

function formatCurrency(amount) {
  const value = Number(amount || 0);

  return `R${value.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusClass(status) {
  switch (status) {
    case "active":
      return "subscription-status active";

    case "trial":
      return "subscription-status trial";

    case "expired":
      return "subscription-status expired";

    case "past_due":
      return "subscription-status warning";

    case "suspended":
      return "subscription-status expired";

    case "cancelled":
      return "subscription-status expired";

    default:
      return "subscription-status";
  }
}

function UsageCard({ title, current, limit, percentage }) {
  const unlimited = limit === -1;

  return (
    <div className="subscription-usage-card">
      <div className="subscription-usage-header">
        <span>{title}</span>

        <strong>
          {current} / {unlimited ? "Unlimited" : limit}
        </strong>
      </div>

      <div className="subscription-progress">
        <div
          className="subscription-progress-bar"
          style={{
            width: `${unlimited ? 0 : percentage}%`,
          }}
        />
      </div>

      <div className="subscription-usage-footer">
        {unlimited
          ? "Unlimited usage"
          : `${percentage}% used`}
      </div>
    </div>
  );
}

export default function Subscription() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [changingPlan, setChangingPlan] =
    useState(false);

  const [selectedBillingCycle, setSelectedBillingCycle] =
    useState("monthly");

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        "/subscriptions/dashboard"
      );

      setDashboard(data);

      if (data.subscription?.billingCycle) {
        setSelectedBillingCycle(
          data.subscription.billingCycle
        );
      }
    } catch (err) {
      console.error(
        "Subscription dashboard error:",
        err
      );

      setError(
        err.message ||
          "Failed to load subscription."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const handleChangePlan = async (plan) => {
    if (!plan?._id && !plan?.id) {
      return;
    }

    const planId =
      plan.id || plan._id;

    const confirmed = window.confirm(
      `Change your subscription to the ${plan.name} plan?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setChangingPlan(true);
      setError("");

      await apiRequest(
        "/subscriptions/my/subscription/plan",
        {
          method: "PATCH",

          body: JSON.stringify({
            planId,
            billingCycle:
              selectedBillingCycle,
          }),
        }
      );

      await loadSubscription();

      alert(
        "Subscription plan updated successfully."
      );
    } catch (err) {
      console.error(
        "Change plan error:",
        err
      );

      setError(
        err.message ||
          "Failed to change subscription plan."
      );
    } finally {
      setChangingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="subscription-loading">
          Loading subscription...
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="subscription-page">
        <div className="subscription-error">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const {
    business,
    subscription,
    plan,
    usage,
    warnings,
  } = dashboard;

  return (
    <div className="subscription-page">

      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <div className="subscription-page-header">

        <div>
          <h1>Subscription</h1>

          <p>
            Manage your subscription,
            billing and account usage.
          </p>
        </div>

      </div>


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="subscription-error">
          {error}
        </div>
      )}


      {/* ================================================= */}
      {/* WARNINGS */}
      {/* ================================================= */}

      {warnings?.length > 0 && (
        <div className="subscription-warnings">

          {warnings.map(
            (warning, index) => (
              <div
                key={`${warning.type}-${index}`}
                className="subscription-warning"
              >
                {warning.message}
              </div>
            )
          )}

        </div>
      )}


      {/* ================================================= */}
      {/* CURRENT PLAN */}
      {/* ================================================= */}

      <section className="subscription-current-card">

        <div className="subscription-card-header">

          <div>
            <span className="subscription-label">
              CURRENT PLAN
            </span>

            <h2>{plan.name}</h2>
          </div>

          <span
            className={getStatusClass(
              subscription.status
            )}
          >
            {subscription.status}
          </span>

        </div>


        <div className="subscription-plan-details">

          <div>
            <span>Monthly Price</span>

            <strong>
              {formatCurrency(
                plan.priceMonthly
              )}
            </strong>
          </div>

          <div>
            <span>Yearly Price</span>

            <strong>
              {formatCurrency(
                plan.priceYearly
              )}
            </strong>
          </div>

          <div>
            <span>Billing Cycle</span>

            <strong>
              {subscription.billingCycle}
            </strong>
          </div>

          <div>
            <span>Days Remaining</span>

            <strong>
              {subscription.daysRemaining ??
                "—"}
            </strong>
          </div>

        </div>


        <div className="subscription-dates">

          <div>
            <span>Subscription Start</span>

            <strong>
              {formatDate(
                subscription.startDate
              )}
            </strong>
          </div>

          {subscription.status === "trial" ? (
            <div>
              <span>Trial Ends</span>

              <strong>
                {formatDate(
                  subscription.trialEndDate
                )}
              </strong>
            </div>
          ) : (
            <div>
              <span>Current Period Ends</span>

              <strong>
                {formatDate(
                  subscription.currentPeriodEnd
                )}
              </strong>
            </div>
          )}

        </div>

      </section>


      {/* ================================================= */}
      {/* USAGE */}
      {/* ================================================= */}

      <section className="subscription-section">

        <div className="subscription-section-header">

          <div>
            <h2>Usage</h2>

            <p>
              Monitor your account resource
              usage against your plan limits.
            </p>
          </div>

        </div>


        <div className="subscription-usage-grid">

          <UsageCard
            title="Venues"
            current={
              usage.venues.current
            }
            limit={
              usage.venues.limit
            }
            percentage={
              usage.venues.percentage
            }
          />

          <UsageCard
            title="Users"
            current={
              usage.users.current
            }
            limit={
              usage.users.limit
            }
            percentage={
              usage.users.percentage
            }
          />

          <UsageCard
            title="Customers"
            current={
              usage.customers.current
            }
            limit={
              usage.customers.limit
            }
            percentage={
              usage.customers.percentage
            }
          />

          <UsageCard
            title="Bookings / Month"
            current={
              usage.bookingsPerMonth.current
            }
            limit={
              usage.bookingsPerMonth.limit
            }
            percentage={
              usage.bookingsPerMonth.percentage
            }
          />

        </div>

      </section>


      {/* ================================================= */}
      {/* BILLING CYCLE */}
      {/* ================================================= */}

      <section className="subscription-section">

        <div className="subscription-section-header">

          <div>
            <h2>Billing Cycle</h2>

            <p>
              Select how you would like to
              be billed.
            </p>
          </div>

        </div>


        <div className="billing-cycle-selector">

          <button
            type="button"
            className={
              selectedBillingCycle ===
              "monthly"
                ? "billing-cycle-option selected"
                : "billing-cycle-option"
            }
            onClick={() =>
              setSelectedBillingCycle(
                "monthly"
              )
            }
          >
            <strong>Monthly</strong>

            <span>
              Pay monthly
            </span>
          </button>


          <button
            type="button"
            className={
              selectedBillingCycle ===
              "yearly"
                ? "billing-cycle-option selected"
                : "billing-cycle-option"
            }
            onClick={() =>
              setSelectedBillingCycle(
                "yearly"
              )
            }
          >
            <strong>Yearly</strong>

            <span>
              Pay annually
            </span>
          </button>

        </div>

      </section>


      {/* ================================================= */}
      {/* AVAILABLE PLANS */}
      {/* ================================================= */}

      <section className="subscription-section">

        <div className="subscription-section-header">

          <div>
            <h2>Available Plans</h2>

            <p>
              Choose the plan that best
              suits your business.
            </p>
          </div>

        </div>


        <div className="subscription-plans-grid">

          {/* Current plan */}

          <div className="subscription-plan-card current">

            <div className="subscription-plan-card-header">

              <span className="subscription-label">
                CURRENT PLAN
              </span>

              <h3>
                {plan.name}
              </h3>

            </div>

            <div className="subscription-price">

              {formatCurrency(
                selectedBillingCycle ===
                  "yearly"
                  ? plan.priceYearly
                  : plan.priceMonthly
              )}

              <span>
                /
                {selectedBillingCycle ===
                "yearly"
                  ? "year"
                  : "month"}
              </span>

            </div>

            <p>
              {plan.description ||
                "Current subscription plan."}
            </p>

            <ul>

              {plan.features?.map(
                (feature, index) => (
                  <li key={index}>
                    ✓ {feature}
                  </li>
                )
              )}

            </ul>

            <button
              type="button"
              disabled
              className="subscription-plan-button current"
            >
              Current Plan
            </button>

          </div>


          {/* ================================================= */}
          {/* NOTE */}
          {/* ================================================= */}

          <div className="subscription-plan-card">

            <div className="subscription-plan-card-header">

              <span className="subscription-label">
                PLAN MANAGEMENT
              </span>

              <h3>
                Choose a Plan
              </h3>

            </div>

            <p>
              Your available plans are
              managed by the Booking System
              administrator.
            </p>

            <p>
              Plan upgrades and billing
              payments will be connected
              to the payment gateway in
              the next development phase.
            </p>

            <button
              type="button"
              className="subscription-plan-button"
              disabled={changingPlan}
              onClick={() =>
                handleChangePlan(plan)
              }
            >
              {changingPlan
                ? "Updating..."
                : "Keep Current Plan"}
            </button>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* BUSINESS */}
      {/* ================================================= */}

      <section className="subscription-business-card">

        <span className="subscription-label">
          BUSINESS ACCOUNT
        </span>

        <h2>
          {business.name}
        </h2>

        <p>
          {business.email}
        </p>

        <p>
          Status:{" "}
          <strong>
            {business.status}
          </strong>
        </p>

      </section>

    </div>
  );
}