// Dependencies

// Express
const app = require('express')();

// Socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Other
const path = require('path');
const fs = require('fs');
const hex_rgb = require('hex-rgb');

// Constants
const port = 8080;

// Data Model
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

  console.log('A new user has connected.');

  // generates a nickname for the new user
  random_nickname(function(nickname, error) {

    if (error) {
      console.log('Error');
    } else {

      console.log('The new user has been given "' + nickname + '" nickname.');

      // adds the new user to the online users
      const logged_out_user_id = current_unique_id;
      const nickname_color = {'alpha': 255, 'blue': 0, 'green': 0, 'red': 0};
      users_online.push({'user_id': current_unique_id, 'nickname': nickname, 'nickname_color': nickname_color});

      // sends a generated nickname and message history to the new user
      socket.emit('nickname_and_id_and_message_history', nickname, current_unique_id, messages);
      current_unique_id++;

      // sends an updated list of online users to the online users
      io.sockets.emit('users_online_did_change', users_online);

      socket.on('disconnect', function() {

        // removes the disconnected user from the list of online users
        users_online.removeIf( function(user_online, idx) {
          return user_online.user_id === logged_out_user_id;
        });

        console.log('A user with "' + logged_out_user_id + '" id has disconnected.');

        // sends an updated list of online users to the online users
        io.sockets.emit('users_online_did_change', users_online);
      });
    }
  });

  // new message from the client
  socket.on('new_message_from_client', function (message) {

    const command = message.text.substring(0, 11);

    if (command !== undefined && command === '/nickcolor ') {

      const new_nickname_color = message.text.substring(11, 17);

      try {
        const new_nickname_color_rgb = hex_rgb(new_nickname_color);

        // TODO: replace the code below to users

        // changes a nickname_color in users_online
        users_online.forEach(function(user_online) {
          if (message.author_nickname === user_online.nickname) {
            user_online.nickname_color = new_nickname_color_rgb;
          }
        });

        socket.emit('nickname_color_did_change', new_nickname_color_rgb);
      } catch (error) {
        console.log('Invalid /nickcolor command');
      }
    } else {

      const command = message.text.substring(0, 6);

      if (command !== undefined && command === '/nick ') {

        const old_nickname = message.author_nickname;
        const new_nickname = message.text.substring(6);

        // TODO: replace the code to users
        users_online.forEach(function(user_online) {

          // checks if the new nickname is unique
          if (user_online.nickname === new_nickname) {
            return;
          }

          // updates a nickname
          if (user_online.nickname === old_nickname) {
            user_online.nickname = new_nickname;
            return user_online;
          }
        });

        socket.emit('nickname_did_change', new_nickname);
        io.sockets.emit('users_online_did_change', users_online);

      } else {

        // simple message

        // TODO: replace this to users

        users_online.forEach(function(user_online) {
          if (message.author_nickname === user_online.nickname) {

            message.author_nickname_color = user_online.nickname_color;
            message.timestamp = Date.now();
            messages.push(message);
            console.log("New massage has been recieved: '" + message.text + "'.");

            // broadcasts to all the users
            io.sockets.emit('new_message_from_server', message);
          }
        });
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
    } while (
      // TODO: replace this to users
      users_online.forEach(function(user_online) {

        // checks if the new nickname is unique
        if (user_online.nickname === nickname) {
          return true;
        } else {
          return false;
        }
      })
    );
    callback(nickname, null);
});
}

/*
  Capitalizes the first letter of each string in the text.
*/
String.prototype.capitalized = function() {

  let array = this.split(' ');

  array = array.map(word => word.charAt(0).toUpperCase() + word.slice(1));

  return array.join(' ');

}

function Message(author, text, timestamp) {
  this.author = author;
  this.text = text;
  this.timestamp = timestamp;
}

/*
  Removes elements, which properties are equal to the value, from the array.
*/
Array.prototype.removeIf = function(callback) {
    var i = 0;
    while (i < this.length) {
        if (callback(this[i])) {
            this.splice(i, 1);
        }
        else {
            ++i;
        }
    }
};
