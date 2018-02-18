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

let users_online = [];
let current_unique_id = 0;

let messages = [];

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
      let logged_out_user_id = current_unique_id;
      users_online[current_unique_id] = nickname;
      current_unique_id++;
      socket.emit('nickname_and_message_history', nickname, messages);
      io.sockets.emit('users_online_did_change', users_online);

      socket.on('disconnect', function() {

        users_online[logged_out_user_id] = null;

        console.log("A user with '" + logged_out_user_id + "' id has disconnected.");

        io.sockets.emit('users_online_did_change', users_online);
      });
    }
  });

  socket.on('new_message_from_client', function (message) {

    let command = message.text.substring(0, 11);

    if (command !== undefined && command === "/nickcolor ") {

      let new_nickname_color = message.text.substring(11, 17);

      try {
        let new_nickname_color_rgb = hex_rgb(new_nickname_color);
        socket.emit('nickname_color_did_change', new_nickname_color_rgb);
      } catch (error) {
        console.log("Invalid /nickcolor command");
      }
    } else {

      let command = message.text.substring(0, 6);

      if (command !== undefined && command === "/nick ") {

        let old_nickname = message.author;
        let new_nickname = message.text.substring(6);

        let id;
        for (let key in users_online) {

          // checks if the new nickname is unique
          if (users_online[key] === new_nickname) {
            return;
          }

          if (users_online[key] === old_nickname) {
            id = key;
            break;
          }
        }

        users_online[id] = null;
        users_online[id] = new_nickname;

        socket.emit('nickname_did_change', new_nickname);
        io.sockets.emit('users_online_did_change', users_online);

      } else {

        // simple message

        let timestamp = Date.now();
        message.timestamp = timestamp;

        messages.push(message);

        console.log("New massage has been recieved: '" + message.text + "'.");

        // TODO: broadcast to all the users
        io.sockets.emit('new_message_from_server', message);
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

    // generates a new unique nickname
    let nickname;
    do {
      let adjective = jsonContent.adjectives[Math.floor(Math.random() * jsonContent.adjectives.length)];
      let noun = jsonContent.nouns[Math.floor(Math.random() * jsonContent.nouns.length)];
      nickname = adjective.capitalized() + ' ' + noun.capitalized();
    } while (users_online[nickname] === null);

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

function Message(author, text, timestamp) {
  this.author = author;
  this.text = text;
  this.timestamp = timestamp;
}
