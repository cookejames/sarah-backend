module.exports = function(Switch) {
  Switch.remoteMethod('sendOn', {
    description: 'Sends the on command to this switch',
    accepts: [
      {arg: 'req', type: 'object', 'http': {source: 'req'}},
      {arg: 'id', type: 'string'},
      {arg: 'options', type: 'object', injectCtx: true}
    ],
    returns: {arg: 'data', type: this.modelName, root: true},
    http: {verb: 'post', path: '/:id/on'}
  });
  Switch.sendOn = function(req, id, options, cb) {
    Switch.findById(id, function(err, theSwitch) {
      if (err) {
        return cb(err);
      }
      if (!theSwitch) {
        return cb({name: 'Not Found', status: 404, message: 'Entity not found'});
      }
      var mqtt = require('../../server/lib/mqtt.js').mqtt(req.app.get('mqtt'));
      mqtt.publish('switches', String(theSwitch.onCommand));
      cb();
    });
  };

  Switch.remoteMethod('sendOff', {
    description: 'Sends the off command to this switch',
    accepts: [
      {arg: 'req', type: 'object', 'http': {source: 'req'}},
      {arg: 'id', type: 'string'},
      {arg: 'options', type: 'object', injectCtx: true}
    ],
    returns: {arg: 'data', type: this.modelName, root: true},
    http: {verb: 'post', path: '/:id/off'}
  });
  Switch.sendOff = function(req, id, options, cb) {
    Switch.findById(id, function(err, theSwitch) {
      if (err) {
        return cb(err);
      }
      if (!theSwitch) {
        return cb({name: 'Not Found', status: 404, message: 'Entity not found'});
      }
      var mqtt = require('../../server/lib/mqtt.js').mqtt(req.app.get('mqtt'));
      mqtt.publish('switches', String(theSwitch.offCommand));
      cb();
    });
  };
};
