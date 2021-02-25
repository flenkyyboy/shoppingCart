const express = require('express');
const hbs = require('express-handlebars')
const multer = require('multer')
const path = require('path')
const app = express();
app.use(express.static('public'))

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'public/')
    },
    filename:(req,file,cb)=>{
        const {originalname} = file;
        cb(null,originalname)
    }
})
const upload = multer({storage})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/' }))

app.get('/',(req,res)=>{
    res.render('index')
})
app.post('/',upload.single('avatar'),(req,res)=>{
    console.log(req.file);
    return res.json({status:'Ok'})
})
app.listen(9000)