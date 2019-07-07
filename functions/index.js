const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth') //middleware for authentication when posting to secure it for that particular user using the user token
const cors = require('cors');
app.use(cors())


const { getAllYaps, postOneYap } = require('./handlers/yaps');

const { signup, login, uploadImage } = require('./handlers/users');


//Yap routes
app.get('/yaps', getAllYaps)
app.post('/yaps',FBAuth, postOneYap)

//signup and login routes

app.post('/signup', signup)

app.post('/login', login)

app.post('/user/image', FBAuth, uploadImage)


exports.api = functions.https.onRequest(app);