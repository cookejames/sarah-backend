module.exports = function(Users) {
  //login
  Users.mosquittoLogin = function mosquitto(username, password, cb) {
    var hex24bit = new RegExp('[0-9a-f]{24}');
    if (hex24bit.test(username) && password.indexOf('Bearer ') === 0) {
      var token = password.slice(7);
      Users.dataSource.models.AccessToken.find(
        {
          where: {
            id: token,
            userId: username
          }
        },
        function(err, data) {
          if (err) {
            cb(err);
          } else if (data.length === 0 || data[0].created.getTime() + data[0].ttl > new Date().getTime) {
            cb({name: 'Not Found', status: 404, message: 'Entity not found'});
          } else {
            cb(err, data[0]);
          }
        }
      );
    } else {
      this.login({
        email: username,
        password: password
      },cb);
    }

  };
  Users.remoteMethod(
    'mosquittoLogin',
    {
      http: {
        verb: 'post',
        path: '/mosquitto/login'
      },
      accepts: [
        {arg: 'username', type: 'string'},
        {arg: 'password', type: 'string'}
      ],
      returns: {arg: 'data', type: 'AccessToken', root: true}
    }
  );

  //acl
  Users.mosquittoAcl = function mosquitto(username, password, cb) {
    switch (username) {
      case 'anonymous':
          return cb({name: 'Not authorised', status: 403, message: 'Access not authorised'});
      default:
          return Users.find({email: username}, function(err){
            if (err) {
              cb(err);
            } else {
              cb(null, 'Authorised');
            }
          });
    }

  };
  Users.remoteMethod(
    'mosquittoAcl',
    {
      http: {
        verb: 'post',
        path: '/mosquitto/acl'
      },
      accepts: [
        {arg: 'username', type: 'string'},
        {arg: 'password', type: 'string'}
      ],
      returns: {arg: 'response', type: 'string'}
    }
  );

  //superuser
  Users.mosquittoSuperuser = function mosquitto(username, password, cb) {
    cb({name: 'Not authorised', status: 403, message: 'Access not authorised'});
  };
  Users.remoteMethod(
    'mosquittoSuperuser',
    {
      http: {
        verb: 'post',
        path: '/mosquitto/superuser'
      },
      accepts: [
        {arg: 'username', type: 'string'},
        {arg: 'password', type: 'string'}
      ],
      returns: {arg: 'response', type: 'string'}
    }
  );
};
