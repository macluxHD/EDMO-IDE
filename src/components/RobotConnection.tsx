import { useState, useEffect } from "react";
import { robotWebSocket } from "../services/websocketService";
import "../styles/robotConnection.css";
import { useTranslation } from "react-i18next";

export function RobotConnection() {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState("ws://localhost:8080");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(robotWebSocket.isConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      robotWebSocket.setUrl(serverUrl);
      await robotWebSocket.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    robotWebSocket.disconnect();
    setIsConnected(false);
  };

  return (
    <>
      {/* Floating button to open modal */}
      <button
        className="robot-connection-trigger"
        onClick={() => setIsModalOpen(true)}
        title={t("websocket.title")}
      >
        <span
          className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
        />
        {t("websocket.button")}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="robot-connection-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="robot-connection-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("websocket.title")}</h3>
              <button
                className="close-button"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="connection-status">
              <span
                className={`status-indicator ${
                  isConnected
                    ? t("websocket.connected")
                    : t("websocket.disconnected")
                }`}
              >
                {isConnected
                  ? "🟢" + t("websocket.connected")
                  : "🔴 " + t("websocket.disconnected")}
              </span>
            </div>

            <div className="connection-controls">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="ws://localhost:8080"
                disabled={isConnected || isConnecting}
                className="url-input"
              />

              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="connect-button"
                >
                  {isConnecting
                    ? t("websocket.connecting")
                    : t("websocket.connect")}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="disconnect-button"
                >
                  {t("websocket.disconnect")}
                </button>
              )}
            </div>

            {error && (
              <div className="connection-error">
                {t("websocket.error")}: {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
