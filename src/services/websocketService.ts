interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
}

export interface SetArmAngleData {
  index: number;
  degrees: number;
}

export interface SetOscillatorData {
  index: number;
  frequency: number;
  amplitude: number;
  offset: number;
  phaseShift: number;
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

  private sendMessage<T>(type: string, data: T): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected. Message not sent:", {
        type,
        data,
      });
      return false;
    }

    try {
      const message: WebSocketMessage<T> = { type, data };
      this.socket.send(JSON.stringify(message));
      console.log("Message sent to robot:", message);
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }

  setArmAngle(index: number, degrees: number): boolean {
    return this.sendMessage<SetArmAngleData>("setArmAngle", { index, degrees });
  }

  setOscillator(
    index: number,
    frequency: number,
    amplitude: number,
    offset: number,
    phaseShift: number
  ): boolean {
    return this.sendMessage<SetOscillatorData>("setOscillator", {
      index,
      frequency,
      amplitude,
      offset,
      phaseShift,
    });
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
