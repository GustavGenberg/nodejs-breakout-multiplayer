var config = require('./config.js');
var express = require('express');
var io = require('socket.io')(config.socket_port);

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
count.players = 0;
count.ball = 0;
var object = [];
object.players = {};
object.sockets = {};
object.balls = {};
var interval = [];
interval.cooldown = {};
interval.cooldown.playerMove = [];

io.on('connection', function (socket) {

  console.log('User connected');

  count.players++;

  object.sockets[count.players] = socket;

  object.sockets[count.players].emit('config', config);

  if(count.players == 1) {
    object.players[count.players] = new Player (count.players, 'Unnamed' + Math.floor(Math.random() * 20), 0);
    object.sockets[count.players].emit('info', {id: count.players, msg: 'Welcome! You are player 1 (the left one)'});
  }
  if(count.players == 2) {
    startGame();
    object.players[count.players] = new Player (count.players, 'Unnamed' + Math.floor(Math.random() * 20), 1);
    object.sockets[count.players].emit('info', {id: count.players, msg: 'Welcome! You are player 2 (the right one)'});
  } else if(count.players > 2) {
    object.sockets[count.players].emit('info', {id: count.players, msg: 'Server is full. You can only watch as the other plays'});
  }

});

var Player = function (id, nickname, position) {

  this.id = id;
  this.nickname = nickname;
  this.position = position;

  if(this.position == 0) {
    this.x = 0 + 20;
  } else if(this.position == 1) {
    this.x = config.canvas_width - 20 - config.player_width;
  } else {
    this.x = 0;
  }

  this.y = (config.canvas_height / 2) - (config.player_height / 2);

  interval.cooldown.playerMove[this.id] = false;

  this.init();

};

Player.prototype = {
  log: function (data) {
    console.log('Player ' + this.id + ': ' + data);
  },
  init: function () {
    this.bindSockets();
  },
  bindSockets: function () {

    var player = this;
    var socket = object.sockets[player.id];
    socket.on('disconnect', function () {
      player.log('Disconnected');
      delete object.sockets[player.id];
      delete object.players[player.id];
      endGame();
      io.emit('reset', {winner: 3 - player.id});
    });
    socket.on('activeKey', function (data) {

      if(interval.cooldown.playerMove[player.id] == false) {
        interval.cooldown.playerMove[player.id] = true;
        if(data.activeKey[38] == true) {
          if(player.y > 0) {
            player.y = player.y - config.player_speed;
          }
        }
        if(data.activeKey[40] == true) {
          if(player.y + config.player_height < config.canvas_height) {
            player.y = player.y + config.player_speed;
          }
        }
        setTimeout(function () {
          interval.cooldown.playerMove[player.id] = false;
        }, config.player_interval - 10);
      }

    });

  }
};

var Ball = function (id) {

  this.id = id;

  this.x = (config.canvas_width / 2) - (config.ball_radius / 2);

  this.y = (config.canvas_height / 2) - (config.ball_radius / 2);

  this.dx = true;
  this.dy = true;

  this.init();

};

Ball.prototype = {
  log: function (data) {
    console.log('Ball ' + this.id + ': ' + data);
  },
  init: function () {

    this.log('Ball initzialized');
    var ball = this;

    interval.ball = setInterval(function () {

      if(ball.dy == true) {
        ball.y = ball.y + config.ball_speed;
      }
      if(ball.dy == false) {
        ball.y = ball.y - config.ball_speed;
      }

      if (ball.y >= config.canvas_height - config.ball_radius) {
        ball.dy = false;
      }
      if (ball.y - config.ball_radius <= 0) {
        ball.dy = true;
      }

      if(ball.dx == true) {
        ball.x = ball.x + config.ball_speed;
      }
      if(ball.dx == false) {
        ball.x = ball.x - config.ball_speed;
      }

      if (ball.x >= config.canvas_width - config.ball_radius) {
        //ball.dx = false;

        endGame();

        io.emit('reset', {winner: 1, looser: 2});
      }
      if (ball.x - config.ball_radius <= 0) {
        //ball.dx = true;

        endGame();

        io.emit('reset', {winner: 2, looser: 1});
      }

      for(player in object.players) {
        if(object.players[player].position == 0) {
          if(ball.x < object.players[player].x + config.player_width + (config.ball_radius / 2)
            && ball.y < object.players[player].y + config.player_height
            && ball.y > object.players[player].y) {
            ball.dx = true;
            config.ball_speed = config.ball_speed + config.ball_increase_on_hit;
            io.emit('ball-speed', config.ball_speed);
          }
        }

        if(object.players[player].position == 1) {
          if(ball.x > object.players[player].x - (config.ball_radius / 2)
            && ball.y < object.players[player].y + config.player_height
            && ball.y > object.players[player].y) {
            ball.dx = false;
            config.ball_speed = config.ball_speed + config.ball_increase_on_hit;
            io.emit('ball-speed', config.ball_speed);
          }
        }
      }

    }, config.ball_interval);

  }
};

var createBall = function () {
  count.ball++
  object.balls[count.ball] = new Ball (count.ball);
};
var startGame = function () {
  createBall();
  interval.game = setInterval(function () {
    io.emit('drawingTime', {players: object.players, balls: object.balls});
  }, 1000 / config.map_fps);
};

var endGame = function () {
  count.ball = 0;
  count.players = 0;
  for(ball in object.balls) {
    delete object.balls[ball];
  }
  for(player in object.players) {
    delete object.players[player];
  }
  clearInterval(interval.ball);
  clearInterval(interval.game);
};
