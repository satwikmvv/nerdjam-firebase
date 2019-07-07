const {db} = require('../util/admin')

exports.getAllYaps = (req,res) => {
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
}

exports.postOneYap = (req,res) => {
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
            console.error(err);
            return res.status(500).json({ error: `Shit hit the fan! ${err}`});
        })
}

exports.getYap = (req,res) => {
    let yapData = {};
    db.doc(`/yaps/${req.params.yapId}`).get()
    .then(doc => {
        if(!doc.exists) {
            return res.status(404).json({error:'yap not found'});
        }
        yapData = doc.data();
        yapData.yapId = doc.id;
        return db.collection('comments').orderBy('createdAt','desc').where('yapId','==',req.params.yapId).get();

    })
    .then(data=>{
        yapData.comments = [];
        data.forEach(doc => {
            yapData.comments.push(doc.data())
        })
        return res.json(yapData)
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code});
    })

}

exports.commentOnYap = (req,res) => {
    if(req.body.body.trim() === '') return res.status(400).json({error:'Comment must not be empty'})

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        yapId: req.params.yapId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/yaps/${req.params.yapId}`).get()
    .then(doc => {
        if(!doc.exists) return res.status(404).json({error:'yap not found'})
        return db.collection('comments').add(newComment);

    })
    .then(() => {
        res.json(newComment);
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({ error: err.code});
    })
}