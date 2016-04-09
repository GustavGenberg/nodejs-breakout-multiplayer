var config = [], socket;
config.socket_protocol = 'http';
config.socket_host = 'localhost';
config.socket_port = '2222';

var activeKey = {};
var canvas, ctx;
var client = [];

function loadScript(url, callback) {
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	script.onload = callback;
	head.appendChild(script);
}

loadScript('http://code.jquery.com/jquery-2.2.2.min.js', function () {
  loadScript(config.socket_protocol + '://' + config.socket_host + ':' + config.socket_port + '/socket.io/socket.io.js', function () {
    socket = io(config.socket_host + ':' + config.socket_port);
    socket.on('config', function (data) {
      config = data;

      client.ball_speed = config.ball_speed;
      client.msg = '';
      client.frames_counter = 0;

      init();
    });
  });
});

var bindSockets = function () {
  setInterval(function () {
    socket.emit('activeKey', {activeKey: activeKey});
  }, config.player_interval);
  socket.on('drawingTime', function (data) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (player in data.players) {
      ctx.beginPath();
      ctx.fillStyle = '#FFF';
      ctx.fillRect(data.players[player].x, data.players[player].y, config.player_width, config.player_height);
      ctx.closePath();
    }

    for(ball in data.balls) {
      ctx.beginPath();
      ctx.arc(data.balls[ball].x, data.balls[ball].y, config.ball_radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(29, 24, 230)';
      ctx.fill();
      ctx.closePath();
    }

    ctx.beginPath();
    ctx.fillStyle = '#f00';
    ctx.fillText('FPS: ' + config.client_fps + ' / ' + config.map_fps, 5, 15);
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = '#f00';
    ctx.fillText(client.msg, (canvas.width / 2) - (client.msg.length / 2 * 4), 15);
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = '#f00';
    ctx.fillText('BS: ' + Math.floor(client.ball_speed), 5, canvas.height);
    ctx.closePath();

    client.frames_counter++;

  });
  socket.on('info', function (data) {
    client.msg = data.msg;
		client.id = data.id;
  });
  socket.on('ball-speed', function (data) {
    client.ball_speed = data;
  });
	socket.on('reset', function (data) {
		//ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.beginPath();
		ctx.font = '40px Courier';
		if(client.id == data.winner) {
			ctx.fillText('You Won!', 50, 150);
		} else if(client.id == data.looser) {
			ctx.fillText('You Lost!', 50, 150);
		} else {
			ctx.fillText('Game over!', 50, 150);
		}
		ctx.closePath();
	});
  socket.on('disconnect', function () {
    window.location.reload();
  });
};

var bindKeys = function () {
  document.addEventListener('keydown', function (event) {
    if(event.keyCode == 38) {
      activeKey[38] = true;
    }
    if(event.keyCode == 40) {
      activeKey[40] = true;
    }
  });
  document.addEventListener('keyup', function (event) {
    if(event.keyCode == 38) {
      delete activeKey[38];
    }
    if(event.keyCode == 40) {
      delete activeKey[40];
    }
  });
};

var init = function () {

  console.log('init()');

  bindSockets();
  bindKeys();

  canvas = document.createElement('canvas');
  canvas.width = config.canvas_width;
  canvas.height = config.canvas_height;
  canvas.style.border = '1px solid grey';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');

  setInterval(function () {
    config.client_fps = client.frames_counter;
    client.frames_counter = 0;
  }, 1000);

};
