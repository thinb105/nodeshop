module.exports = (req, res, next) => {
    if(!req.user.isAdmin){
        return res.status(403).render('error/403',{
            pageTitle: 'Permission Denied!'
        })
    }
    next();
}