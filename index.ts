import http from 'http'
import 'module-alias/register';
import '@mw';
import '@services';

import app from '@app';
import routes from '@routes';
import socket from '@socket'
import firebase from "@firebase"

app.use(routes);

const server = http.createServer(app);

import bus from '@modules/bus';
bus.emit('event.test', '12345');


server.listen(5000, '0.0.0.0');

socket.socketStartUp(server);
firebase.firebaseUp();

import './db-scripts';