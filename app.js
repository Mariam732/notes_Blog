const express = require('express');
const app = express();
app.listen(process.env.PORT||3000,()=>{
    console.log("server is running now");
});

//express_session
var session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store
    
  }))
//connect flash
var flash = require ('connect-flash');
app.use(flash());


//hash password
const bcrypt = require('bcrypt');


// node js knows static files
const path = require('path');
app.use (express.static(path.join(__dirname,"public")));

//to convert buffer into json (string)
app.use(express.urlencoded({extended:false}));

//validation
const { check, validationResult } = require('express-validator');

//connect mongodb session
var MongoDBStore = require('connect-mongodb-session')(session);
var store = new MongoDBStore({
    uri: 'mongodb+srv://admin:admin@cluster0.xypgzky.mongodb.net/project1',
    collection: 'mySessions'
  });

  // auth require in middleware
  const authen = require('../p1 nodejs/middleware/auth');



//register page
app.get('/',(req,res)=>{
    //res.send("hellooooo");
    //console.log(req.flash('oldInputs')[0]);
    //console.log(req.flash('exists'));
    res.render('register.ejs' ,{error:req.flash('error'),
     oldInputs:req.flash('oldInputs')[0] , exists:req.flash('exists'), isLoggedIn:false});

})


app.post ("/handleSignUp",[
check ('name').matches(/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/) ,
check ('email').isEmail(),
check ('password').matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/) , 
// password confirmation
check ('confirmPassword').custom((value,{req})=>{
 if(value !== req.body.password){
    console.log("Password confirmation does not match password");
    return false;  }  
    return true ;   
 })
], async(req,res)=>{
    console.log(req.body);
    //validation
    const error = validationResult(req)
    //console.log(error);
    const{name , email , password , confirmPassword}=req.body;

   // console.log(error.array());
   // console.log(error.isEmpty());
    if (error.isEmpty()){
        //Did the user register with the e-mail before, or not?
        let user = await userModel.findOne({email});
       if(user!=null){
        req.flash('exists',true);
        res.redirect("/")
        //console.log("email is alerady exists");
       }else {
        //to hash password
        bcrypt.hash(password,7,async function(err,hash){
   //insert into db
   await userModel.insertMany({name , email , password:hash , confirmPassword});
 
   res.redirect("/login");
  // console.log("new email");
        });
       }
    } else {
        req.flash('error', error.array());
        req.flash('oldInputs' , {name , email , password , confirmPassword});
        res.redirect("/");
     
    }
})




//login page
app.get('/login',(req,res)=>{
    // if(req.session.isLoggedIn==true){
    //     res.redirect('/home');
    // } else {
    res.render('login.ejs', {emailExist:req.flash('emailExist'), 
    incorrectPassword:req.flash('incorrectPassword') , oldValues:req.flash('oldValues')[0], isLoggedIn:false});
    // }
})
app.post("/handleSignin",async (req,res)=>{
    const{email, password}=req.body;
    let userLogin = await userModel.findOne({email});
    req.flash('oldValues', {email,password});
    if(userLogin != null){
        const match = await bcrypt.compare(password, userLogin.password);
        if(match){ //correct password then go to home page
            //authenication
            req.session.isLoggedIn = true;
            //to hold id from user
            req.session.userID = userLogin._id;
            res.redirect('/home')
        } else {
            
            req.flash('incorrectPassword',true);
            console.log('wrong password');
            res.redirect('/login')
        }}
        else {
            
            console.log('Email doesnt exist');
            req.flash('emailExist', true);
            res.redirect('/login');

        }
})

//home page
app.get('/home',authen, async(req,res)=>{
   
    let notes = await noteModel.find({userID:req.session.userID});
    res.render('home.ejs',{isLoggedIn:req.session.isLoggedIn , notes});
   // res.json(notes);


    
})

//logout
app.get('/logout', (req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/login');
    })
})

//addNotes
app.post('/addNote',async (req,res)=>{
    res.redirect('/home')
    console.log(req.body);
    const{title , desc}=req.body;
   await noteModel.insertMany({userID:req.session.userID,title,desc})
})

//delete notes
app.post('/delete',async (req,res)=>{
    console.log(req.body);
    await noteModel.findByIdAndDelete({_id:req.body.delete});
    res.redirect('/home');
})

//edit notes
app.post('/editNote',async (req,res)=>{
    console.log(req.body);
    const{_id,title,desc} = req.body;
 await noteModel.findByIdAndUpdate({_id},{title,desc});
 res.redirect('/home');
})


// const { assert } = require('console');
const mongoose = require('mongoose');
const { auth } = require('./middleware/auth');
mongoose.set('strictQuery', false);
mongoose.connect('mongodb+srv://admin:admin@cluster0.xypgzky.mongodb.net/project1',{
    useNewUrlParser:true , useUnifiedTopology:true }, (e)=>{
    if (e) console.log(e);
    else   console.log("sucessfully connected");
    }
);

//create first collection (users)
const userSchema = mongoose.Schema({
    name : String , email : String , password : String
})
const userModel = mongoose.model('user',userSchema);

////create second collection (notes)
const noteSchema= mongoose.Schema({
title : String , desc : String ,
userID :  mongoose.Schema.Types.ObjectId 
})
const noteModel = mongoose.model('note', noteSchema)


