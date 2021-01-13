const express = require('express');
const bodyParser= require('body-parser');
const ejs = require('ejs');
const multer = require('multer');
const path = require('path');
const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

const MongoClient = require('mongodb').MongoClient;

app.use('/uploads', express.static(path.join(__dirname, '/tmp/my-uploads')));


const myurl = 'mongodb://localhost:27017';


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const parts = file.mimetype.split('/');
        cb(null, file.fieldname + '-' + Date.now() + "."+parts[1])
    }
});

var upload = multer({ storage: storage });

MongoClient.connect(myurl ,{useUnifiedTopology: true}, (err, client) => {
    if (err) return console.log(err);
    db = client.db('test');
    app.listen(4000, () => {
        console.log('listening on 4000')
    })
});

app.get('/',function(req,res){
    res.render('index', {msg:''});

});

// upload single file

app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    const file = req.file;
    if(file === undefined)
        res.render('index', {msg: 'Please select a file'});
    var finalFile = {
        contentType: req.file.mimetype,
        name:  req.file.originalname
    };
    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error)
    }
    db.collection('mycollection').insertOne(finalFile, (err, result) => {
        console.log(result);
        if (err) return console.log(err);
        console.log('saved to database');
    });
    res.sendFile(`${__dirname}/uploads/${req.file.filename}`) // uncomment this for seeing the photo which u have uploaded
    //res.send(file)  //uncomment this to see the image information

});
//Uploading multiple files
app.post('/uploadmultiple', upload.array('myFiles', 12), (req, res, next) => {
    const files = req.files;
    if (!files) {
        const error = new Error('Please choose files');
        error.httpStatusCode = 400;
        return next(error)
    }

    res.send(files)

});


app.post('/uploadphoto', upload.single('picture'), (req, res) => {
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    // Define a JSONobject for the image attributes for saving to database

    var finalImg = {
        contentType: req.file.mimetype,
        image:  new Buffer(encode_image, 'base64')
    };
    db.collection('mycollection').insertOne(finalImg, (err, result) => {
        console.log(result);
        if (err) return console.log(err);
        console.log('saved to database');
        res.redirect('/')
    })
});


app.get('/photos', (req, res) => {
    db.collection('mycollection').find().toArray((err, result) => {
        const imgArray= result.map(element => element._id);
        if (err) return console.log(err);
        res.render('gallery')
    })
});

app.get('/photo/:id', (req, res) => {
    var filename = req.params.id;

    db.collection('mycollection').findOne({'_id': ObjectId(filename) }, (err, result) => {

        if (err) return console.log(err);
        res.contentType('image/jpeg');
        res.send(result.image.buffer)
    })
})