// Express
let app = require('express')();

// Socket.io
let server = require('http').Server(app);
let io = require('socket.io')(server);

// Other Dependencies
let path = require('path');
let fs = require('fs');

const hex_rgb = require('hex-rgb');

let port = 8080;

server.listen(port, function() {
  console.log('listening on port ' + port + '.');
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, './public', 'index.html'));
});

io.on('connection', function(socket) {
  console.log("A new user has connected.");

  random_nickname(function(nickname, error) {
    if (error) {
      console.log('Error');
    } else {
      console.log("The new user has been given '" + nickname + "' nickname.");
      socket.emit('nickname', nickname);
      socket.on('disconnect', function() {
        console.log("A user with '" + nickname + "' has disconnected.");
      });
    }
  });

  socket.on('new_message', function (message) {

    let command = message.substring(0, 11);

    if (command !== undefined && command === "/nickcolor ") {

      let new_nickname_color = message.substring(11, 17);

      try {
        let new_nickname_color_rgb = hex_rgb(new_nickname_color);
        socket.emit('nickname_color', new_nickname_color_rgb);
      } catch (error) {
        console.log("Invalid /nickcolor command");
      }
    } else {

      let command = message.substring(0, 6);

      if (command !== undefined && command === "/nick ") {

        let new_nickname = message.substring(6);

        socket.emit('nickname', new_nickname);

      } else {
        // simple message
        console.log("New massage has been recieved: '" + message + "'.");
      }
    }
  });
});

/*
  Returns a random nickname.

  Asynchronous.
*/
function random_nickname(callback) {

  let file_path = path.join(__dirname, './nickname.json');

  fs.readFile(file_path, 'utf8', function (error, data) {

    if (error) {

      callback(null, error)

    }

    let jsonContent = JSON.parse(data);

    let adjective = jsonContent.adjectives[Math.floor(Math.random() * jsonContent.adjectives.length)];

    let noun = jsonContent.nouns[Math.floor(Math.random() * jsonContent.nouns.length)];

    let nickname = adjective.capitalized() + ' ' + noun.capitalized();

    callback(nickname, null);
});
}

/*
  Capitalizes the first letter of each string in the text.
*/
String.prototype.capitalized = function() {

  let array = this.split(" ");

  array = array.map(word => word.charAt(0).toUpperCase() + word.slice(1));

  return array.join(" ");

}
