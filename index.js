let express = require ('express');
let path = require('path');
let app = express();

// set up static files serving
app.use(express.static(path.join(__dirname, 'public')));

// Define the port to run on
app.set('port', 8080);

let port = app.get('port');

app.listen (port, function () {

  console.log ('Node Chat listening on port ' + port + '.');

});
