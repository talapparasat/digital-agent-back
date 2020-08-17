import express from "@routes";

export {};
import app from '@app';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import requestTime from './request_time';
import authenticate from './auth';
import logger from 'morgan';
import cors from 'cors';
import initdb from '@config/initdb'

console.log("index");


// mongoose.connect('mongodb://mongo1:27017,mongo2:27017,mongo3:27017/digital-agent2', {
mongoose.connect('mongodb://localhost:27017,localhost:27018,localhost:27019/digital-agent3', {
    // replicaSet: 'rs0',
    // connectWithNoPrimary: true,
    // useUnifiedTopology: true
    useNewUrlParser: true,
    useFindAndModify: false, // optional
    useCreateIndex: true,
    replicaSet: 'rs0',
    reconnectTries: 120,
    reconnectInterval: 1000

});//{ replicaSet: 'sh1' , useNewUrlParser: true});

mongoose.set('autoCreate', true);
mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');


    initdb.initSchemas();
    // initdb.initRoles();
});

app.use(cors());
app.options('*', cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(requestTime);
app.use(authenticate);

