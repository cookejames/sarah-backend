var mqtt = require('mqtt');
var client;

exports.mqtt = function(config) {
  if (!client) {
    client = mqtt.connect(
      'mqtt://' + config.host + ':' + config.port,
      {
        username: config.mqtt.username,
        password: config.mqtt.password,
        will: {
          topic: 'server/connected',
          payload: 'false',
          qos: 0,
          retain: true
        }
      }
    );

    client.on('connect', function () {
      console.log(new Date().toLocaleString(), '- MQTT Connected');
      client.publish('server/connected', 'true', {retain: true});
    });

    client.on('offline', function () {
      console.log(new Date().toLocaleString(), '- MQTT Client Offline ');
    });

    client.on('error', function () {
      console.log(new Date().toLocaleString(), '- MQTT Error');
    });
  }
  return client;
};
