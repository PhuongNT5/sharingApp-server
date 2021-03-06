import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { userRouter } from './routes';
import { lessonRouter } from './routes';
import { noteRouter } from './routes';

// const app = express();
dotenv.load({ path: '.env' });
// app.set('port', (process.env.PORT || 3000));

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// app.use('/', express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

app.use(morgan('dev'));

// if (process.env.NODE_ENV === 'test') {
//   mongoose.connect(process.env.MONGODB_TEST_URI);
// } else {
mongoose.connect(process.env.MONGODB_URI);
// }

const db = mongoose.connection;
(<any>mongoose).Promise = global.Promise;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');

  app.use('/api/user', userRouter);
  app.use('/api/lesson', lessonRouter);
  app.use('/api/note', noteRouter);

  // app.get('/*', function(req, res) {
  //   res.sendFile(path.join(__dirname, '../public/index.html'));
  // });

  io.on('connection', (socket) => {

    socket.on('disconnect', function () {
      io.emit('users-changed', { user: socket.nickname, event: 'left' });
    });

    socket.on('set-nickname', (nickname) => {
      socket.nickname = nickname;
      io.emit('users-changed', { user: nickname, event: 'joined' });
    });

    socket.on('add-message', (message) => {
      io.emit('message', { text: message.text, from: socket.nickname, created: new Date() });
    });
  });

  const port = process.env.PORT || 3000;
  http.listen(port, function(){
     console.log('listening in http://localhost:' + port);
  });

});



export { app };
