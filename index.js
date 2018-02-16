// Express
let app = require('express')();

// Socket.io
let server = require('http').Server(app);
let io = require('socket.io')(server);

// Other Dependencies
let path = require('path');
let fs = require('fs');

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
      
      socket.emit('auth', nickname);

      socket.on('disconnect', function() {

        console.log("A user with '" + nickname + "' has disconnected.");

      });

    }

  });

});

/*
  Returns a ranom nickname.

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
