/* eslint-disable react-hooks/set-state-in-effect */

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import "./SubscriptionDashboard.css";
import PaymentReceipt from "./PaymentReceipt.jsx";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


function BusinessSubscriptionDashboard() {

  // =====================================================
  // STATE
  // =====================================================

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showUpgrade, setShowUpgrade] =
    useState(false);

  const [
    showUpgradeConfirmation,
    setShowUpgradeConfirmation,
  ] = useState(false);

  const [plans, setPlans] =
    useState([]);

  const [plansLoading, setPlansLoading] =
    useState(false);

  const [selectedPlan, setSelectedPlan] =
    useState(null);

  const [billingCycle, setBillingCycle] =
    useState("monthly");

  const [upgradeError, setUpgradeError] =
    useState("");

  const [upgradeSuccess, setUpgradeSuccess] =
    useState("");

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  // =====================================================
  // PAYMENT HISTORY STATE
  // =====================================================

  const [paymentHistory, setPaymentHistory] =
    useState([]);

  const [loadingPayments, setLoadingPayments] =
    useState(false);

  // =====================================================
  // PAYMENT RECEIPT STATE
  // =====================================================

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [showPaymentReceipt, setShowPaymentReceipt] =
    useState(false);

  const [cancellingSubscription, setCancellingSubscription] =
  useState(false);

const [resumingSubscription, setResumingSubscription] =
  useState(false);


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = useCallback(
    async () => {

      try {

        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token");

        if (!token) {

          throw new Error(
            "You are not logged in."
          );

        }

        const response =
          await fetch(
            `${API_URL}/subscriptions/dashboard`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to load dashboard"
          );

        }

        setDashboard(data);

      } catch (err) {

        console.error(
          "Dashboard error:",
          err
        );

        setError(
          err.message ||
          "Failed to load dashboard"
        );

      } finally {

        setLoading(false);

      }

    },
    []
  );

  const handleCancelSubscription = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel your subscription? Your access will remain active until the end of your current billing period."
  );

  if (!confirmed) {
    return;
  }

  try {
    setCancellingSubscription(true);

    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/subscriptions/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to cancel subscription."
      );
    }

    alert(data.message);

    await loadDashboard();
  } catch (error) {
    console.error(
      "Cancel subscription error:",
      error
    );

    alert(
      error.message ||
        "Failed to cancel subscription."
    );
  } finally {
    setCancellingSubscription(false);
  }
};
// =====================================================
// RESUME SUBSCRIPTION
// =====================================================

const handleResumeSubscription = async () => {
  try {
    setResumingSubscription(true);

    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("You are not logged in.");
    }

    const response = await fetch(
      `${API_URL}/subscriptions/resume`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to resume subscription."
      );
    }

    alert(
      data.message ||
        "Your subscription has been resumed."
    );

    await loadDashboard();
  } catch (error) {
    console.error(
      "Resume subscription error:",
      error
    );

    alert(
      error.message ||
        "Failed to resume subscription."
    );
  } finally {
    setResumingSubscription(false);
  }
};
  // =====================================================
  // LOAD PAYMENT HISTORY
  // =====================================================

  const loadPaymentHistory =
    useCallback(
      async () => {

        try {

          setLoadingPayments(true);

          const token =
            localStorage.getItem("token");

          if (!token) {

            throw new Error(
              "You are not logged in."
            );

          }

          const response =
            await fetch(
              `${API_URL}/payments/history`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  "Content-Type":
                    "application/json",
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {

            throw new Error(
              data.message ||
              "Failed to load payment history."
            );

          }

          setPaymentHistory(
            data.payments || []
          );

        } catch (err) {

          console.error(
            "Payment history error:",
            err
          );

        } finally {

          setLoadingPayments(false);

        }

      },
      []
    );


  // =====================================================
  // PAYMENT RECEIPT
  // =====================================================

  const openPaymentReceipt =
    (payment) => {

      setSelectedPayment(
        payment
      );

      setShowPaymentReceipt(
        true
      );

    };


  const closePaymentReceipt =
    () => {

      setShowPaymentReceipt(
        false
      );

      setSelectedPayment(
        null
      );

    };


  // =====================================================
  // LOAD PLANS
  // =====================================================

  const loadPlans =
    useCallback(
      async () => {

        try {

          setPlansLoading(true);

          setUpgradeError("");
          setUpgradeSuccess("");

          const token =
            localStorage.getItem("token");

          if (!token) {

            throw new Error(
              "You are not logged in."
            );

          }

          const response =
            await fetch(
              `${API_URL}/plans`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  "Content-Type":
                    "application/json",
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {

            throw new Error(
              data.message ||
              "Failed to load plans"
            );

          }

          setPlans(
            data.plans || []
          );

        } catch (err) {

          console.error(
            "Plans error:",
            err
          );

          setUpgradeError(
            err.message ||
            "Failed to load plans"
          );

        } finally {

          setPlansLoading(false);

        }

      },
      []
    );


  // =====================================================
  // LOAD DASHBOARD ON STARTUP
  // =====================================================

  useEffect(() => {

    loadDashboard();
    loadPaymentHistory();
    loadPlans();

  }, [
    loadDashboard,
    loadPaymentHistory,
    loadPlans,
  ]);


  // =====================================================
  // OPEN UPGRADE
  // =====================================================

  const openUpgrade =
    async () => {

      setShowUpgrade(true);

      setShowUpgradeConfirmation(
        false
      );

      setSelectedPlan(null);

      setUpgradeError("");

      setUpgradeSuccess("");

      setBillingCycle(
        "monthly"
      );

      await loadPlans();

    };


  // =====================================================
  // CLOSE UPGRADE
  // =====================================================

  const closeUpgrade =
    () => {

      setShowUpgrade(false);

      setShowUpgradeConfirmation(
        false
      );

      setSelectedPlan(null);

      setUpgradeError("");

      setUpgradeSuccess("");

      setPaymentLoading(false);

    };


  // =====================================================
  // SELECT PLAN
  // =====================================================

  const handleSelectPlan =
    (availablePlan) => {

      setSelectedPlan(
        availablePlan
      );

      setUpgradeError("");

      setUpgradeSuccess("");

    };


  // =====================================================
  // CONTINUE UPGRADE
  // =====================================================

  const handleContinueUpgrade =
    () => {

      if (!selectedPlan) {

        setUpgradeError(
          "Please select a plan."
        );

        return;

      }

      setUpgradeError("");

      setUpgradeSuccess("");

      setShowUpgradeConfirmation(
        true
      );

    };


  // =====================================================
  // BACK TO PLAN SELECTION
  // =====================================================

  const handleBackToPlans =
    () => {

      setShowUpgradeConfirmation(
        false
      );

      setUpgradeError("");

      setUpgradeSuccess("");

    };


  // =====================================================
  // PROCEED TO PAYMENT
  // =====================================================

  const handleProceedToPayment =
    async () => {

      if (!selectedPlan) {

        setUpgradeError(
          "Please select a plan."
        );

        return;

      }

      try {

        setPaymentLoading(true);

        setUpgradeError("");

        setUpgradeSuccess("");

        const token =
          localStorage.getItem("token");

        if (!token) {

          throw new Error(
            "You are not logged in."
          );

        }

        const response =
          await fetch(
            `${API_URL}/payments/checkout`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                planId:
                  selectedPlan._id,

                billingCycle,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to create payment."
          );

        }

        if (
          !data.checkout ||
          !data.checkout.url ||
          !data.checkout.fields
        ) {

          throw new Error(
            "PayFast checkout information was not returned."
          );

        }

        // -------------------------------------------------
        // CREATE HIDDEN PAYFAST FORM
        // -------------------------------------------------

        const form =
          document.createElement(
            "form"
          );

        form.method = "POST";

        form.action =
          data.checkout.url;

        form.style.display =
          "none";

        Object.entries(
          data.checkout.fields
        ).forEach(
          ([name, value]) => {

            const input =
              document.createElement(
                "input"
              );

            input.type =
              "hidden";

            input.name =
              name;

            input.value =
              value ?? "";

            form.appendChild(
              input
            );

          }
        );

        document.body.appendChild(
          form
        );

        // -------------------------------------------------
        // SUBMIT TO PAYFAST
        // -------------------------------------------------

        form.submit();

      } catch (err) {

        console.error(
          "PayFast checkout error:",
          err
        );

        setUpgradeError(
          err.message ||
          "Unable to start PayFast payment."
        );

        setPaymentLoading(false);

      }

    };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate =
    (date) => {

      if (!date) {
        return "N/A";
      }

      const parsedDate =
        new Date(date);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        return "N/A";

      }

      return parsedDate.toLocaleDateString(
        "en-ZA",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );

    };


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency =
    (amount) => {

      const value =
        Number(amount || 0);

      return `R${value.toLocaleString(
        "en-ZA",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;

    };


  // =====================================================
  // FORMAT LIMIT
  // =====================================================

  const formatLimit =
    (limit) => {

      return limit === -1
        ? "Unlimited"
        : limit;

    };


  // =====================================================
  // PROGRESS
  // =====================================================

  const getProgressWidth =
    (percentage) => {

      return `${Math.min(
        Number(percentage) || 0,
        100
      )}%`;

    };


  // =====================================================
  // STATUS
  // =====================================================

  const getStatusLabel =
    (status) => {

      switch (status) {

        case "trial":
          return "Trial";

        case "active":
          return "Active";

        case "past_due":
          return "Payment Due";

        case "suspended":
          return "Suspended";

        case "cancelled":
          return "Cancelled";

        case "expired":
          return "Expired";

        default:
          return status || "Unknown";

      }

    };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="subscription-dashboard">

        <div className="dashboard-loading">

          <p>
            Loading subscription
            information...
          </p>

        </div>

      </div>

    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="subscription-dashboard">

        <div className="dashboard-error">

          <strong>
            Unable to load
            subscription
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadDashboard
            }
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  // =====================================================
  // NO DATA
  // =====================================================

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


  // =====================================================
  // SELECTED PLAN PRICE
  // =====================================================

  const selectedPlanPrice =
    selectedPlan
      ? billingCycle === "yearly"
        ? selectedPlan.priceYearly
        : selectedPlan.priceMonthly
      : 0;

    // =====================================================
  // MAIN RENDER
  // =====================================================

  return (

    <div className="subscription-dashboard">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-header">

        <div>

          <h1>
            {business.name}
          </h1>

          <p>
            Subscription Overview
          </p>

        </div>


        <div className="subscription-status">

          <span className="plan-name">
            {plan.name}
          </span>

          <span
            className={
              `status-badge status-${subscription.status}`
            }
          >
            {getStatusLabel(
              subscription.status
            )}
          </span>

        </div>

      </div>


      {/* =================================================
          SUBSCRIPTION SUMMARY
      ================================================= */}

      <div className="subscription-summary">

        <div>

          <span className="summary-label">
            Current Plan
          </span>

          <strong>
            {plan.name}
          </strong>

        </div>


        <div>

          <span className="summary-label">
            Billing
          </span>

          <strong>
            {subscription.billingCycle ===
            "yearly"
              ? "Yearly"
              : "Monthly"}
          </strong>

        </div>


        <div>

          <span className="summary-label">

            {subscription.status ===
            "trial"
              ? "Trial Ends"
              : "Period Ends"}

          </span>

          <strong>

            {formatDate(
              subscription.status ===
              "trial"
                ? subscription.trialEndDate
                : subscription.currentPeriodEnd
            )}

          </strong>

        </div>


        <div>

          <span className="summary-label">
            Days Remaining
          </span>

          <strong>
            {subscription.daysRemaining ??
              "N/A"}
          </strong>

        </div>

      </div>

 {/* =================================================
          SUBSCRIPTION CANCELLATION / RESUME
      ================================================= */}

      {["trial", "active"].includes(
        subscription.status
      ) && (
        subscription.cancelAtPeriodEnd ? (
          <div className="subscription-cancellation-notice">
            <div>
              <strong>
                Cancellation Scheduled
              </strong>

              <p>
                Your subscription will remain active until{" "}
                <strong>
                  {formatDate(
                    subscription.currentPeriodEnd
                  )}
                </strong>
                .
              </p>
            </div>

            <button
              type="button"
              className="resume-subscription-button"
              onClick={handleResumeSubscription}
              disabled={resumingSubscription}
            >
              {resumingSubscription
                ? "Resuming..."
                : "Resume Subscription"}
            </button>
          </div>
        ) : (
          <div className="subscription-cancellation-action">
            <button
              type="button"
              className="cancel-subscription-button"
              onClick={handleCancelSubscription}
              disabled={cancellingSubscription}
            >
              {cancellingSubscription
                ? "Cancelling..."
                : "Cancel Subscription"}
            </button>
          </div>
        )
      )}

      {/* =================================================
          WARNINGS
      ================================================= */}

      {warnings &&
        warnings.length > 0 && (

          <div className="dashboard-warnings">

            {warnings.map(
              (warning, index) => (

                <div
                  className="warning"
                  key={
                    `${warning.type || "warning"}-${index}`
                  }
                >

                  <span>
                    ⚠
                  </span>

                  <span>
                    {warning.message}
                  </span>

                </div>

              )
            )}

          </div>

        )}


      {/* =================================================
          USAGE
      ================================================= */}

      <div className="usage-grid">

        <UsageCard
          title="Venues"
          usage={usage?.venues}
          formatLimit={
            formatLimit
          }
          getProgressWidth={
            getProgressWidth
          }
        />


        <UsageCard
          title="Customers"
          usage={usage?.customers}
          formatLimit={
            formatLimit
          }
          getProgressWidth={
            getProgressWidth
          }
        />


        <UsageCard
          title="Users"
          usage={usage?.users}
          formatLimit={
            formatLimit
          }
          getProgressWidth={
            getProgressWidth
          }
        />


        <UsageCard
          title="Bookings This Month"
          usage={
            usage?.bookingsPerMonth
          }
          formatLimit={
            formatLimit
          }
          getProgressWidth={
            getProgressWidth
          }
        />

      </div>


      {/* =================================================
          CURRENT PLAN
      ================================================= */}

      <div className="plan-section">

        <div className="plan-header">

          <div>

            <h2>
              {plan.name} Plan
            </h2>

            <p>
              {plan.description}
            </p>

          </div>


          <div className="plan-price">

            <strong>
              {formatCurrency(
                plan.priceMonthly
              )}
            </strong>

            <span>
              / month
            </span>

          </div>

        </div>


        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        <div className="payment-history-section">

          <div className="payment-history-header">

            <div>

              <h2>
                Payment History
              </h2>

              <p>
                View your subscription
                payments and PayFast
                transactions.
              </p>

            </div>

          </div>


          {loadingPayments ? (

            <div className="payment-history-loading">

              Loading payment history...

            </div>

          ) : paymentHistory.length === 0 ? (

            <div className="payment-history-empty">

              <h3>
                No payments yet
              </h3>

              <p>
                Your completed
                subscription payments
                will appear here.
              </p>

            </div>

          ) : (

            <div className="payment-history-table-wrapper">

              <table className="payment-history-table">

                <thead>

                  <tr>

                    <th>
                      Date
                    </th>

                    <th>
                      Transaction
                    </th>

                    <th>
                      Plan
                    </th>

                    <th>
                      Billing
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Provider
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Receipt
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {paymentHistory.map(
                    (payment) => (

                      <tr
                        key={
                          payment._id
                        }
                      >

                        <td>

                          {formatDate(
                            payment.paymentDate
                          )}

                        </td>


                        <td>

                          <span className="payment-transaction-id">

                            {payment.transactionId ||
                              "-"}

                          </span>

                        </td>


                        <td>

                          {payment.planId?.name ||
                            "-"}

                        </td>


                        <td>

                          {payment.billingCycle ===
                          "yearly"
                            ? "Yearly"
                            : "Monthly"}

                        </td>


                        <td>

                          {formatCurrency(
                            payment.amount
                          )}

                        </td>


                        <td>

                          {payment.provider
                            ? payment.provider
                                .charAt(0)
                                .toUpperCase() +
                              payment.provider.slice(1)
                            : "-"}

                        </td>


                        <td>

                          <span
                            className={
                              `payment-status-badge ` +
                              `payment-status-${payment.status}`
                            }
                          >

                            {payment.status}

                          </span>

                        </td>


                        <td>

                          {payment.status ===
                          "successful" ? (

                            <button
                              type="button"
                              className="receipt-button"
                              onClick={() =>
                                openPaymentReceipt(
                                  payment
                                )
                              }
                            >
                              🧾 View Receipt
                            </button>

                          ) : (

                            <span className="receipt-unavailable">

                              Not available

                            </span>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* =================================================
            PLAN FEATURES
        ================================================= */}

        <div className="plan-features">

          {plan.features?.map(
            (feature, index) => (

              <div
                key={index}
                className="feature"
              >

                <span>
                  ✓
                </span>

                {feature}

              </div>

            )
          )}

        </div>


        {/* =================================================
            UPGRADE / RENEW BUTTON
        ================================================= */}

        <button
          type="button"
          className="upgrade-button"
          onClick={openUpgrade}
        >

          {subscription.status ===
          "expired"
            ? "Renew Subscription"
            : "Upgrade Plan"}

        </button>

      </div>


{/* PROFESSIONAL PAYMENT RECEIPT */}
{showPaymentReceipt && selectedPayment && (
  <PaymentReceipt
    selectedPayment={selectedPayment}
    onClose={closePaymentReceipt}
  />
)}

      {/* =================================================
          UPGRADE MODAL
      ================================================= */}

      {showUpgrade && (

        <div
          className="upgrade-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeUpgrade();

            }

          }}
        >

          <div className="upgrade-modal">


            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="upgrade-modal-header">

              <div>

                <h2>
                  Upgrade Your Plan
                </h2>

                <p>
                  Choose the plan that
                  best fits your business.
                </p>

              </div>


              <button
                type="button"
                className="close-modal"
                onClick={closeUpgrade}
                aria-label="Close"
              >
                X
              </button>

            </div>


            {/* =================================================
                BILLING SELECTOR
            ================================================= */}

            <div className="billing-selector">

              <button
                type="button"
                className={
                  billingCycle ===
                  "monthly"
                    ? "billing-option active"
                    : "billing-option"
                }
                onClick={() => {

                  setBillingCycle(
                    "monthly"
                  );

                  setUpgradeSuccess("");
                  setUpgradeError("");

                }}
              >
                Monthly
              </button>


              <button
                type="button"
                className={
                  billingCycle ===
                  "yearly"
                    ? "billing-option active"
                    : "billing-option"
                }
                onClick={() => {

                  setBillingCycle(
                    "yearly"
                  );

                  setUpgradeSuccess("");
                  setUpgradeError("");

                }}
              >
                Yearly
              </button>

            </div>


            {/* =================================================
                PLAN LIST
            ================================================= */}

            {plansLoading ? (

              <div className="plans-loading">

                <p>
                  Loading available
                  plans...
                </p>

              </div>

            ) : plans.length === 0 ? (

              <div className="plans-empty">

                <p>
                  No subscription
                  plans are currently
                  available.
                </p>

              </div>

            ) : (

              <div className="plan-selection">

                {plans.map(
                  (availablePlan) => {

                    const isCurrent =
                      availablePlan.code ===
                      plan.code;

                    const price =
                      billingCycle ===
                      "yearly"
                        ? availablePlan.priceYearly
                        : availablePlan.priceMonthly;

                    const isSelected =
                      selectedPlan?._id ===
                      availablePlan._id;

                    return (

                      <div
                        key={
                          availablePlan._id
                        }
                        className={
                          isSelected
                            ? "plan-option selected"
                            : "plan-option"
                        }
                        onClick={() =>
                          handleSelectPlan(
                            availablePlan
                          )
                        }
                      >


                        {/* PLAN HEADER */}

                        <div className="plan-option-header">

                          <h3>
                            {
                              availablePlan.name
                            }
                          </h3>


                          {isCurrent && (

                            <span className="current-plan">
                              Current
                            </span>

                          )}

                        </div>


                        {/* PRICE */}

                        <div className="plan-option-price">

                          <strong>

                            {formatCurrency(
                              price
                            )}

                          </strong>

                          <span>

                            /
                            {billingCycle ===
                            "yearly"
                              ? "year"
                              : "month"}

                          </span>

                        </div>


                        {/* DESCRIPTION */}

                        <p>

                          {
                            availablePlan.description
                          }

                        </p>


                        {/* LIMITS */}

                        <div className="plan-option-limits">

                          <span>

                            Venues:{" "}

                            {availablePlan.limits
                              ?.venues ===
                            -1
                              ? "Unlimited"
                              : availablePlan
                                  .limits
                                  ?.venues}

                          </span>


                          <span>

                            Users:{" "}

                            {availablePlan.limits
                              ?.users ===
                            -1
                              ? "Unlimited"
                              : availablePlan
                                  .limits
                                  ?.users}

                          </span>


                          <span>

                            Customers:{" "}

                            {availablePlan.limits
                              ?.customers ===
                            -1
                              ? "Unlimited"
                              : availablePlan
                                  .limits
                                  ?.customers}

                          </span>


                          <span>

                            Bookings/month:{" "}

                            {availablePlan.limits
                              ?.bookingsPerMonth ===
                            -1
                              ? "Unlimited"
                              : availablePlan
                                  .limits
                                  ?.bookingsPerMonth}

                          </span>

                        </div>


                        {/* FEATURES */}

                        {availablePlan.features?.length >
                          0 && (

                          <div className="plan-option-features">

                            {availablePlan.features
                              .slice(0, 4)
                              .map(
                                (
                                  feature,
                                  index
                                ) => (

                                  <span
                                    key={index}
                                  >
                                    ✓{" "}
                                    {feature}
                                  </span>

                                )
                              )}

                          </div>

                        )}


                        {/* SELECTED */}

                        {isSelected && (

                          <div className="selected-indicator">

                            ✓ Selected

                          </div>

                        )}

                      </div>

                    );

                  }
                )}

              </div>

            )}


            {/* =================================================
                ERROR
            ================================================= */}

            {upgradeError && (

              <div className="upgrade-error">

                {upgradeError}

              </div>

            )}


            {/* =================================================
                SUCCESS
            ================================================= */}

            {upgradeSuccess && (

              <div className="upgrade-success">

                {upgradeSuccess}

              </div>

            )}


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="upgrade-actions">

              <button
                type="button"
                className="cancel-upgrade"
                onClick={closeUpgrade}
              >
                Cancel
              </button>


              <button
                type="button"
                className="continue-upgrade"
                disabled={
                  !selectedPlan ||
                  plansLoading
                }
                onClick={
                  handleContinueUpgrade
                }
              >

                Continue

              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          UPGRADE CONFIRMATION MODAL
      ================================================= */}

      {showUpgradeConfirmation &&
        selectedPlan && (

          <div
            className="upgrade-overlay"
            onClick={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                setShowUpgradeConfirmation(
                  false
                );

              }

            }}
          >

            <div className="upgrade-modal">


              {/* =================================================
                  CONFIRMATION HEADER
              ================================================= */}

              <div className="upgrade-modal-header">

                <div>

                  <h2>
                    Confirm Plan Selection
                  </h2>

                  <p>
                    Review your subscription
                    before proceeding to
                    payment.
                  </p>

                </div>


                <button
                  type="button"
                  className="close-modal"
                  onClick={() =>
                    setShowUpgradeConfirmation(
                      false
                    )
                  }
                  aria-label="Close"
                >
                  ×
                </button>

              </div>


              {/* =================================================
                  SELECTED PLAN
              ================================================= */}

              <div className="upgrade-confirmation-plan">

                <span className="summary-label">
                  SELECTED PLAN
                </span>

                <h2>
                  {selectedPlan.name}
                </h2>

                <p>
                  {selectedPlan.description}
                </p>

              </div>


              {/* =================================================
                  PRICE
              ================================================= */}

              <div className="upgrade-confirmation-price">

                <strong>

                  {formatCurrency(
                    selectedPlanPrice
                  )}

                </strong>

                <span>

                  /
                  {billingCycle ===
                  "yearly"
                    ? "year"
                    : "month"}

                </span>

              </div>


              {/* =================================================
                  DETAILS
              ================================================= */}

              <div className="upgrade-confirmation-details">

                <div>

                  <span>
                    Current Plan
                  </span>

                  <strong>
                    {plan.name}
                  </strong>

                </div>


                <div>

                  <span>
                    New Plan
                  </span>

                  <strong>
                    {selectedPlan.name}
                  </strong>

                </div>


                <div>

                  <span>
                    Billing Cycle
                  </span>

                  <strong>

                    {billingCycle ===
                    "yearly"
                      ? "Yearly"
                      : "Monthly"}

                  </strong>

                </div>


                <div>

                  <span>
                    Payment Amount
                  </span>

                  <strong>

                    {formatCurrency(
                      selectedPlanPrice
                    )}

                  </strong>

                </div>

              </div>


              {/* =================================================
                  NEW PLAN LIMITS
              ================================================= */}

              <div className="upgrade-confirmation-limits">

                <h3>
                  Included Limits
                </h3>


                <div>

                  <span>
                    Venues
                  </span>

                  <strong>

                    {selectedPlan.limits
                      ?.venues === -1
                      ? "Unlimited"
                      : selectedPlan.limits
                          ?.venues}

                  </strong>

                </div>


                <div>

                  <span>
                    Users
                  </span>

                  <strong>

                    {selectedPlan.limits
                      ?.users === -1
                      ? "Unlimited"
                      : selectedPlan.limits
                          ?.users}

                  </strong>

                </div>


                <div>

                  <span>
                    Customers
                  </span>

                  <strong>

                    {selectedPlan.limits
                      ?.customers === -1
                      ? "Unlimited"
                      : selectedPlan.limits
                          ?.customers}

                  </strong>

                </div>


                <div>

                  <span>
                    Bookings / Month
                  </span>

                  <strong>

                    {selectedPlan.limits
                      ?.bookingsPerMonth === -1
                      ? "Unlimited"
                      : selectedPlan.limits
                          ?.bookingsPerMonth}

                  </strong>

                </div>

              </div>


              {/* =================================================
                  PAYMENT NOTICE
              ================================================= */}

              <div className="upgrade-payment-notice">

                <strong>
                  Payment required
                </strong>

                <p>
                  Your current subscription
                  will remain unchanged until
                  payment has been successfully
                  completed and verified.
                </p>

              </div>


              {/* =================================================
                  ERROR
              ================================================= */}

              {upgradeError && (

                <div className="upgrade-error">

                  {upgradeError}

                </div>

              )}


              {/* =================================================
                  SUCCESS
              ================================================= */}

              {upgradeSuccess && (

                <div className="upgrade-success">

                  {upgradeSuccess}

                </div>

              )}


              {/* =================================================
                  CONFIRMATION ACTIONS
              ================================================= */}

              <div className="upgrade-actions">

                <button
                  type="button"
                  className="cancel-upgrade"
                  onClick={
                    handleBackToPlans
                  }
                  disabled={
                    paymentLoading
                  }
                >
                  Back
                </button>


                <button
                  type="button"
                  className="continue-upgrade"
                  onClick={
                    handleProceedToPayment
                  }
                  disabled={
                    paymentLoading
                  }
                >

                  {paymentLoading
                    ? "Preparing..."
                    : "Proceed to Payment"}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

// =====================================================
// USAGE CARD
// =====================================================

function UsageCard({
  title,
  usage,
  formatLimit,
  getProgressWidth,
}) {

  if (!usage) {
    return null;
  }

  return (

    <div className="usage-card">


      {/* HEADER */}

      <div className="usage-card-header">

        <h3>
          {title}
        </h3>

        <span>

          {usage.limit === -1
            ? "Unlimited"
            : `${usage.current} / ${usage.limit}`}

        </span>

      </div>


      {/* NUMBER */}

      <div className="usage-number">

        {usage.current}

        <span>
          {" "}
          /{" "}
          {formatLimit(
            usage.limit
          )}
        </span>

      </div>


      {/* PROGRESS */}

      <div
        className="progress-bar"
        aria-label={
          `${title} usage`
        }
      >

        <div
          className="progress-fill"
          style={{
            width:
              getProgressWidth(
                usage.percentage
              ),
          }}
        />

      </div>


      {/* FOOTER */}

      <div className="usage-footer">

        <span>

          {usage.limit === -1
            ? "Unlimited"
            : `${usage.remaining} remaining`}

        </span>


        <span>

          {usage.limit === -1
            ? ""
            : `${usage.percentage}%`}

        </span>

      </div>

    </div>

  );

}



function SuperAdminSubscriptionDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const response = await fetch(
          `${API_URL}/subscriptions/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load businesses."
          );
        }

        setBusinesses(data.businesses || []);
      } catch (err) {
        console.error("Super Admin dashboard error:", err);
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "N/A";

    return parsed.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatLimit = (value) => {
    if (value === -1) return "Unlimited";
    return value ?? 0;
  };

  const usageText = (current, limit) => {
    return `${current ?? 0} / ${formatLimit(limit)}`;
  };

  const statusLabel = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  if (loading) {
    return (
      <div className="subscription-dashboard">
        <p>Loading all business subscriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-dashboard">
        <div className="dashboard-error">
          <strong>Unable to load Super Admin dashboard</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Super Admin Dashboard</h1>
          <p>Business and subscription management overview</p>
        </div>

        <div className="subscription-status">
          <span className="plan-name">
            {businesses.length} Businesses
          </span>
        </div>
      </div>

      <div className="super-admin-business-table">
        <h2>All Registered Businesses</h2>

        {businesses.length === 0 ? (
          <p>No businesses have been registered yet.</p>
        ) : (
          <div className="payment-history-table-wrapper">
            <table className="payment-history-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Business Status</th>
                  <th>Subscription</th>
                  <th>Plan</th>
                  <th>Billing</th>
                  <th>Venues</th>
                  <th>Customers</th>
                  <th>Users</th>
                  <th>Bookings / Month</th>
                  <th>Expiry / Renewal</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {businesses.map((item) => {
                  const business = item.business;
                  const subscription = item.subscription;
                  const plan = item.plan;
                  const usage = item.usage || {};
                  const limits = plan?.limits || {};

                  const endDate =
                    subscription?.status === "trial"
                      ? subscription.trialEndDate
                      : subscription?.currentPeriodEnd;

                  return (
                    <tr key={business.id}>
                      <td>
                        <strong>{business.name}</strong>
                        <br />
                        <small>{business.email}</small>
                      </td>

                      <td>{statusLabel(business.status)}</td>

                      <td>
                        {statusLabel(
                          subscription?.status || "not_subscribed"
                        )}
                      </td>

                      <td>{plan?.name || "No plan"}</td>

                      <td>
                        {subscription?.billingCycle
                          ? statusLabel(subscription.billingCycle)
                          : "N/A"}
                      </td>

                      <td>
                        {usageText(usage.venues, limits.venues)}
                      </td>

                      <td>
                        {usageText(
                          usage.customers,
                          limits.customers
                        )}
                      </td>

                      <td>
                        {usageText(usage.users, limits.users)}
                      </td>

                      <td>
                        {usageText(
                          usage.bookingsPerMonth,
                          limits.bookingsPerMonth
                        )}
                      </td>

                      <td>{formatDate(endDate)}</td>

                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedBusiness(item)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBusiness && (
        <div className="super-admin-business-details">
          <div className="dashboard-header">
            <div>
              <h2>
                {selectedBusiness.business.name}
              </h2>
              <p>Business subscription details</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBusiness(null)}
            >
              Close Details
            </button>
          </div>

          <div className="subscription-summary">
            <div>
              <span className="summary-label">Business Email</span>
              <strong>
                {selectedBusiness.business.email}
              </strong>
            </div>

            <div>
              <span className="summary-label">Business Status</span>
              <strong>
                {statusLabel(selectedBusiness.business.status)}
              </strong>
            </div>

            <div>
              <span className="summary-label">Subscription</span>
              <strong>
                {statusLabel(
                  selectedBusiness.subscription?.status ||
                    "not_subscribed"
                )}
              </strong>
            </div>

            <div>
              <span className="summary-label">Current Plan</span>
              <strong>
                {selectedBusiness.plan?.name || "No plan"}
              </strong>
            </div>

            <div>
              <span className="summary-label">Billing Cycle</span>
              <strong>
                {statusLabel(
                  selectedBusiness.subscription?.billingCycle ||
                    "N/A"
                )}
              </strong>
            </div>

            <div>
              <span className="summary-label">Expiry / Renewal</span>
              <strong>
                {formatDate(
                  selectedBusiness.subscription?.status === "trial"
                    ? selectedBusiness.subscription?.trialEndDate
                    : selectedBusiness.subscription?.currentPeriodEnd
                )}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionDashboard11() {
  let userRole = "";

  try {
    const storedUser = localStorage.getItem("user");
    userRole = JSON.parse(storedUser || "{}")?.role || "";
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
  }

  if (userRole === "super_admin") {
    return <SuperAdminSubscriptionDashboard />;
  }

  return <BusinessSubscriptionDashboard />;
}

export default SubscriptionDashboard11;
