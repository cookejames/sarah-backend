module.exports = function(Boost) {
  Boost.disableRemoteMethod('upsert', true);
  Boost.disableRemoteMethod('updateAttributes', false);
  Boost.disableRemoteMethod('deleteById', true);
  Boost.disableRemoteMethod('findById', true);
  Boost.disableRemoteMethod('deleteById', true);
  Boost.disableRemoteMethod('exists', true);
  Boost.disableRemoteMethod('count', true);
  Boost.disableRemoteMethod('findOne', true);
  Boost.disableRemoteMethod('exists', true);
  Boost.disableRemoteMethod('find', true);
  Boost.disableRemoteMethod('bulkUpdate', true);
  Boost.disableRemoteMethod('create', true);
  Boost.disableRemoteMethod('updateAll', true);

  Boost.observe('before save', function(ctx, next){
    if (ctx.isNewInstance) {
      var accessToken = require('loopback').getCurrentContext().get('accessToken');
      ctx.instance.userId = accessToken ? accessToken.userId : null;
    }
    next();
  });
  /**
   * Get the current boost status for heating and water
   */
  Boost.remoteMethod('status', {
    description: 'Get the boost status',
    accepts: [],
    returns: [
      {arg: 'heating', type: 'number', root: true},
      {arg: 'water', type: 'number', root: true}
    ],
    http: {verb: 'get', path: '/status'}
  });
  Boost.status = function(cb) {
    this.find({
      where: {
        endTime: {gt: new Date().getTime()}
      }
    }, function(err, results) {
      if (err) {
        return cb(err);
      }

      var currentTime = new Date().getTime();
      var waterTime = currentTime;
      var heatingTime = currentTime;

      results.forEach(function(result){
        waterTime = (result.water && result.endTime > waterTime) ? result.endTime : waterTime;
        heatingTime = (result.heating && result.endTime > heatingTime) ? result.endTime : heatingTime;
      });
      cb(null, { //return the boost time in millis from the current time
        water: waterTime - currentTime,
        heating: heatingTime - currentTime
      });
    });
  };

  Boost.remoteMethod('boostWater', {
    description: 'Boost the water for a number of minutes',
    accepts: [
      {arg: 'time', type: 'number'}
    ],
    returns: {arg: 'data', type: this.modelName, root: true},
    http: {verb: 'post', path: '/water'}
  });
  Boost.boostWater = function(data, cb) {
    create(true, false, data, cb);
  };

  Boost.remoteMethod('boostHeating', {
    description: 'Boost the heating for a number of minutes',
    accepts: [
      {arg: 'time', type: 'number'}
    ],
    returns: {arg: 'data', type: this.modelName, root: true},
    http: {verb: 'post', path: '/heating'}
  });
  Boost.boostHeating = function(data, cb) {
    create(false, true, data, cb);
  };

  Boost.remoteMethod('cancelHeating', {
    description: 'Cancel all current heating boosts',
    accepts: [],
    returns: {arg: 'data', type: this.modelName, root: true},
    http: {verb: 'delete', path: '/heating/cancel'}
  });
  Boost.cancelHeating = function(cb) {
    Boost.destroyAll({
      heating: true,
      endTime: {
        gt: new Date().getTime()
      }
    }, cb);
  };

  Boost.remoteMethod('cancelWater', {
    description: 'Cancel all current water boosts',
    accepts: [],
    returns: {arg: 'data', type: this.modelName, root: true},
    http: {verb: 'delete', path: '/water/cancel'}
  });
  Boost.cancelWater = function(cb) {
    Boost.destroyAll({
      water: true,
      endTime: {
        gt: new Date().getTime()
      }
    }, cb);
  };

  function create(water, heating, time, cb) {
    time = parseInt(time);
    if (time === undefined || time < 0 || time > 180) {
      return cb({name: 'Invalid time', status: 400, message: 'Validation error'});
    }
    var currentTime = new Date().getTime();
    Boost.create({
      water: (water == true),
      heating: (heating == true),
      startTime: currentTime,
      endTime: currentTime + (time * 60 * 1000)
    }, cb);
  }
};
