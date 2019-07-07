const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth') //middleware for authentication when posting to secure it for that particular user using the user token
const cors = require('cors');
app.use(cors())


const { getAllYaps, postOneYap } = require('./handlers/yaps');

const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');


//Yap routes
app.get('/yaps', getAllYaps)
app.post('/yaps',FBAuth, postOneYap)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

//signup and login routes

app.post('/signup', signup)

app.post('/login', login)




exports.api = functions.https.onRequest(app);