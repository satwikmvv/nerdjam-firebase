const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth') //middleware for authentication when posting to secure it for that particular user using the user token
const cors = require('cors');
const { db } = require('./util/admin')
app.use(cors())


const { getAllYaps, postOneYap, getYap, deleteYap, commentOnYap, likeYap, unlikeYap } = require('./handlers/yaps');

const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/users');


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
app.get('/user/:handle', getUserDetails)
app.post('/notifications', FBAuth, markNotificationsRead)




exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore.document('likes/{id}').onCreate((snapshot) => {
    db.doc(`/yaps/${snapshot.data().yapId}`).get()
    .then(doc => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                read: false,
                yapId: doc.id,
                type: 'like',
                createdAt: new Date().toISOString()
            })
        }
    })
    .then(()=>{
        return;
    })
    .catch(err => {
        console.error(err);
        return;
    })
});

exports.deleteNotificationOnUnLike = functions.firestore.document('likes/{id}').onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`).delete()
    .then(()=>{
        return;
    })
    .catch(err=>{
        console.error(err);
        return;
    })
})

exports.createNotificationOnComment = functions.firestore.document('comments/{id}').onCreate((snapshot) => {
    db.doc(`/yaps/${snapshot.data().yapId}`).get()
    .then(doc => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                read: false,
                yapId: doc.id,
                type: 'comment',
                createdAt: new Date().toISOString()
            })
        }
    })
    .then(()=>{
        return;
    })
    .catch(err => {
        console.error(err);
        return;
    })
});

