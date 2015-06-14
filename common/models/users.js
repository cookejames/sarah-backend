module.exports = function(Users) {
  //login
  Users.mosquittoLogin = function mosquitto(username, password, cb) {
    this.login({
        email: username,
        password: password
      },
      function(err, data){
        console.log(err);
        console.log(data);
        cb(err, data);
      });
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
    cb(null, 'not implemented');
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
    cb(null, 'not implemented');
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
