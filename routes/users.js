var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelper = require('../helpers/product-helper')
var userHelper = require('../helpers/user-helper')
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelper.getcartCount(req.session.user._id)
  }

  productHelper.getallProduct().then((product) => {
    res.render('users/view-products', { product, user, cartCount });
  })

});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else
    res.render('users/login', { "loginErr": req.session.userLoginErr })
  req.session.userLoginErr = false
})

router.get('/signup', (req, res) => {
  res.render('users/signup')
})
router.post('/signup', (req, res) => {
  userHelper.Dosignup(req.body).then((response) => {
    req.session.user = response
    req.session.user.loggedIn = true
    res.redirect('/')
  })
})
router.post('/login', (req, res) => {
  userHelper.Dologin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.user.loggedIn = true
      res.redirect('/')
    } else {
      req.session.userLoginErr = true
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user=null
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {
  let product = await userHelper.cartProduct(req.session.user._id)
  let totalAmount=0    
  if(product.length>0){
    totalAmount = await userHelper.getTotalAmount(req.session.user._id)
  }
   

  res.render('users/cart', { product, user: req.session.user, totalAmount })
})
router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log('Api call');
  userHelper.addCart(req.params.id, req.session.user._id).then(() => {
    res.redirect('/')
  })
})
router.post('/change-product-quantity', (req, res, next) => {

  userHelper.changeProductQuantity(req.body).then(() => {

  })
})
router.post('/delete-cart', (req, res, next) => {
  console.log(req.body);

  userHelper.deleteCart(req.body).then(() => {

  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let amount = await userHelper.getTotalAmount(req.session.user._id)

  res.render('users/place-order', { amount, user: req.session.user })
})
router.post('/place-order', async (req, res) => {
  let product = await userHelper.getcartproductList(req.body.userId)
  let totalAmount = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, product, totalAmount).then((orderId) => {
    if (req.body['payment'] === 'cod') {
      res.json({ codsuccess: true })

    } else {
      userHelper.generateRazorpay(orderId, totalAmount).then((response) => {
        res.json(response)

      })

    }

  })

})
router.get('/order-success', (req, res) => {

  res.render('users/order-success')
})
router.get('/order-products', verifyLogin, async (req, res) => {
  let order = await userHelper.getuserorder(req.session.user._id)
  res.render('users/view-order', { user: req.session.user, order })
})

router.get('/view-orderd-product/:id', async (req, res) => {
  console.log(req.params.id);
  let products = await userHelper.getorderdproducts(req.params.id)
  res.render('users/view-orderd-products', { user: req.session.user, products })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changepaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status:false })
  })
})
module.exports = router;
