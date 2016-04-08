var config = require('./config.js');
var express = require('express');
var io = require('socket.io');

var app = express();

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/http/index.html');
});
app.get('/game.js', function (req, res) {
  res.sendFile(__dirname + '/http/game.js');
});
app.get('/game.css', function (req, res) {
  res.sendFile(__dirname + '/http/game.css');
});

app.listen(config.express_port, function () {
  console.log('Express server running on port ' + config.express_port);
});

var count = [];
var object = [];
object.players = [];

io.on('connection', function () {

  count.players++;

  object.players = new Player (count.players, 'Unnamed' + Math.floor(Math.random() * 20), 0);

});

var Player = function (id, nickname, position) {

  this.id = id;
  this.nickname = nickname;
  this.position = position;
  this.x = 0;
  this.y = 0;

};

Player.prototype = {
  log: function (data) {
    console.log('Player ' + this.id + ': ' + data);
  },
  init: function () {

  },
  bindSockets: function () {

  }
};
