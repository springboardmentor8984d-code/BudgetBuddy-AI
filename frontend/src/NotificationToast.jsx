
import { useEffect, useRef, useState } from "react";
import API from "./api";
export default function NotificationToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    let mounted = true;
    let lastToken = null;
    let knownMessages = new Map();

    async function checkNotifications() {
      const token = localStorage.getItem("token");

      // Do not show notifications before login
      if (!token) {
        lastToken = null;
        knownMessages = new Map();
        setToast(null);

        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
        return;
      }

      try {
        const response = await fetch(
          `${API}/notifications/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error(
            "Notifications request failed:",
            response.status
          );
          return;
        }

        const data = await response.json();

        if (!mounted || !Array.isArray(data)) return;

        // First successful check after login
        if (lastToken !== token) {
          lastToken = token;

          knownMessages = new Map(
            data.map((n) => [
              n.notification_id,
              n.message,
            ])
          );

          const unread = data.find((n) => !n.is_read);

          if (unread) {
            displayToast(unread);
          }

          return;
        }

        // Detect an existing notification whose message changed
        const changed = data.find((n) => {
          const previousMessage = knownMessages.get(
            n.notification_id
          );

          return (
            previousMessage !== undefined &&
            previousMessage !== n.message
          );
        });

        // Detect newly created notifications
        const fresh = data.find(
          (n) => !knownMessages.has(n.notification_id)
        );

        // Store the latest messages
        data.forEach((n) => {
          knownMessages.set(
            n.notification_id,
            n.message
          );
        });

        // Show changed alerts or new notifications
        if (changed) {
          displayToast(changed);
        } else if (fresh) {
          displayToast(fresh);
        }
      } catch (error) {
        console.error(
          "Could not load notifications:",
          error
        );
      }
    }

    function displayToast(notification) {
      if (!mounted) return;

      if (timer.current) {
        clearTimeout(timer.current);
      }

      setToast(notification);

      timer.current = setTimeout(() => {
        if (mounted) {
          setToast(null);
        }
      }, 8000);
    }

    checkNotifications();

    const interval = setInterval(
      checkNotifications,
      5000
    );

    return () => {
      mounted = false;
      clearInterval(interval);

      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 999999,
        width: "min(360px, calc(100vw - 40px))",
        boxSizing: "border-box",
        padding: 18,
        background: "#fff",
        borderLeft: "5px solid #e67e22",
        borderRadius: 12,
        boxShadow: "0 8px 28px rgba(0,0,0,0.2)",
        color: "#222",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <strong>🔔 BudgetBuddy Alert</strong>

        <button
          onClick={() => {
            setToast(null);

            if (timer.current) {
              clearTimeout(timer.current);
              timer.current = null;
            }
          }}
          aria-label="Dismiss notification"
          style={{
            border: "none",
            background: "transparent",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      <p style={{ margin: 0, lineHeight: 1.5 }}>
        {toast.message}
      </p>

      <small
        style={{
          display: "block",
          marginTop: 10,
          color: "#777",
        }}
      >
        This alert will disappear automatically.
      </small>
    </div>
  );
}
