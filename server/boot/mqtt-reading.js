/**
 * Provides responses to MQTT messages
 * @param server
 */
module.exports = function(server) {
  var sensorRegex = new RegExp('sensors\/([a-z0-9]{24})\/readings');
  var sensorModel = server.models.sensor;
  var readingModel = server.models.reading;
  var boostModel = server.models.boost;
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
      if (err || !sensor) return;

      var reading = {
        time: new Date().getTime()
      };
      switch (sensor.type) {
        case 'float':
          reading.numberValue = parseFloat(message);
          break;
        case 'boolean':
          reading.booleanValue = parseInt(message);
          break;
        default:
          reading.stringValue = message;
          break;
      }

      sensor.readings.create(reading, function(err, reading){
        if (err) {
          console.log(err);
        }
        triggerHeating(sensor, reading);
      });
    });
  }

  /**
   * Trigger a heating boost if the sensor is configured to boost the heating
   * @param sensor
   * @param reading
   * @returns {boolean}
   */
  function triggerHeating(sensor, reading) {
    //Does this sensor have a heating trigger?
    if (!sensor.triggersHeating) {
      return false;
    }

    //Is the reading value below the sensor trigger value?
    if (reading.numberValue === undefined || reading.numberValue >= sensor.triggerValue) {
      return false;
    }

    //If there is a time range such as 22:00 to 07:00 split into two readings, one
    //from the from time until midnight and another from midnight to the to time
    var times = [];
    if (sensor.triggerTimeTo < sensor.triggerTimeFrom) {
      times.push({from: sensor.triggerTimeFrom, to: 23*60 + 59});
      times.push({from: 0, to: sensor.triggerTimeTo});
    } else {
      times.push({from: sensor.triggerTimeFrom, to: sensor.triggerTimeTo});
    }

    //Filter the times so that we only get ones where the current time is in a trigger range
    var validTimes = times.filter(function(time){
      var now = new Date();
      var minuteOfDay = now.getHours() * 60 + now.getMinutes();

      return minuteOfDay >= time.from && minuteOfDay < time.to;
    });

    //If we have valid times boost the heating
    if (validTimes.length > 0) {
      boostModel.boostHeating(sensor.triggerBoostLength, function(){});
    }
  }
};
