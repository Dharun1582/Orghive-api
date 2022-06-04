// import cryptoRandomString from 'crypto-random-string';

var express = require('express');
var router = express.Router();
const db=require('../data/database');
const bcrypt=require('bcryptjs');
const Crypto = require('crypto')

function randomString(size = 6) {  
  return Crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}



router.post('/SignUpCustomer',async function(req, res) {
  const data=req.body;
  var query=`select USERNAME from customerdata where USERNAME=?`;
  var chk=await db.query(query,data.userName);

  if(chk[0].length>0){
    return res.status(409).send({
      message:'Username already exists',
      flag:'danger'
    });
  }

  query=`select PHONE from customerdata where PHONE=?`;
  var chk=await db.query(query,data.phone);
  
  if(chk[0].length>0){
    return res.status(409).send({
      message:'Phone number already exists',
      flag:'danger'
    });
  }

  query=`select EMAIL from customerdata where EMAIL=?`;
  chk=await db.query(query,data.email);

  if(chk[0].length>0){
    return res.status(409).send({
      message:'Email already exists',
      flag:'danger'
    });
  }

  data.dob=data.dob.slice(0,10);
  console.log(data.dob);
  const hash=await bcrypt.hash(data.password,10);
  query=`INSERT INTO customerdata VALUES(?)`;
  await db.query(query,[[data.userName,data.firstName,data.lastName,data.address,data.phone,data.email,data.dob,data.aadhar,hash]])
  return res.status(200).send({
    message:'Signed Up successfully',
    flag:'success'
  });
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
    });
  }

  console.log(val[0][0]);

  const ispassvalid=await bcrypt.compare(data.password,val[0][0].PASSWORD);
  if(ispassvalid){
    return res.status(200).send({
      message:'Login Successful',
      flag:'success'
    });
  }
  else{
    return res.status(401).send({
      message:'Invalid Password',
      flag:'danger'
    });
  }
  
});

router.post('/SignUpOrganizer',async function(req, res){
  const data = req.body;
  console.log(data);
  query = `select CONTACT1 from organizerdata where CONTACT1=?`;
  var chk = await db.query(query,data.contact1);
  
  if(chk[0].length>0){
    return res.status(409).send({
      message:'Phone number already exists',
      flag:'danger'
    });
  }

  query = `select EMAIL from organizerdata where EMAIL=?`;
  chk = await db.query(query,data.email);

  if(chk[0].length>0){
    return res.status(409).send({
      message:'Email already exists',
      flag:'danger'
    });
  }
  
  const hash=await bcrypt.hash(data.password,10);
  query=`INSERT INTO organizerdata VALUES(?)`;
  await db.query(query,[[data.orgId,data.name,data.manager,data.contact1,data.contact2,data.email,data.address,data.gstin,hash,0.0]]);
  for (let key in data.eventsdata){
    if (data.eventsdata[key]){
      query=`INSERT INTO organizerevents VALUES(?)`;
      await db.query(query,[[data.orgId,key]]);
    }
  }
  
  return res.status(200).send({
    message:'Signed Up successfully. Your Org. ID is : '+data.orgId,
    flag:'success'
  });
});

router.post('/loginOrganizer',async function(req, res) {
  const data=req.body;
  var query=`SELECT PASSWORD FROM organizerdata where ORGID=?`;
  const val=await db.query(query,data.orgId);
  console.log(val);
  if(val[0].length==0){
    return res.status(401).send({
      message:'Organiser ID does not exist',
      flag:'danger'
    });
  }

  const ispassvalid=await bcrypt.compare(data.password,val[0][0].PASSWORD);
  if(ispassvalid){
    return res.status(200).send({
      message:'Login Successful',
      flag:'success'
    });
  }
  else{
    return res.status(401).send({
      message:'Invalid Password! Try Again',
      flag:'danger'
    });
  }
  
});


router.post('/createEventCustomer',async function(req,res){
  const data=req.body;
  console.log(data);



  data.fromdate=data.fromdate.slice(0,10);
  if(data.todate!=null){
    data.todate=data.todate.slice(0,10);
  }
  data.budget-parseInt(data.budget);
  var query=`INSERT INTO event VALUES(?)`;
  while (true){
    var query2=`SELECT EVENTID FROM event WHERE EVENTID='${data.eventID}'`;
    var x=await db.query(query2);
    // console.log(x);
    if(x[0].length==0){
      break;
    }else{
        data.eventID='E'+randomString();
    }
  }
  await db.query(query,[[data.eventID,data.username,data.eventname,data.fromdate,data.todate,data.preferredlocation,data.budget,data.food,data.description]])
  // // res.status(200)

  var arr=data.orgdata;

  var newarr=arr.map((item,i)=>{
    return {...item,eventID:data.eventID};
  })

  var query3=`INSERT INTO orgreq VALUES(?)`;

  newarr.map(async (item,i)=>{
    await db.query(query3,[[data.username,item.orgid,item.eventID]]);
  })

  res.status(200).send({
    message:'Event requested successfully',
    flag:'success'
  })
})


router.post('/getOrganizerDataCreateEventCustomer',async function(req,res){
  const data=req.body;
  const eventname=data.eventname;

  var query=`SELECT * FROM orghive.organizerdata where ORGID in (SELECT ORGID FROM orghive.organizerevents WHERE EVNT = '${eventname}')`;
  const response=await db.query(query);
  console.log(response);
  res.status(200).send(response[0])


})

module.exports = router;
