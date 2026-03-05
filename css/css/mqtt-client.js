class MQTTClient {
  constructor(config) {
    this.broker = config.broker || 'broker.hivemq.com';
    this.port = config.port || 8080;
    this.clientId = config.clientId || 'cattle_dip_' + Math.random().toString(16).substr(2, 8);
    this.username = config.username || '';
    this.password = config.password || '';
    this.client = null;
    this.isConnected = false;
    this.onConnect = null;
    this.onDisconnect = null;
    this.onMessage = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.client = new Paho.MQTT.Client(
          this.broker,
          this.port,
          this.clientId
        );

        this.client.onConnectionLost = (responseObject) => {
          console.log('[MQTT] Connection lost:', responseObject.errorMessage);
          this.isConnected = false;
          if (this.onDisconnect) this.onDisconnect();
          this.reconnect();
        };

        this.client.onMessageArrived = (message) => {
          console.log('[MQTT] Message arrived:', message.destinationName, message.payloadString);
          if (this.onMessage) {
            this.onMessage(message.destinationName, message.payloadString);
          }
        };

        const connectOptions = {
          onSuccess: () => {
            console.log('[MQTT] Connected to broker');
            this.isConnected = true;
            this.subscribe();
            if (this.onConnect) this.onConnect();
            resolve();
          },
          onFailure: (error) => {
            console.error('[MQTT] Connection failed:', error.errorMessage);
            reject(error);
          },
          keepAliveInterval: 30,
          cleanSession: true
        };

        if (this.username) {
          connectOptions.userName = this.username;
          connectOptions.password = this.password;
        }

        this.client.connect(connectOptions);
      } catch (error) {
        console.error('[MQTT] Error creating client:', error);
        reject(error);
      }
    });
  }

  subscribe() {
    const topics = [
      'cattle_dip/telemetry',
      'cattle_dip/status',
      'cattle_dip/alerts'
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          console.error('[MQTT] Subscribe failed for', topic, error);
        } else {
          console.log('[MQTT] Subscribed to', topic);
        }
      });
    });
  }

  publish(topic, message, qos = 1, retained = false) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected'));
        return;
      }

      const msg = new Paho.MQTT.Message(message);
      msg.destinationName = topic;
      msg.qos = qos;
      msg.retained = retained;

      this.client.send(msg);
      console.log('[MQTT] Published to', topic, message);
      resolve();
    });
  }

  async reconnect() {
    console.log('[MQTT] Attempting to reconnect...');
    let attempts = 0;
    const maxAttempts = 5;
    const delay = 2000;

    while (attempts < maxAttempts && !this.isConnected) {
      attempts++;
      console.log(`[MQTT] Reconnect attempt ${attempts}/${maxAttempts}`);
      
      try {
        await this.connect();
        return;
      } catch (error) {
        console.error('[MQTT] Reconnect failed:', error);
        await new Promise(resolve => setTimeout(resolve, delay * attempts));
      }
    }

    console.error('[MQTT] Max reconnect attempts reached');
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      console.log('[MQTT] Disconnected');
    }
  }
}

// Export for use in other modules
window.MQTTClient = MQTTClient;
