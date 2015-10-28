(function(){
  var mqtt;

  exports.mqtt = function(config) {
    if (!mqtt) {
      var Adapter = require('strong-pubsub');
      var Client = require('strong-pubsub-mqtt');
      mqtt = new Adapter(config, Client);
    }
    return mqtt;
  };
})();
