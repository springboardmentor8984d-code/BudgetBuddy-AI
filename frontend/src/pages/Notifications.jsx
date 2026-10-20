import { useEffect, useState } from "react";
import API from "../api";
function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");

  const fetchNotifications = async () => {
    const response = await fetch(
      `${API}/notifications/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setNotifications(data);
  };

  const markAsRead = async (id) => {
    await fetch(
      `${API}/notifications/${id}/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h1>Notifications</h1>

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.notification_id}
            style={{
              padding: "15px",
              marginBottom: "12px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              background: notification.is_read ? "#f5f5f5" : "#eef6ff",
            }}
          >
            <p>{notification.message}</p>

            <small>
              {notification.is_read ? "Read" : "Unread"}
            </small>

            {!notification.is_read && (
              <button
                onClick={() =>
                  markAsRead(notification.notification_id)
                }
                style={{ marginLeft: "15px" }}
              >
                Mark as read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;