require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require("body-parser");

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { socketCon } = require('./server/util/socketCon');
socketCon(io);

// Setup for using static files in express
app.use(express.static("public"));

// Setup body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// API routes
app.use('/api/' + process.env.API_VERSION,
    [
        require('./server/routes/task_route'),
        require('./server/routes/section_route')
    ]
);

app.use((req, res, next) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

// error handling
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send('Internal Server Error');
});


http.listen(port, () => {
    console.log(`App is currently listening on http://localhost:${port}`);
});
