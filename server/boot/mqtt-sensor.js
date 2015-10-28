/**
 * Provides responses to MQTT messages
 * @param server
 */
module.exports = function(server) {
  var sensorRegex = new RegExp('sensors\/([a-z0-9]{24})\/readings');
  var sensorModel = server.models.sensor;
  var readingModel = server.models.reading;
  var mqtt = require('../lib/mqtt').mqtt(server.get('mqtt'));

  mqtt.subscribe('sensors/+/readings');
  mqtt.on('message', messageReceived);

  /**
   * Handle MQTT subscriptions
   * @param topic
   * @param message
   */
  function messageReceived(topic, message) {
    var matches = topic.match(sensorRegex);
    if (!Array.isArray(matches)) {
      return;
    }
    var sensorId = matches[1];
    sensorModel.findById(sensorId, function(err, sensor){
      if (err) return;

      var reading = {
        time: new Date().getTime()
      };
      switch (sensor.type) {
        case 'temperature':
        case 'humidity':
          reading.numberValue = parseFloat(message);
          break;
        default:
          reading.stringValue = message;
          break;
      }

      sensor.readings.create(reading, function(err, reading){
        if (err) {
          console.log(err);
        }
      });
    });
  }
};
