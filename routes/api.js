'use strict';


var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var sess;
var db;
const MONGODB_CONNECTION_STRING = process.env.DB;
const db_client = new MongoClient(process.env.DB, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});


module.exports = function (app) {
  db_client.connect((err, client) => {
    if (err) {
      console.log("Database error: " + err);
    } else {
      console.log("Successful database connection");
    }
    db = client.db("hcc");
  });

  app.get('/api/insertone', (req, res) => {
    db.collection('test').insertOne({ dummy: 'dummy' }, function (err, r) {
      if (err) {
        console.log("error inserting new record.");
      }
      res.send('insert one');
    });
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//Posts page (static HTML)
app.route('/api/posts')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/posts.html');
  });
app.route('/api/post_01')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/view-post.html');
  });
app.route('/api/new-post')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/new-post.html');
  });
app.route('/api/test')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/test.html');
  });
app.route('/api/account')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/account.html');
  });

// Login
app.route('/api/login')
  .get(function (req, res) { 
    // pass Login form
    console.log('Route:/api/login ; Method: get');
    res.sendFile(process.cwd() + '/views/login.html');
  })
  .post(function (req, res) {
    // Verify login
    console.log('Route:/api/login ; Method: post');
    db.collection('accounts').findOne({ email: req.body.v_email }, function (err, r) {
      if (err) {
        console.log("error with findOne() on route /api/login ...");
      }
      if (r.password== req.body.v_passwd) {
        console.log('Login successful');
        sess = req.session;
        sess.key = req.body.v_email;
        console.log(sess);
        res.sendFile(process.cwd() + '/views/posts.html');
      } else {
        res.json({'login':'fail'})
      }
    });

    
  })
// Process login form data

// verify login session data
app.route('/api/verify_login')
  .get(function (req, res) {
    console.log('Route:/api/verify_login ; Method: get');
    sess = req.session;
    console.log(sess);
    if(!sess.key) {
        return res.redirect('/api/login');
    }
    res.sendFile(process.cwd() + '/views/posts.html');
  });

// register
app.route('/api/register')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/register.html');
  })
  .post(function (req, res) {
    console.log('Route:/api/register ; Method: post');
    console.log('session data:',sess);
    // username is for display purpose
    // email and password are used for login validation
    // TODO: Use Bcrypt to encrypt password
    let obj = { 
      username: req.body.v_uname,
      email: req.body.v_email,
      password: req.body.v_passwd
    }
    db.collection('accounts').insertOne(obj, function (err, r) {
      if (err) {
        console.log("error inserting new record.");
      }
    });
    res.redirect('/api/login')
  });

// password reset request
app.route('/api/passwd_reset_req')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/passwd_reset_req.html');
  })
  .post(function (req, res) {
    console.log('Route:/api/passwd_reset_req ; Method: post');
    // verify reset code. If valid
    res.sendFile(process.cwd() + '/views/account.html');
    // if invalid, kick back to passwd_reset_req.html
    
  });

// password reset
app.route('/api/passwd_reset')
.get(function (req, res) {
  res.sendFile(process.cwd() + '/views/passwd_reset.html');
})
.post(function (req, res) {
  console.log('Route:/api/passwd_reset_req ; Method: post');
  console.log(sess);
  res.sendFile(process.cwd() + '/views/account.html');
});

// logout
app.route('/api/logout')
  .get(function (req, res) {
    req.session.destroy();
    res.sendFile(process.cwd() + '/views/index.html');
  });

// Image upload
app.post('/api/upload', function (req, res) {
  var photos = [],
      form = new formidable.IncomingForm();

  // Tells formidable that there will be multiple files sent.
  form.multiples = true;
  // Upload directory for the images
  form.uploadDir = path.join(__dirname, 'tmp_uploads');

  // Invoked when a file has finished uploading.
  form.on('file', function (name, file) {
      // Allow only 3 files to be uploaded.
      if (photos.length === 3) {
          fs.unlink(file.path);
          return true;
      }

      var buffer = null,
          type = null,
          filename = '';

      buffer = readChunk.sync(file.path, 0, 262);
      type = fileType(buffer);

      // Check the file type, must be either png,jpg or jpeg
      if (type !== null && (type.ext === 'png' || type.ext === 'jpg' || type.ext === 'jpeg')) {
          // Assign new file name
          filename = Date.now() + '-' + file.name;

          // Move the file with the new file name
          fs.rename(file.path, path.join(__dirname, 'uploads/' + filename), (err) => {
              if (err) throw err;
          });

          // Add to the list of photos
          photos.push({
              status: true,
              filename: filename,
              type: type.ext,
              publicPath: 'uploads/' + filename
          });
      } else {
          photos.push({
              status: false,
              filename: file.name,
              message: 'Invalid file type'
          });
          fs.unlink(file.path);
      }
  });

  form.on('error', function(err) {
      console.log('Error occurred during processing - ' + err);
  });

  // Invoked when all the fields have been processed.
  form.on('end', function() {
      console.log('Image upload successful.');
  });

  // Parse the incoming form fields.
  form.parse(req, function (err, fields, files) {
      res.status(200).json(photos);
  });
});

};
