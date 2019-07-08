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
                createdAt:doc.data().createdAt,
                commentCount: doc.data().commentCount,
                likeCount: doc.data().likeCount,
                userImage: doc.data().userImage
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
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount:0,
        commentCount:0
    };

    db.collection('yaps')
        .add(newYap)
        .then(doc => {
            const resYap = newYap;
            resYap.yapId = doc.id;
            res.json(resYap);
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
        console.log(err);
        return res.status(500).json({ error: err.code});
    })

}

exports.deleteYap = (req,res) => {
    const document = db.doc(`/yaps/${req.params.yapId}`);
    document.get()
    .then(doc => {
        if(!doc.exists) {
            return res.status(404).json({error:'yap not found'});
        }
        if(doc.data().userHandle !==req.user.handle){
            return res.status(403).json({error:'Unauthorized'});
        }
        else{
            return document.delete();
        }
    })
    .then(()=>{
        res.json({message: 'Yap Deleted'})
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({ error: err.code});
    })
}

exports.commentOnYap = (req,res) => {
    if(req.body.body.trim() === '') return res.status(400).json({comment:'Comment must not be empty'})

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
        return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
    })
    .then(()=>{
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

exports.likeYap = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', "==", req.user.handle)
        .where('yapId', '==', req.params.yapId).limit(1);
    
    const yapDocument = db.doc(`/yaps/${req.params.yapId}`);

    let yapData;

    yapDocument.get()
        .then(doc => {
            if(doc.exists){
                yapData = doc.data();
                yapData.yapId = doc.id;
                return likeDocument.get();
            }
            else {
                return res.status(404).json({empty:'yap not found'})
            }
        })
        .then(data => {
            if(data.empty){
                return db.collection('likes').add({
                    yapId: req.params.yapId,
                    userHandle: req.user.handle
                })
                .then(() => {
                    yapData.likeCount++
                    return yapDocument.update({ likeCount: yapData.likeCount })
                })
                .then(()=> {
                    return res.json(yapData);
                })
            }
            else {
                return res.status(400).json({error:'yap already liked'})
            }
        })
        .catch(err=>{
            console.log(err);
            res.status(500).json({error:err.code})
        })
}

exports.unlikeYap =(req,res)=>{
    const likeDocument = db.collection('likes').where('userHandle', "==", req.user.handle)
        .where('yapId', '==', req.params.yapId).limit(1);
    
    const yapDocument = db.doc(`/yaps/${req.params.yapId}`);

    let yapData;

    yapDocument.get()
        .then(doc => {
            if(doc.exists){
                yapData = doc.data();
                yapData.yapId = doc.id;
                return likeDocument.get();
            }
            else {
                return res.status(404).json({empty:'yap not found'})
            }
        })
        .then(data => {
            if(data.empty){
                return res.status(400).json({error:'yap not liked'})
                
            }
            else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                .then(()=>{
                    yapData.likeCount--;
                    return yapDocument.update({ likeCount: yapData.likeCount });
                })
                .then(()=> {
                    res.json(yapData);
                })
            }
        })
        .catch(err=>{
            console.log(err);
            res.status(500).json({error:err.code})
        })
}

