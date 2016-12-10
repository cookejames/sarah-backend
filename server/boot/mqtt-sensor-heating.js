/**
 * Subscribe to the heating topic and republish it as sensor data
 * @param server
 */
module.exports = function(server) {
  var sensors = server.get('sensors');
  if (!sensors.heatingId) {
    return;
  }

  var topic = 'sensors/' + sensors.heatingId + '/readings';
  var mqtt = require('../lib/mqtt').mqtt(server.get('mqtt'));
  mqtt.subscribe('hvav/boiler/heating/status');
  mqtt.on('message', messageReceived);

  /**
   * Handle MQTT subscriptions
   * @param topic
   * @param message
   */
  function messageReceived(receiveTopic, message) {
    switch (String(message)) {
      case 'on':
        mqtt.publish(topic, "1");
        break;
      case 'off':
        mqtt.publish(topic, "0");
        break;
    }
  }
};
