const functions = require('firebase-functions');
const firebase = require('firebase');
const app = require('express')();
const FBAuth = require('./util/fbAuth')

const { getAllYaps, postOneYap } = require('./handlers/yaps');

const { signup, login } = require('./handlers/users');


//Yap routes
app.get('/yaps', getAllYaps)
app.post('/yaps',FBAuth, postOneYap)

//signup and login routes

app.post('/signup', signup)

app.post('/login', login)


exports.api = functions.https.onRequest(app);