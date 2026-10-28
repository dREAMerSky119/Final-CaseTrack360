
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  Clock,
  CircleAlert,
  RefreshCw
} from "lucide-react";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/alerts", {
          credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load alerts.");
        }

        setAlerts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  const iconFor = (type) => {
    if (type === "overdue") return Clock;
    if (type === "critical_priority") return AlertTriangle;
    if (type === "inactive") return RefreshCw;
    return CircleAlert;
  };

  return (
    <div className="page-content alerts-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / MONITORING</div>
          <h1>Alerts</h1>
          <p>Review overdue, critical and inactive complaints.</p>
        </div>
        <Bell size={28} />
      </div>

      {loading && (
        <div className="panel">Loading alerts...</div>
      )}

      {error && (
        <div className="panel form-error">
          {error}
          <p>Check that you are signed in and the backend is running.</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="stats-grid alerts-stats-grid">
            <div className="panel alerts-stat-card">
              <div className="alerts-stat-icon purple">
                <Bell size={21} />
              </div>
              <div className="stat-copy">
                <p>Total alerts</p>
                <strong>{alerts.length}</strong>
                <span>Across all categories</span>
              </div>
            </div>

            <div className="panel alerts-stat-card">
              <div className="alerts-stat-icon red">
                <AlertTriangle size={21} />
              </div>
              <div className="stat-copy">
                <p>High severity</p>
                <strong>
                  {alerts.filter(
                    (a) => a.severity === "high"
                  ).length}
                </strong>
                <span>Require attention</span>
              </div>
            </div>

            <div className="panel alerts-stat-card">
              <div className="alerts-stat-icon amber">
                <Clock size={21} />
              </div>
              <div className="stat-copy">
                <p>Overdue complaints</p>
                <strong>
                  {alerts.filter(
                    (a) => a.type === "overdue"
                  ).length}
                </strong>
                <span>Past their deadline</span>
              </div>
            </div>
          </div>

          <div className="alerts-section-heading">
            <div>
              <h2>Active alerts</h2>
              <p>Complaints that may require your attention</p>
            </div>
            <span className="alerts-count">
              {alerts.length} alerts
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="panel alerts-empty">
              <div className="alerts-empty-icon">
                <Bell size={25} />
              </div>
              <h3>No active alerts</h3>
              <p>There are no alerts requiring attention right now.</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert, index) => {
                const Icon = iconFor(alert.type);

                return (
                  <article
                    className={`panel alert-card alert-severity-${alert.severity}`}
                    key={`${alert.complaintId}-${alert.type}-${index}`}
                  >
                    <div className={`alert-icon alert-icon-${alert.severity}`}>
                      <Icon size={21} />
                    </div>

                    <div className="alert-content">
                      <div className="alert-meta">
                        <span className="alert-type-label">
                          {alert.type.replaceAll("_", " ")}
                        </span>
                        <span className={`alert-severity-label severity-${alert.severity}`}>
                          {alert.severity} severity
                        </span>
                      </div>

                      <h3>{alert.title}</h3>
                      <p>{alert.message}</p>

                      <div className="alert-details">
                        <span>
                          Case: <strong>{alert.complaintId}</strong>
                        </span>
                        <span>{alert.bureau}</span>
                        <span>
                          Status: <strong>{alert.status}</strong>
                        </span>
                      </div>

                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          navigate(`/complaints/${alert.complaintId}`)
                        }
                      >
                        Open complaint <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
