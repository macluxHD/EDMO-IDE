export interface RobotCommand {
  type: "setArmAngle";
  index: number;
  degrees: number;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;

  constructor(url: string = "ws://localhost:8080") {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error("Connection already in progress"));
        return;
      }

      this.isConnecting = true;

      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log("WebSocket connected to robot server");
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };

        this.socket.onclose = () => {
          console.log("WebSocket disconnected");
          this.isConnecting = false;
          this.attemptReconnect();
        };

        this.socket.onmessage = (event) => {
          console.log("Message from robot server:", event.data);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error);
        });
      }, this.reconnectDelay);
    } else {
      console.warn("Max reconnection attempts reached");
    }
  }

  sendCommand(command: RobotCommand): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected. Command not sent:", command);
      return false;
    }

    try {
      this.socket.send(JSON.stringify(command));
      console.log("Command sent to robot:", command);
      return true;
    } catch (error) {
      console.error("Failed to send command:", error);
      return false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  setUrl(url: string) {
    this.url = url;
    if (this.isConnected()) {
      console.log("Reconnecting to new URL...");
      this.disconnect();
      this.connect().catch(console.error);
    }
  }
}

// Singleton instance
export const robotWebSocket = new WebSocketService();
