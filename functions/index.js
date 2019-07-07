const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const firebase = require('firebase');
var serviceAccount = require("./serviceAccount.json");

const app = express();



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://nerdjam-32e91.firebaseio.com"
});

const firebaseConfig = {
    apiKey: "AIzaSyAmzG7MbCoW811HvM5WdbQ6nAJloDPO_co",
    authDomain: "nerdjam-32e91.firebaseapp.com",
    databaseURL: "https://nerdjam-32e91.firebaseio.com",
    projectId: "nerdjam-32e91",
    storageBucket: "nerdjam-32e91.appspot.com",
    messagingSenderId: "42620337165",
    appId: "1:42620337165:web:5cb785069b8978f0"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = admin.firestore()
app.get('/yaps', (req,res) => {
    db
    .collection('yaps')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
        let yaps = [];
        data.forEach(doc => {
            yaps.push({
                yapId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt:doc.data().createdAt
            })
        });
        return res.json(yaps)
    })
    .catch(err => console.error(err))
})


const FBAuth = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    }
    else {
        console.error('no token found')
        return res.status(403).json({ error: 'Unauthorized'});
    }

    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        req.user = decodedToken;
        console.log(decodedToken)
        return db.collection('users')
            .where('userId', '==', req.user.uid)
            .limit(1)
            .get()
    })
    .then(data => {
        req.user.handle = data.docs[0].data().handle;
        return next();
    })
    .catch(err => {
        console.error('Error verifying token', err)
        return res.status(403).json(err);
    })
}

app.post('/yaps',FBAuth, (req,res) => {
    const newYap = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    };

    db.collection('yaps')
        .add(newYap)
        .then(doc => {
            res.json({ message: `document ${doc.id} created!`});
        })
        .catch(err => {
            console.error(error);
            return res.status(500).json({ error: `Shit hit the fan! ${err}`});
        })
})

//shuda used typescript to skip this empty and null checks - too late for regrets now and firebase should use es6 already, writing if blocks..bleh!
const isEmpty = (string) => {
    if(string.trim() == '') return true;
    else return false;
}

const isEmail = (email) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regex)) return true
    else return false;
}

//signup

app.post('/signup', (req,res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    let errors = {};
    if(isEmpty(newUser.email)){
        errors.email = 'Email must not be empty!'
    }
    else if(!isEmail(newUser.email)){
        errors.email = 'Must be valid email'
    }
    
    if(isEmpty(newUser.password)){
        errors.password = 'password must not be empty!'
    }
    if(isEmpty(newUser.handle)){
        errors.handle = 'handle must not be empty!'
    }

    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'passwords not matched!'

    if(Object.keys(errors).length > 0) return res.status(400).json(errors)

    //TODO validate data
    let token,userId;
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists) {
            return res.status(400).json({ handle: 'this handle is already taken!'});
        }
        else {
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then(tokenId => {
        token = tokenId;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
        return res.status(201).json({ token })
    })
    .catch(err => {
        console.error(err);
        if(err.code == 'auth/email-already-in-use') {
            return res.status(400).json({email:'Email is already in use'});
        }
        else {
            return res.status(500).json({ error: err.code})
        }
    });
})

app.post('/login', (req,res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {};
    if(isEmpty(user.email)){
        errors.email = 'Email must not be empty!'
    }
    else if(!isEmail(user.email)){
        errors.email = 'Must be valid email'
    }
    
    if(isEmpty(user.password)){
        errors.password = 'password must not be empty!'
    }

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
        return data.user.getIdToken();
    })
    .then(token => {
        return res.json({token})
    })
    .catch(err => {
        console.error(err);
        if(err.code == 'auth/wrong-password'){
            return res.status(403).json({general: 'wrong credentials'})
        } else return res.status(500).json({ error: err.code});
    })
})


exports.api = functions.https.onRequest(app);