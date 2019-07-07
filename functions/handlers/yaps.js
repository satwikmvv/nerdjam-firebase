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
            console.error(error);
            return res.status(500).json({ error: `Shit hit the fan! ${err}`});
        })
}