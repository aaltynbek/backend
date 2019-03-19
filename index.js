const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const routes = require('./routes');
const fileUpload = require('express-fileupload');

const app = express();
app.use(express.static('uploads'));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const server = http.Server(app);
server.listen(3000, () => console.log('listening on *:3000'));
routes(app);

// Allow the server to participate in the chatroom through stdin.
const stdin = process.openStdin();
stdin.addListener('data', (d) => {
    console.log(d.toString().trim());
});
