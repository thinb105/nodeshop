const path = require('path');
const fs = require('fs');
const express = require('express');

const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
require('dotenv').config();
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');


const ShopRouter = require('./Routes/shop');
const AdminRouter = require('./Routes/admin');
const AuthRouter = require('./Routes/auth');


const checkAuth = require('./middleware/auth');
const checkPermission = require('./middleware/checkPermission');
const User = require('./Models/user');

let MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0-dbouh.mongodb.net/shop`

let store = new MongoDbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})


let app = express();
let csrfProtection = csrf();

let  diskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now().toString() + '-' + file.originalname);
    }
});

let fileFilter = function(req, file, cb){
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        return cb(null, true);
    }
    else {
         cb(null, false);
    }
    cb(new Error('I don\'t have a clue!'))
}

app.set('views', 'Views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname,'public')));
app.use('/images', express.static(path.join(__dirname,'images')))
app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: diskStorage, fileFilter: fileFilter}).single('image'));
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}))

let activity_log = fs.createWriteStream(path.join(__dirname, 'activity.log'), {flags: 'a'});

app.use(csrfProtection);
app.use(compression());
app.use(morgan('combined',{stream: activity_log}));


app.use((req, res, next) => {
    if(req.session.user){
        return User.findById(req.session.user._id)
                    .then(user => {
                        req.user = user;
                        next();
                    })
                    .catch(err => next(new Error(err)));
    }
    next();   
});

app.use((req, res, next) => {
    res.locals.isAuthentication = req.session.isAuth,
    res.locals.csrfToken = req.csrfToken();
    res.locals.isAuthorization = req.user ? req.user.isAdmin : false;
    res.locals.isVerified = req.user ? (req.user.address ? true: false) : false;
    next();
})

//Routes
app.use('/', ShopRouter);
app.use('/admin',checkAuth,checkPermission,AdminRouter);
app.use('/auth',AuthRouter);


//Custom error route
app.use((req, res, next) => {
    res.status(404).render('error/404', {
        pageTitle: 'Page Not Found!'
    });
})

//Default error route
app.use((error, req, res, next) => {
    res.status(500).render('error/500',{ pageTitle:'Ops!' , isAuthentication: true,error: error} );
})

mongoose.connect(MONGODB_URI +'?retryWrites=true&w=majority',{ useNewUrlParser: true, useUnifiedTopology: true })
.then(result => {
    app.listen(process.env.PORT || 3000);
})
.catch(err => {
    next(new Error(err));
})

