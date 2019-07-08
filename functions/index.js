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
    return db.doc(`/yaps/${snapshot.data().yapId}`).get()
    .then(doc => {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch(err => {
        console.error(err);
    })
});

exports.deleteNotificationOnUnLike = functions.firestore.document('likes/{id}').onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`).delete()
    .catch(err=>{
        console.error(err);
    })
})

exports.createNotificationOnComment = functions.firestore.document('comments/{id}').onCreate((snapshot) => {
    return db.doc(`/yaps/${snapshot.data().yapId}`).get()
    .then(doc => {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch(err => {
        console.error(err);
    })
});

//to update image on each yap or comment
exports.onUserImageChange = functions.firestore.document('/users/{userId}').onUpdate((change) => {
    console.log(change.before.data())
    console.log(change.after.data())
    if(change.before.data().imageUrl !== change.after.data().imageUrl) {
        console.log('image changed')
        let batch=db.batch();
        return db.collection('yaps').where('userHandle', '==', change.before.data().handle).get()
        .then(data => {
            data.forEach(doc => {
                const yap =db.doc(`/yaps/${doc.id}`)
                batch.update(yap, {userImage: change.after.data().imageUrl})
            });
            return batch.commit();
        })
    } else return true;
})

exports.onYapDelete = functions.firestore.document('/yaps/{yapId}').onDelete((snapshot, context) => {
    const yapId = context.params.yapId;
    const batch = db.batch();
    return db.collection('comments').where('yapId', '==', yapId).get()
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/comments/${doc.id}`))
        });
        return db.collection('likes').where('yapId', '==', yapId).get();
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/likes/${doc.id}`))
        });
        return db.collection('notifications').where('yapId', '==', yapId).get();
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/notifications/${doc.id}`))
        });
        return batch.commit()
    })
    .catch(err=>console.log(err))
})

