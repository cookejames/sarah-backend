global.Promise = global.Promise || require('promise');
/**
 * Provides responses to MQTT messages
 * @param app
 */
module.exports = function(app) {
  var mqtt = require('../lib/mqtt').mqtt(app.get('mqtt'));
  var currentHeatingState = null;
  var currentWaterState = null;

  mqtt.on('connect', function(){
    resetCurrentState(); //reset the current state in case a new broker has come up
    sendBoilerState();
  });
  app.models.HeatingSchedule.observe('after save', function(ctx, next){
    sendBoilerState();
    next();
  });
  app.models.HeatingGroup.observe('after save', function(ctx, next){
    sendBoilerState();
    next();
  });
  app.models.Boost.observe('after save', function(ctx, next){
    sendBoilerState();
    next();
  });
  setInterval(sendBoilerState, 60000);

  /**
   * Resets the stored boiler state
   */
  function resetCurrentState() {
    currentHeatingState = null;
    currentWaterState= null;
  }
  /**
   * Publish the current heating and water state over MQTT
   */
  function sendBoilerState() {
    if (!mqtt.connected) {
      return;
    }
    sendHeatingState();
    sendWaterState();
  }

  /**
   * Get the day of the week as a string
   * @returns {*}
   */
  function getDayOfWeek() {
    var day = new Date().getDay();
    switch (day) {
      case 0:
          return 'sunday';
      case 1:
          return 'monday';
      case 2:
          return 'tuesday';
      case 3:
          return 'wednesday';
      case 4:
          return 'thursday';
      case 5:
          return 'friday';
      case 6:
          return 'saturday';
    }
  }

  /**
   * Are there any schedules of a type that are enabled
   * @param type water or heating
   * @returns {Promise}
   */
  function isScheduleOn(type) {
    return new Promise(function(resolve, reject){
      var date = new Date();
      var minuteOfDay = (date.getHours() * 60) + date.getMinutes();
      var query = {
        isEnabled: true,
        heatingSchedules: {
          $elemMatch: {
            start:{
              $lt: minuteOfDay
            },
            end: {
              $gt: minuteOfDay
            }
          }
        }
      };
      query.heatingSchedules.$elemMatch[type + 'On'] = true;
      query.heatingSchedules.$elemMatch[getDayOfWeek()] = true;

      var collection =  app.models.heatingGroup.dataSource.connector.collection('heatingGroup');
      collection.find(query).toArray(function(err, data){
        if (Array.isArray(data)) {
          //Filter out groups that are in holiday times
          var now = new Date().getTime();
          data = data.filter(function(group){
            if (!group.holidayFrom || !group.holidayTo) {
              return true;
            }
            return !(now > group.holidayFrom && now < group.holidayTo);
          });
          var status = (data.length > 0) ? true : false;
          resolve(status);
        } else {
          reject();
        }
      });
    });
  }

  /**
   * Is a boost enabled
   * @param type heating or water
   * @returns {Promise}
   */
  function isBoostOn(type) {
    return new Promise(function(resolve, reject){
      var time = new Date().getTime();
      var query = {
        endTime:{
          $gt: time
        }
      };
      query[type] = true;

      var collection =  app.models.boost.dataSource.connector.collection('boost');
      collection.find(query).toArray(function(err, data){
        var status = (data.length > 0) ? true : false;
        resolve(status);
      });
    });
  }

  /**
   * Publish if there are any heating schedules or boost enabled
   */
  function sendHeatingState() {
    Promise.all([
      isScheduleOn('heating'),
      isBoostOn('heating')
    ]).then(function(results){
      var status = (results[0] || results[1]) ? '1' : '0';
      if (status !== currentHeatingState) {
        mqtt.publish('hvac/boiler/heating/control/set', status, {retain: true});
        currentHeatingState = status;
      }
    });
  }

  /**
   * Publish if there are any water schedules or boost enabled
   */
  function sendWaterState() {
    Promise.all([
      isScheduleOn('water'),
      isBoostOn('water')
    ]).then(function(results){
      var status = (results[0] || results[1]) ? '1' : '0';
      if (status !== currentWaterState) {
        mqtt.publish('hvac/boiler/water/control/set', status, {retain: true});
        currentWaterState = status;
      }
    });
  }
};
