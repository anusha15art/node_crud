var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const uuid = require('uuid');

var db;
MongoClient.connect('mongodb://127.0.0.1:27017/ClintSideCode', (err, database) => {
  if (err) return console.log(err)
  db = database;
})

router.get('/', function(req, res, next) {
  db.collection('student').find().toArray((err, result) => {
    if (err) return console.log(err)
    res.render('liststudents.ejs', {allStudents: result})
  })
});

router.get('/AddStudent', function(req, res) {
  var formData =  {
    name: "",
    email: "",
    phone: '',

  };
 res.render('index.ejs', {errors:'', formData:formData});
})

router.post('/AddStudent', (req, res) => {

 req.checkBody('name', 'Invalid name').notEmpty();
 req.checkBody('email', 'Invalid email address').notEmpty().isEmail();
 req.checkBody('phone', 'Invalid phone number').notEmpty().isInt();
 req.checkBody('phone', 'Need 10 digit number').notEmpty().isInt().len(10);

 var formData =  {
   name: req.body.name,
   email: req.body.email,
   phone: req.body.phone,

 };

 var errors = req.validationErrors();
 if (errors) {
     // Render the form using error information
     res.render('index.ejs', { title: 'Create Genre', errors: errors, formData: formData});
 } else {
   db.collection('student').findOne({email: req.body.email}, function(err, document) {
    if(null == document){
     var guid = uuid.v1();
     req.body.userId = guid;
     db.collection('student').save(req.body, (err, result) => {
     if (err) return console.log(err)

     console.log('saved to database')
     res.redirect('/')
     })
    } else {
     console.log('Email Exists');
     res.render('index.ejs', {errors:[{param: 'email', msg: 'Email id Already in use', value: req.body.email}], formData: formData});
     //res.redirect('/');
    }
    });
 }


})


router.post('/SearchStudent', (req, res) => {
  console.log(req.body);
  var searchString = req.body.searchStr;
  db.collection('student').find({name:{'$regex' : '^'+searchString+'', '$options' : 'i'}}).toArray((err, result) => {
    if (err) return console.log(err)

	 console.log(result);
    // renders index.ejs
    res.render('liststudents.ejs', {allStudents: result});

  })
})

router.get('/ViewStudent', (req, res) => {
   var userId = req.query.userId;
   db.collection('student').findOne({userId: userId}, function(err, document) {
	   res.render('editstudent.ejs', {errors:[], currentStudent: document});
	});
})

router.post('/UpdateStudent', (req, res) => {

  req.checkBody('name', 'Invalid name').notEmpty();
  req.checkBody('email', 'Invalid email address').notEmpty().isEmail();
  req.checkBody('phone', 'Invalid phone number').notEmpty().isInt();
  req.checkBody('phone', 'Need 10 digit number').notEmpty().isInt().len(10);

  var formData =  {
   name: req.body.name,
   email: req.body.email,
   phone: req.body.phone,
   userId: req.body.userId
  };

  var serverErrors = req.validationErrors();
  if (serverErrors) {
     // Render the form using error information
     res.render('editstudent.ejs', { title: 'Create Genre', errors: serverErrors, currentStudent: formData});
  } else {
 // Load Existing user with userId
 //
    db.collection('student').findOne({userId: req.body.userId}, function(err, document) {
    var existingEmailId = document.email;
    var newEmailId = req.body.email;

    // Check Email Changed or not
    //
    if(existingEmailId != newEmailId){

     // If changed, find new Email existing in server or not
     //
     db.collection('student').findOne({email: newEmailId}, function(err, document) {
   if(null == document){
    // If new Email doesnt exist in server then save to db
    //
    db.collection('student').update({userId: req.body.userId}, req.body, (err, result) => {
     if (err) return console.log(err)
     res.redirect('/')
    })
   }
   else {
    // If new Email exits in server then print Error
    //
    res.render('editstudent.ejs', { title: 'Create Genre', errors: [ {msg:'Email id Already in use'}], currentStudent: formData});
   }
     });
    }
    else {
     // If Email is not changed, then save to db.
     //
     db.collection('student').update({userId: req.body.userId}, req.body, (err, result) => {
   if (err) return console.log(err)
   res.redirect('/')
     });
    }
 });
  }
})

router.get('/DeleteStudent', (req, res) => {
 var userId = req.query.userId;
 db.collection('student').findOneAndDelete({userId: userId},
  (err, result) => {
    if (err) return res.send(500, err)
		//console.log(result);
    res.redirect('/students');
  });
})

module.exports = router;
