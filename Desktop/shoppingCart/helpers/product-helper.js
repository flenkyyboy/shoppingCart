const db = require('../config/connection');
var collection = require('../config/collection')
var Objectid = require('mongodb').ObjectID

module.exports = {


    addProduct: (product, callback) => {
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.ops[0]._id)
        })
    },
    getallProduct: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },
    deleteProduct: (Proid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: Objectid(Proid) }).then(() => {
                resolve()
            })
        })
    },
    getProductDetails: (prodid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:Objectid(prodid)}).then((product)=>{
                resolve(product)
            })
        })
    },
    editProduct:(prodid,productdetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:Objectid(prodid)},{
                $set:{
                    name:productdetails.name,
                    category:productdetails.category,
                    price:productdetails.price,
                    description:productdetails.description
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    adminLogin: (userData) => {
        console.log(userData);

        let loginstatus = false
        let response = {}
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email })
            if (admin) {
                db.get().collection(collection.ADMIN_COLLECTION).findOne({ password: userData.password }).then((status) => {
                    if (status) {
                        console.log('success');
                        response.admin = admin
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
    }

}