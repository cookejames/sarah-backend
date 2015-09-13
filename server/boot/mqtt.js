/**
 * Provides responses to MQTT messages
 * @param server
 */
module.exports = function(server) {
  var Adapter = require('strong-pubsub');
  var Client = require('strong-pubsub-mqtt');
  global.Promise = require('promise');

  var mqtt = new Adapter(server.get('mqtt'), Client);
  mqtt.subscribe('heating/schedule/request');
  mqtt.subscribe('water/schedule/request');
  mqtt.on('message', messageReceived);

  /**
   * Handle MQTT subscriptions
   * @param topic
   * @param message
   */
  function messageReceived(topic, message) {
    switch (topic) {
      case 'heating/schedule/request':
        heatingScheduleRequested();
        break;
      case 'water/schedule/request':
        waterScheduleRequested();
        break;
    }
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

      var collection =  server.models.heatingGroup.dataSource.connector.collection('heatingGroup');
      collection.find(query).toArray(function(err, data){
        var status = (data.length > 0) ? true : false;
        resolve(status);
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

      var collection =  server.models.boost.dataSource.connector.collection('boost');
      collection.find(query).toArray(function(err, data){
        var status = (data.length > 0) ? true : false;
        resolve(status);
      });
    });
  }

  /**
   * Publish if there are any heating schedules or boost enabled
   */
  function heatingScheduleRequested() {
    Promise.all([
      isScheduleOn('heating'),
      isBoostOn('heating')
    ]).then(function(results){
      var status = (results[0] || results[1]) ? 'on' : 'off';
      mqtt.publish('heating/schedule', status);
    });
  }

  /**
   * Publish if there are any water schedules or boost enabled
   */
  function waterScheduleRequested() {
    Promise.all([
      isScheduleOn('water'),
      isBoostOn('water')
    ]).then(function(results){
      var status = (results[0] || results[1]) ? 'on' : 'off';
      mqtt.publish('water/schedule', status);
    });
  }
};
