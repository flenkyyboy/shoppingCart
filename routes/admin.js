var express = require('express');
const { render, route } = require('../app')
var router = express.Router();
var productHelper = require('../helpers/product-helper')
const verifyLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}
/* GET users listing. */
router.get('/',verifyLogin, function (req, res) {
  let user = req.session.admin

  productHelper.getallProduct().then((product) => {
    res.render('admin/view-products', { admin: true, product,user });
  })
});
router.get('/add-product',verifyLogin, (req, res) => {
  res.render('admin/add-product')
})
router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.img);
  productHelper.addProduct(req.body, (id) => {
    let image = req.files.img

    image.mv('./public/product-image/' + id + '.jpeg', (err, done) => {
      if (!err) {
        res.render('admin/add-product')
      }
    })

  })
})
router.get('/delete-product/:id', (req, res) => {
  let Proid = req.params.id
  productHelper.deleteProduct(Proid).then((response) => {
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id', async(req, res) => {
  let product = await productHelper.getProductDetails(req.params.id)
  console.log(product);
res.render('admin/edit-product',{product})


})
router.post("/edit-product/:id",(req,res)=>{
  let id=req.params.id
productHelper.editProduct(req.params.id,req.body).then(()=>{
  res.redirect('/admin')
  if(req.files.img){
    let image = req.files.img
    image.mv('./public/product-image/'+id+'.jpeg')
  }
})

})
router.get('/login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/admin/')
  } else
    res.render('admin/login', { "loginErr": req.session.userLoginErr })
  req.session.userLoginErr = false
})
router.post('/login', (req, res) => {
  productHelper.adminLogin(req.body) 
  .then((response) => {
    if (response.status) {
      req.session.admin = response.admin
      req.session.admin.loggedIn = true
      res.redirect('/admin/')
    } else {
      req.session.userLoginErr = true
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.admin=null
  res.redirect('/admin/')
})


module.exports = router;
