module.exports = function(Users) {
  //login
  Users.mosquittoLogin = function mosquitto(username, password, cb) {
    this.login({
        email: username,
        password: password
      },
      cb);
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
      returns: {arg: 'response', type: 'string'}
    }
  );

  //acl
  Users.mosquittoAcl = function mosquitto(username, password, cb) {
    switch (username) {
      case 'anonymous':
          return cb({name: 'Not authorised', status: 403, message: 'Access not authorised'});
      default:
          return cb(null, 'Authorised');
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
