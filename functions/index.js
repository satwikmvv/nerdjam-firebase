const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth') //middleware for authentication when posting to secure it for that particular user using the user token
const cors = require('cors');
app.use(cors())


const { getAllYaps, postOneYap, getYap, deleteYap, commentOnYap, likeYap, unlikeYap } = require('./handlers/yaps');

const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');


//Yap routes
app.get('/yaps', getAllYaps)
app.post('/yap',FBAuth, postOneYap)
app.get('/yap/:yapId', getYap)
app.delete('/yap/:yapId', FBAuth, deleteYap)
app.post('/yap/:yapId/comment', FBAuth, commentOnYap)
app.get('/yap/:yapId/like', FBAuth, likeYap)
app.get('/yap/:yapId/unlike', FBAuth, unlikeYap)

//signup and login routes

app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)




exports.api = functions.https.onRequest(app);