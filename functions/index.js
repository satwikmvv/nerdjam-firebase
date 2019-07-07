const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth') //middleware for authentication when posting to secure it for that particular user using the user token
const cors = require('cors');
app.use(cors())


const { getAllYaps, postOneYap, getYap, commentOnYap } = require('./handlers/yaps');

const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');


//Yap routes
app.get('/yaps', getAllYaps)
app.post('/yap',FBAuth, postOneYap)
app.get('/yap/:yapId', getYap)
app.post('/yap/:yapId/comment', FBAuth, commentOnYap)

//signup and login routes

app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)




exports.api = functions.https.onRequest(app);