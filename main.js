var express = require('express');
const app = express();
var router = express.Router();
var config = require('./config.json');
const validator= require('validator')
var signatureVerification = require('./helpers/signatureCreation');
var enums = require('./helpers/enums');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/newdb', { useNewUrlParser: true,
useCreateIndex: true,
useUnifiedTopology: true});
var session = require('express-session')
var _ = require("lodash")
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
var multer = require('multer')
var path = require('path')
var storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});
var receiptno=0
const nodemailer = require('nodemailer');
var singleupload = multer({ storage: storage }).single('file')
var bodyParser = require("body-parser")
var urlencodedParser = bodyParser.urlencoded({ extended: false })
router.use(session({ secret: 'keyboard cat', cookie: { maxAge: 1160000 } }))
const secret = 'abcdefg';
const pdfDocument = require('pdfkit');
const fs = require('fs');
const doc = new pdfDocument();

// const ngodb = require('./db/ngodb')
// const ngorouter = require('./router/ngorouter'); 
// router.use("/registerngo",ngorouter);



var sharp = require('sharp');

const UserSchema = new Schema({
    name: String,
    regid : {
        type: String,
        unique: true,
        required:true
    },
    regcert:{
        type: String,
        default: "/images/default.png"
    },
    cert12a:{
        type: String,
        default: "/images/default.png"
    },
    cert80g:{
        type: String,
        default: "/images/default.png"
    },
    fcra:{
        type: String,
        default: "/images/default.png"
    },
    acname:{
        type: String
    },
    acno: {
        type: Number
    },
    ifsccode:{
        type: String
    },
    bankadd:{
        type: String
    },
    authperson:{
        type: String
    },
    phno:{
        type: Number,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
        // required:true
    },
    password: {
        type: String,
        select: false,
      },
    confirmPassword: {
        type: String,
        validate: function () {
          return this.password == this.confirmPassword;
        }
      },
      description:{
        type: String
    },
    donationtillnow:{
        type:Number,
        default:0
    },
    thisMonthDonations:{
        type:Number,
        default:0
    },
    lastMonthDonations:{
        type:Number,
        default:0
    },
    recentdonors:[{
        donor:{
            type: String,
        },
        amount:{
            type:Number,
        }
    }],
    logo: {
        type: String,
        default: "/images/default.png"
    },

    images:{
        type: Array,
        default: ["/default.png"]
    },

});

const User = mongoose.model('User', UserSchema);


const filter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true)
    } else {
      cb(new Error("Not an Image! Please upload an image"), false)
    }
}

const multerStorage = multer.diskStorage({  
        destination: function (req, file, cb) {
          cb(null, "public/raw")
        },
        filename: function (req, file, cb) {
      
          cb(null, `user-${Date.now()}.jpeg`)
        }
      })

const upload = multer({
    storage: multerStorage,
    fileFilter: filter
  })
  let multiImageHandler = upload.fields([{
    name: "regcert", maxCount: 1
  }, {
    name: "cert12a", maxCount: 1    
  },
  {
    name: "cert80g", maxCount: 1
  },
  {
    name: "fcra", maxCount: 1
  },

]);

  async function uploadFile(req, res, next) {
    try {
      // 
        await sharp(req.files.regcert[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })
      // cover
      // start
      await sharp(req.files.cert12a[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })

      await sharp(req.files.cert80g[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })

      await sharp(req.files.fcra[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })

      console.log("will reach after processing every image");
      res.status(200).json({
        status: "data uploaded successfully"
      })
      next();
    } catch (err) {
      console.log(err.message);
    }
  }

  let uploadLogoHandler = upload.fields([{
          name: "logo" , maxCount: 1
        }
])


  async function uploadlogo(req, res, next) {
    try {
   await sharp(req.files.logo[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })

    console.log("will reach after processing every image");
    res.status(200).json({
      status: "data uploaded successfully"
    })
    next();
  } 
  catch (err) {
    console.log(err.message);
  }
}

let uploadImagesHandler = upload.fields([{
    name: "images" , maxCount: 20
    }])

    async function uploadimages(req, res, next) {
        try {
  let promiseArr = [];
    // start
    for (let i = 0; i < req.files.images.length; i++) {
      let filePromise = sharp(req.files.images[i].path)
        .resize(2000, 1500)
        .toFormat("jpeg")
        .jpeg({
          quality: 90
        })
      promiseArr.push(filePromise); 
    
    }
    await Promise.all(promiseArr);
    console.log("will reach after processing every image");
    res.status(200).json({
      status: "data uploaded successfully"
    })
    next();
  } 
  catch (err) {
    console.log(err.message);
  }
}


  router.get('/registerngo', (req, res) => {
  res.render('regngo')
})
  router.post('/registerngo', multiImageHandler, uploadFile,urlencodedParser, function (req, res) {
      User.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
      if(_.isEmpty(doc)) {
      let newUser = new User();
      newUser.name = req.body.name;
      newUser.regid = req.body.regid;
      newUser.regcert = req.files.regcert[0].path;
      newUser.cert12a =req.files.cert12a[0].path;
      newUser.cert80g =req.files.cert80g[0].path;
      newUser.fcra = req.files.fcra[0].path;
      newUser.acname = req.body.acname;
      newUser.acno = req.body.acno;
      newUser.ifsccode = req.body.ifsccode;
      newUser.bankadd = req.body.bankadd;
      newUser.authperson = req.body.authperson;
      newUser.phno = req.body.phno;
      newUser.email = req.body.email;
      newUser.password = req.body.password;
      newUser.confirmPassword = req.body.confirmPassword;
      newUser.description = req.body.description;
      newUser.save(function (err) {
          if (err) {
              console.log(err.message,"err");
              return
          }
           let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear NGO,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
          res.redirect('/')
      });
        }
          else {
            res.render('regngo', { message: "User already Exists" })
        }
    })
     
  })



















const GovSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    phn: Number,
    reason: String,
    project: String,
    password: {
        type: String,
        required: true
    },
    logo: String
});
const Gov = mongoose.model('Gov', GovSchema);
const WorkSchema = new Schema({
    heading: String,
    content: String,
    name: String,
    email: String,
    postedBy: ObjectId
})
const Work = mongoose.model('Work', WorkSchema);
const RecSchema = new Schema({
    name: String,
    email: String,
    receipt: String

})
const Rec = mongoose.model('Rec', RecSchema);





const MemberSchema = new Schema({
    name: {
        type: String,
        // required: true,
    },
    educQual: {
        type: Array,
    },
    phNum: {
        type: Number,
        // required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        // required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        } 
    },
    password: {
        type: String,
        // required: true
    },
    cnfrmpassword: {
        type: String,
        validate: function () {
            return this.password == this.confirmPassword;
        },
        // required:true
    },
    cityName:{
        type:String,
        // required:true
    },
    address:{
        type:String,
        // required:true,
    },
    idNumber:{
        type:String,
        // required:true,
        unique:true
    },
    interests:{
        type:Array,
        // required:true
    },
    totalDonations:{
        type:Number,
        default:0
    }
})
const Member = mongoose.model('Member', MemberSchema);
const VolunteerSchema = new Schema({
    name: {
        type: String,
        // required: true,
    },
    educQual: {
        type: Array,
    },
    phNum: {
        type: Number,
        // required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        // required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        } 
    },
    password: {
        type: String,
        // required: true
    },
    cnfrmpassword: {
        type: String,
        // required:true
    },
    cityName:{
        type:String,
        // required:true
    },
    address:{
        type:String,
        // required:true,
    },
    idNumber:{
        type:String,
        // required:true,
        unique:true
    },
    interests:{
        type:Array,
        // required:true
    },
    role:{
        type: Array
    },
    totalDonations:{
        type:Number,
        default:0
    }
})
const Volunteer = mongoose.model('Volunteer', VolunteerSchema);
const CauseSchema = new Schema({
    name:{
        type:String,
        required:true
    }
})
const Cause = mongoose.model('Cause', CauseSchema);

var CronJob = require('cron').CronJob;
var job = new CronJob('00 00 1 * *', function() {
    User.find({},(err,users)=>{
        if(err){
            return err
        }
        // console.log('check')
        users.map(user=>{
            user.lastMonthDonations= user.thisMonthDonations
            user.thisMonthDonations=0
            user.save()
        })
    })

}, null, true);
job.start();
router.get('/donateforcause/:id',(req,res)=>{
    tostoreid = req.params.id
    res.render('causemember', {
        postUrl: config.paths[config.enviornment].cashfreePayUrl,member : vol
    });
})

router.get('/gov', function (req, res) {
    res.render('reggov')
})
router.post('/gov', urlencodedParser, singleupload, function (req, res) {
    Gov.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            let newGov = new Gov();
            newGov.name = req.body.name;
            newGov.email = req.body.email;
            newGov.password = req.body.password;
            newGov.phn = req.body.phn;
            newGov.reason = req.body.reason;
            newGov.project = req.body.project;
            newGov.logo = req.file.filename;
            newGov.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                 let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear Member,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
                res.redirect('/')

            });
        }
        else {
            res.render('gov', { message: "User already Exists" })
        }
    })
})






router.get('/registermember', (req, res) => {
    res.render('regmember')
})


router.post('/registermember', urlencodedParser, singleupload, function (req, res) {
    Member.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            let newMember = new Member();
            newMember.name = req.body.name;
            newMember.educQual = req.body.vol;
            newMember.phNum = req.body.phone;
            newMember.email = req.body.email;
            newMember.password = req.body.password;
            newMember.cnfrmpassword = req.body.cnfrmpassword;
            newMember.cityName = req.body.cityname;
            newMember.address = req.body.address;
            newMember.idNumber = req.body.aadhaar;
            newMember.interests = req.body.intrest;
            
            newMember.save()
             let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear Member,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
            res.render('checkoutmem', {
                postUrl: config.paths[config.enviornment].cashfreePayUrl, user: newMember
            });
             mem = newMember
        }
        else {
            res.render('regmember', { message: "User already Exists" })
        }
    })
})
router.get('/registervolunteer', (req, res) => {
    res.render('regvolunteer')
})
router.post('/registervolunteer', urlencodedParser, singleupload , function (req, res) {
    Volunteer.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            return
        }
        if (_.isEmpty(doc)) {

            let newMember = new Volunteer();
            newMember.name = req.body.name;
            newMember.educQual = req.body.vol;
            newMember.phNum = req.body.phone;
            newMember.email = req.body.email;
            newMember.password = req.body.password;
            newMember.cityName = req.body.cityname;
            newMember.address = req.body.address;
            newMember.idNumber = req.body.aadhaar;
            newMember.interests = req.body.intrest;
            newMember.cnfrmpassword = req.body.cnfrmpassword;
            newMember.role = req.body.role;
            newMember.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                 let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear Volunteer,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
                res.redirect('/')

            });
        }
        else {
            res.render('regvolunteer', { message: "User already Exists" })
        }
    })
})
router.get('/index', (req, res, next) => {
    console.log("index get hit");
    res.render('checkout', {
        postUrl: config.paths[config.enviornment].cashfreePayUrl, user: req.session.task
    });
});
router.get('/createcause',(req,res)=>{
    res.render('createcause')
})
router.post('/createcause', urlencodedParser, singleupload, function (req, res){
    let newCause = new Cause();
    newCause.name = req.body.name
    newCause.save(function (err) {
        if (err) {
            console.log(err, 'error')
            return
        }
        res.redirect('/')

    })
})


router.get('/form', (req, res) => {
    res.render('form')
})
var ses = ""
router.post('/form', urlencodedParser, (req, res) => {
    Member.findOne({ password: req.body.password, email: req.body.email, name: req.body.name }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Volunteer.findOne({ password: req.body.password, email: req.body.email, name: req.body.name }, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                    res.render('index', { message: "Please register first" })
                }
                else {
                    req.session.task = doc
                    ses = doc
                    res.redirect('/main/index')
                }
            })
        }
        else {
            req.session.task = doc
            ses = doc
            res.redirect('/main/index')
        }
    })

})
router.get('/cause',(req,res)=>{
    Cause.find({},(err, docs) => {
        res.render('cause', { cause: docs })
    })
})
router.post('/cause', urlencodedParser, function (req, res){
    Cause.findOne({ name: req.body.name }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        res.send('localhost:3000/main/donateforcause/'+tocopyid)
    })
})
router.get('/ngo', (req, res) => {
    User.find({}, (err, docs) => {
        res.render('ngo', { ngo: docs })
    })
})
var ses1 = " ";
router.post('/ngo', urlencodedParser, function (req, res) {
    User.findOne({ regid: req.body.regid }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }

        req.session.user = doc
        ses1 = doc
        var regid = req.session.user.regid
        res.redirect('/main/form')
    })
})

var s = " ";
router.post('/result', (req, res, next) => {
    console.log("merchantHosted result hit");
    try{
        const _id=ses1._id
    }
    catch(err){
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txtime: req.body.txtime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                const _id=ses1._id
                User.findById(_id,(err,user)=>{
                    if(err){
                        return err
                    }
                    user.donationtillnow = user.donationtillnow + parseFloat(req.body.orderAmount)
                    user.thisMonthDonations=user.thisMonthDonations+parseFloat(req.body.orderAmount)
                    if(user.recentdonors.length===3){
                        user.recentdonors.pull({_id:user.recentdonors[0]._id})
                    }
                    const newDonor = {
                        donor : ses.name,
                        amount: req.body.orderAmount
                    }
                    user.recentdonors.push(newDonor)
                    user.save()
                })
                
                receiptno = receiptno + 1
                doc.pipe(fs.createWriteStream('./public/uploads/' + postData.referenceId + '.pdf'));
                doc.fontSize(20)
                doc.text("Donor Name :" + " " + ses.name)
                doc.fontSize(20)
                doc.text("Receipt No. :" + " " + postData.referenceId)
                doc.fontSize(20)
                doc.text("Email :" + " " + ses.email)
                doc.fontSize(20)
                doc.text("Ph No. :" + " " + ses.phNum)
                doc.fontSize(20)
                doc.text("Amount :" + " " + postData.orderAmount)
                doc.fontSize(20)
                doc.text("Type of Donation :" + " " + postData.paymentMode)
                doc.fontSize(20)
                doc.text("Description :" + " " + "Donation to " + ses1.name)
                doc.fontSize(20)
                doc.text("NGO phone no. :" + " " + ses1.phno)

                doc.end()
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: ses.email,
                    subject: 'Successfull Donation',
                    text: 'Dear Donor,\n\n Thank you for your Donation.\n\n Please find your receipt enclosed. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDHI',
                    attachments: [
                        {
                            filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                let newRec = new Rec();
                newRec.name = ses.name;
                newRec.email = ses.email;
                newRec.receipt = postData.referenceId + '.pdf'
                newRec.save(function (err) {
                    if (err) {
                        console.log(err, 'error')
                        return
                    }
                });



                return res.status(200).render('receipt', { data: postData, task: ses, ngo: ses1 });
                //return res.status(200).render('receipt1', { data: postData, task: ses, receiptno: receiptno });
            }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
router.post('/resultmember', (req, res, next) => {
    console.log("merchantHosted result hit");
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txtime: req.body.txtime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                receiptno = receiptno + 1
                doc.pipe(fs.createWriteStream('./public/uploads/' + postData.referenceId + '.pdf'));
                doc.fontSize(20)
                doc.text("Donor Name :" + " " + mem.name)
                doc.fontSize(20)
                doc.text("Receipt No. :" + " " + postData.referenceId)
                doc.fontSize(20)
                doc.text("Email :" + " " + mem.email)
                doc.fontSize(20)
                doc.text("Ph No. :" + " " + mem.phNum)
                doc.fontSize(20)
                doc.text("Amount :" + " " + "1500")
                doc.fontSize(20)
                doc.text("Type of Payment :" + " " + postData.paymentMode)
                doc.fontSize(20)
                doc.text("Life time membership")
                doc.end()
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: mem.email,
                    subject: 'Successfull Registration',
                    text: 'Dear Member,\n\n You are now a member of Shudhi.\n\n Please find your receipt enclosed. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDHI',
                    attachments: [
                        {
                            filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });

                return res.status(200).render('receipt1', { data: postData, task: mem });
                // return res.status(200).render('receipt', { data: postData, task: ses, receiptno: receiptno });
                
            }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
var tostoreid=''
router.post('/resultdonatevol', (req, res, next) => {
    console.log("merchantHosted result hit");
    const _id=req.session.user._id
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txtime: req.body.txtime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                User.findById(_id,(err,user)=>{
                    if(err){
                        return err
                    }
                    user.donationtillnow = user.donationtillnow + parseFloat(req.body.orderAmount)
                    user.thisMonthDonations=user.thisMonthDonations+parseFloat(req.body.orderAmount)
                    if(user.recentdonors.length===3){
                        user.recentdonors.pull({_id:user.recentdonors[0]._id})
                    }
                    const newDonor = {
                        donor : ses.name,
                        amount: req.body.orderAmount
                    }
                    user.recentdonors.push(newDonor)
                    user.save()
                })
                
                receiptno = receiptno + 1
                return res.status(200).render('receipt', { data: postData, task: ses, receiptno: receiptno });
            }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

                    doc.pipe(fs.createWriteStream('./public/uploads/'+postData.referenceId + '.pdf'));
                    doc.fontSize(20)
                    doc.text("Donor Name :" + " " + ses.name)
                    doc.fontSize(20)
                    doc.text("Receipt No. :" + " " + postData.referenceId)
                    doc.fontSize(20)
                    doc.text("Email :" + " " + ses.email)
                    doc.fontSize(20)
                    doc.text("Ph No. :" + " " + ses.phNum)
                    doc.fontSize(20)
                    doc.text("Amount :" + " " + postData.orderAmount)
                    doc.fontSize(20)
                    doc.text("Type of Donation :" + " " + postData.paymentMode)
                    doc.fontSize(20)
                    doc.text("Description :" + " " + "Donation to " + ses1.name)
                    doc.fontSize(20)
                    doc.text("NGO phone no. :" + " " + ses1.phno)

                    doc.end()
                    let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'examstet@gmail.com',
                            pass: '$t@t1234'
                        }
                    });
                    let mailOptions = {
                        from: 'examstet@gmail.com',
                        to: ses.email,
                        subject: 'Successfull Donation',
                        text: 'Dear Donor,\n\n Thank you for your Donation.\n\n Please find your receipt enclosed. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, STET-2020\n Govt. of Sikkim',
                        attachments: [
                            {
                                filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                            }
                        ]
                    };
                    transporter.sendMail(mailOptions, function (err, data) {
                        if (err) {
                            console.log('Error Occurs');
                        } else {
                            console.log('Email Sent');


                        }

                    });
                    let newRec = new Rec();
                    newRec.name = ses.name;
                    newRec.email = ses.email;
                    newRec.receipt = postData.referenceId + '.pdf'
                    newRec.save(function (err) {
                        if (err) {
                            console.log(err, 'error')
                            return
                        }
                    });
               
                
                
                return res.status(200).render('receipt', { data: postData, task: ses, ngo: ses1});

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
router.post('/resultdonatemem', (req, res, next) => {
    console.log("merchantHosted result hit");
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txtime: req.body.txtime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                console.log(tostoreid)
                try{
                Volunteer.findById(tostoreid,(err,user)=>{
                    console.log(user)
                    user.totalDonations = user.totalDonations + parseFloat( req.body.orderAmount)
                    user.save()
                })
            }
            catch{
                Member.findById(tostoreid,(err,user)=>{
                    console.log(user)
                    user.totalDonations = user.totalDonations + parseFloat( req.body.orderAmount)
                    user.save()
                })
            }
                receiptno = receiptno + 1
                doc.pipe(fs.createWriteStream('./public/uploads/' + postData.referenceId + '.pdf'));
                doc.fontSize(20)
                doc.text("Donor Name :" + " " + vol.name)
                doc.fontSize(20)
                doc.text("Receipt No. :" + " " + postData.referenceId)
                doc.fontSize(20)
                doc.text("Email :" + " " + vol.email)
                doc.fontSize(20)
                doc.text("Ph No. :" + " " + vol.phNum)
                doc.fontSize(20)
                doc.text("Amount :" + " " + postData.orderAmount)
                doc.fontSize(20)
                doc.text("Type of Donation :" + " " + postData.paymentMode)
                doc.fontSize(20)
                doc.text("Description :" + " " + "Donation to SHUDDHI")
                doc.end()
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: vol.email,
                    subject: 'Successfull Donation',
                    text: 'Dear Donor,\n\n Thank you for your Donation.\n\n Please find your receipt enclosed. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDHI',
                    attachments: [
                        {
                            filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                return res.status(200).render('receipt2', { data: postData, task: vol });
        }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
router.get('/login', (req, res) => {
    res.render('login')
})
router.get('/loginvolunteer', (req, res) => {
    res.render('login')
})
router.post('/login', urlencodedParser, (req, res) => {
    User.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Gov.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                    Member.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                        if (err) {
                            console.log(err, 'error')
                            res.redirect('/')
                            return
                        }
                        if (_.isEmpty(doc)) {
                            Volunteer.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                                if (err) {
                                    console.log(err, 'error')
                                    res.redirect('/')
                                    return
                                }
                                if (_.isEmpty(doc)) {
                                    res.render('login', { message: "Please check email/password" })
                                }
                                else {
                                    req.session.work = doc
                                    res.redirect('/main/welcome')
                                }
                            })
                        }
                        else {
                            req.session.work = doc
                            res.redirect('/main/welcome')
                        }
                    })
                }
                else {
                    req.session.work = doc
                    res.redirect('/main/welcome')
                }
            })
        }
        else {
            req.session.work = doc
            res.redirect('/main/welcome')
        }
    })

})
var tocopyid = ''
var vol = " "
router.post('/loginvolunteer', urlencodedParser, (req, res) => {
    Volunteer.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Member.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                    res.render('login', { message: "Please check email/password" })
                }
                else {
                     tocopyid= doc._id
                    vol = doc
                    res.redirect('/main/cause')
                }
            })
        }
        else {
             tocopyid= doc._id
            vol = doc
            res.redirect('/main/cause')
        }
    })

})
const checkLogIn = (req, res, next) => {
    if (req.session.work) {
        next();
    } else {
        res.redirect('/404')
    }
}

router.get('/welcome', checkLogIn, (req, res, next) => {
    Work.find({ postedBy: req.session.work._id }, (err, docs) => {
        Rec.find({ email: req.session.work.email }, (err, docs1) => {
            res.render('user', { user: req.session.work, blogs: docs, recs: docs1 })

        })

    })
})

router.post('/welcome', urlencodedParser, checkLogIn, (req, res) => {
    let newWork = new Work()
    newWork.heading = req.body.heading
    newWork.content = req.body.content
    newWork.email = req.session.work.email
    newWork.name = req.session.work.name
    newWork.postedBy = req.session.work._id
    newWork.save(function (err) {
        if (err) {
            console.log(err, 'error')
            return
        }
        res.redirect('/main/welcome')

    });

})
router.get("/imageupload", checkLogIn, (req, res) => {
    res.render("upload")
})
router.post('/imageupload', uploadLogoHandler, uploadlogo , urlencodedParser, checkLogIn, (req, res) => {
    User.update({ email: req.session.work.email }, { logo: req.files.logo[0].path }, function (err, writeOpResult) {
        if (err) {
            console.log(err.message, 'error')
            return
        }
        res.redirect('/main/welcome')
    });
})
router.get("/manyimagesupload", checkLogIn, (req, res) => {
    res.render("manyimages")
})
router.post('/manyimagesupload', uploadImagesHandler, uploadimages , urlencodedParser, checkLogIn, (req, res) => {
    // console.log(req.files);
    let arr = req.session.work.images;
    for(var i = 0 ; i < req.files.images.length ;i++)
    {
        arr.push(req.files.images[i].path);
    }
    console.log(arr);
    User.update({ email: req.session.work.email }, {images:arr}, function (err, writeOpResult) {
        if (err) {
            console.log(err.message, 'error')
            return
        }
        
        res.redirect('/main/welcome')
    });
})
router.get('/logout', (req, res) => {
    req.session.destroy
    res.redirect('/')
})
module.exports = router;
