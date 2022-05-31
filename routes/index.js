var express = require('express');
var router = express.Router();
const db=require('../data/database');
const bcrypt=require('bcryptjs');

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

router.post('/SignUpCustomer',async function(req, res) {
  // console.log("jsnv");
  const data=req.body;
  // console.log(data);
  var query=`select USERNAME from customerdata where USERNAME=?`;
  var chk=await db.query(query,data.userName);

  if(chk[0].length>0){
    console.log("hiii");
    return res.status(409).send({
      message:'Username already exists',
      flag:'danger'
    })
  }

  query=`select PHONE from customerdata where PHONE=?`;
  var chk=await db.query(query,data.phone);
  
  if(chk[0].length>0){

    return res.status(409).send({
      message:'Phone number already exists',
      flag:'danger'
    })
  }


  query=`select EMAIL from customerdata where EMAIL=?`;
  chk=await db.query(query,data.email);

  if(chk[0].length>0){
    return res.status(409).send({
      message:'Email already exists',
      flag:'danger'
    })
  }

  data.dob=data.dob.slice(0,10);
  const hash=await bcrypt.hash(data.password,10);
  query=`INSERT INTO customerdata VALUES(?)`;
  await db.query(query,[[data.userName,data.firstName,data.lastName,data.address,data.phone,data.email,data.dob,data.aadhar,hash]])
  return res.status(200).send({
    message:'Signed Up successfully',
    flag:'success'
  })
  // console.log(data.dob);
  // console.log(cust[0]);
  // console.log(req.body);

  
});

router.post('/loginCustomer',async function(req, res) {
  console.log(req.body);
  const data=req.body;
  var query=`SELECT PASSWORD FROM customerdata where USERNAME=?`;
  const val=await db.query(query,data.userName);
  if(val[0].length==0){
    return res.status(401).send({
      message:'Username does not exist',
      flag:'danger'
    })
  }

  console.log(val[0][0]);

  const ispassvalid=await bcrypt.compare(data.password,val[0][0].PASSWORD);
  if(ispassvalid){
    return res.status(200).send({
      message:'Login Successful',
      flag:'success'
    })
  }else{
    return res.status(401).send({
      message:'Invalid Password',
      flag:'danger'
    })
  }
  
});

router.post('/SignUpOrganizer',async function(req, res){
  const data = req.body;

  query = `select CONTACT1 from organizerdata where CONTACT1=?`;
  var chk = await db.query(query,data.phone);
  
  if(chk[0].length>0){

    return res.status(409).send({
      message:'Phone number already exists',
      flag:'danger'
    })
  }

  query = `select EMAIL from organizerdata where EMAIL=?`;
  chk = await db.query(query,data.email);

  if(chk[0].length>0){
    return res.status(409).send({
      message:'Email already exists',
      flag:'danger'
    })
  }
  
  const hash=await bcrypt.hash(data.password,10);
  query=`INSERT INTO organizerdata VALUES(?)`;
  await db.query(query,[[data.orgId,data.name,data.manager,data.contact1,data.contact2,data.email,data.address,data.gstin,hash,data.rating]])
  return res.status(200).send({
    message:'Signed Up successfully. Your Org. ID is : '+data.orgId,
    flag:'success'
  })
});

module.exports = router;
