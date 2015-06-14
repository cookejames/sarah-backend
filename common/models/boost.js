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

  function create(water, heating, time, cb) {
    time = parseInt(time);
    if (time === undefined || time < 0 || time > 180) {
      return cb({name: 'Invalid time', status: 400, message: 'Validation error'});
    }
    Boost.create({
      water: (water == true),
      heating: (heating == true),
      endTime: new Date().getTime() + (time * 60 * 1000)
    }, cb);
  }
};
