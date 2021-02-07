const db = require('../config/connection');
var collection = require('../config/collection')
const bcrypt = require('bcrypt');
const { USER_COLLECTION } = require('../config/collection');
var Objectid = require('mongodb').ObjectID;
const { response } = require('../app');
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_4ltfeeSv65BCSk',
    key_secret: 'XOjwYX1a9IwBbblDETL7Z9Tt',
});

module.exports = {
    Dosignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])
            })
        })
    },

    Dologin: (userData) => {
        let loginstatus = false
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('failed');
                        resolve({ status: false })

                    }
                })
            } else {
                console.log('Failed');
                resolve({ status: false })
            }
        })
    },
    addCart: (Proid, Userid) => {
        let proObj = {
            item: Objectid(Proid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: Objectid(Userid) })
            if (userCart) {
                let proExist = userCart.product.findIndex(product => product.item == Proid)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: Objectid(Userid), 'product.item': Objectid(Proid) },
                            {
                                $inc: { 'product.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: Objectid(Userid) }, {

                        $push: { product: proObj }

                    }).then(() => {
                        resolve()
                    })
                }
            } else {
                let carObj = {
                    user: Objectid(Userid),
                    product: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(carObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    cartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: Objectid(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        items: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'items',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems)
        })
    },
    getcartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: Objectid(userId) })
            if (cart) {
                count = cart.product.length
            }
            resolve(count)

        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: Objectid(details.cart), 'product.item': Objectid(details.product) },
                    {
                        $inc: { 'product.$.quantity': details.count }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },
    deleteCart: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: Objectid(details.cart) }, {
                $pull: { product: { item: Objectid(details.product) } }
            }).then(() => {
                resolve()
            })
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: Objectid(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        items: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'items',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
                    }
                }

            ]).toArray()

            resolve(total[0].total)
        })
    },
    placeOrder: (order, product, total) => {
        return new Promise((resolve, reject) => {
            let status = order.payment === 'cod' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: Objectid(order.userId),
                paymentMethod: order.payment,
                product: product,
                totalAmount: total,
                status: status,
                date: new Date()

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: Objectid(order.userId) })
                resolve(response.ops[0]._id)
            })
        })
    },
    getcartproductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: Objectid(userId) })
            resolve(cart.product)
        })
    },
    getuserorder: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let order = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: Objectid(userId) }).toArray()

            resolve(order)
        })
    },
    getorderdproducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderdItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: Objectid(orderId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        items: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'items',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            console.log(orderdItems);

            resolve(orderdItems)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);
                resolve(order)
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            console.log(details);
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'XOjwYX1a9IwBbblDETL7Z9Tt');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                console.log('error');
                reject()
            }
        })
    },
    changepaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: Objectid(orderId) },

                    {
                        $set: {
                            status: 'placed'
                        }
                    }

                ).then(() => {
                    resolve()
                })
        })
    }

}