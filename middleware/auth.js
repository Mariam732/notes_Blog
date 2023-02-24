module.exports = (req,res ,next)=>{
if(req.session.isLoggedIn==true){
    next();
} else {
    res.redirect('/login');
}
}