// import cryptoRandomString from 'crypto-random-string';

var express = require('express');
var router = express.Router();
const db = require('../data/database');
const bcrypt = require('bcryptjs');
// const multer = require('multer');
var path = require('path');
const Crypto = require('crypto');
const nodemailer = require('nodemailer');
const dotenv=require('dotenv');
dotenv.config();
const transport=nodemailer.createTransport({
  service:"gmail",
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth:{
      user:process.env.USER,
      pass:process.env.PASS
  }
});

function randomString(size = 6) {
  return Crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}

router.post('/SignUpCustomer', async function (req, res) {
  const data = req.body;
  var query = `select USERNAME from customerdata where USERNAME=?`;
  var chk = await db.query(query, data.userName);

  if (chk[0].length > 0) {
    return res.status(409).send({
      message: 'Username already exists',
      flag: 'danger'
    });
  }

  query = `select PHONE from customerdata where PHONE=?`;
  var chk = await db.query(query, data.phone);

  if (chk[0].length > 0) {
    return res.status(409).send({
      message: 'Phone number already exists',
      flag: 'danger'
    });
  }

  query = `select EMAIL from customerdata where EMAIL=?`;
  chk = await db.query(query, data.email);

  if (chk[0].length > 0) {
    return res.status(409).send({
      message: 'Email already exists',
      flag: 'danger'
    });
  }

  data.dob = data.dob.slice(0, 10);
  console.log(data.dob);
  const hash = await bcrypt.hash(data.password, 10);
  query = `INSERT INTO customerdata VALUES(?)`;
  await db.query(query, [[data.userName, data.firstName, data.lastName, data.address, data.phone, data.email, data.dob, data.aadhar, hash, 0]])
  return res.status(200).send({
    message: 'Signed Up successfully',
    flag: 'success'
  });
});

router.post('/loginCustomer', async function (req, res) {
  // console.log(req.body);
  const data = req.body;
  var query = `SELECT PASSWORD FROM customerdata where USERNAME=?`;
  const val = await db.query(query, data.userName);
  if (val[0].length == 0) {
    return res.status(401).send({
      message: 'Username does not exist',
      flag: 'danger'
    });
  }

  console.log(val[0][0]);

  const ispassvalid = await bcrypt.compare(data.password, val[0][0].PASSWORD);
  if (ispassvalid) {
    return res.status(200).send({
      message: 'Login Successful',
      flag: 'success'
    });
  }
  else {
    return res.status(401).send({
      message: 'Invalid Password',
      flag: 'danger'
    });
  }

});

router.post('/sendMailCust',async function (req,res){
  const data = req.body;
  var query = `SELECT USERNAME FROM customerdata where EMAIL=?`;
  const val = await db.query(query, data.email);
  if (val[0].length == 0) {
    return res.status(401).send({
      message: 'Email does not exist',
      flag: 'danger'
    });
  }
  else {
    var mailOptions = {
      from: 'orghiveinc@gmail.com',
      to: data.email,
      subject: 'OTP for Password Reset',
      html: `<h3>Greetings from OrgHive Inc.!</h3><h2>For the Customer ID : ${val[0][0].USERNAME}</h2><br/><b>The OTP for Password Reset is :</b><h1>${data.code}</h1>Do not share with others.Ignore the OTP, if you remember your Password.<br/><h3>Thank You!</h3>`
    };

    transport.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
        return res.status(401).send({
          message: 'Error sending mail!',
          flag: 'danger'
        });
      } else {
        return res.status(200).send({
          message: 'Email sent successfully! If not found in Inbox, check Spam',
          flag: 'success'
        });
      }
    });
  }
});

router.post('/updatePwCust', async function (req, res) {
  const data = req.body;
  const hash = await bcrypt.hash(data.password, 10);
  var query = "UPDATE customerdata SET PASSWORD=? WHERE EMAIL=?";
  var result = await db.query(query, [hash, data.email]);
  console.log(result);
  if (result[0].affectedRows == 1) {
    res.status(200).send({
      message: 'Password Updated successfully!',
      flag: 'success'
    });
  }
  else {
    res.status(401).send({
      message: 'Error updating password! Try Again',
      flag: 'danger'
    });
  }
});

router.post('/SignUpOrganizer', async function (req, res) {
  const data = req.body;
  console.log(data);
  query = `select CONTACT1 from organizerdata where CONTACT1=?`;
  var chk = await db.query(query, data.contact1);

  if (chk[0].length > 0) {
    return res.status(409).send({
      message: 'Phone number already exists',
      flag: 'danger'
    });
  }

  query = `select EMAIL from organizerdata where EMAIL=?`;
  chk = await db.query(query, data.email);

  if (chk[0].length > 0) {
    return res.status(409).send({
      message: 'Email already exists',
      flag: 'danger'
    });
  }
  
  const hash=await bcrypt.hash(data.password,10);
  query=`INSERT INTO organizerdata VALUES(?)`;
  await db.query(query,[[data.orgId,data.name,data.manager,data.contact1,data.contact2,data.email,data.address,data.gstin,hash,null,0]]);
  for (let key in data.eventsdata){
    if (data.eventsdata[key]){
      query=`INSERT INTO organizerevents VALUES(?)`;
      await db.query(query,[[data.orgId,key]]);
    }
  }

  return res.status(200).send({
    message: 'Signed Up successfully. Your Org. ID is : ' + data.orgId,
    flag: 'success'
  });
});

router.post('/loginOrganizer', async function (req, res) {
  const data = req.body;
  var query = `SELECT PASSWORD FROM organizerdata where ORGID=?`;
  const val = await db.query(query, data.orgId);
  if (val[0].length == 0) {
    return res.status(401).send({
      message: 'Organiser ID does not exist',
      flag: 'danger'
    });
  }

  const ispassvalid = await bcrypt.compare(data.password, val[0][0].PASSWORD);
  if (ispassvalid) {
    return res.status(200).send({
      message: 'Login Successful',
      flag: 'success'
    });
  }
  else {
    return res.status(401).send({
      message: 'Invalid Password! Try Again',
      flag: 'danger'
    });
  }
});

router.post('/createEventCustomer', async function (req, res) {
  const data = req.body;
  console.log(data);

  data.fromdate = data.fromdate.slice(0, 10);
  if (data.todate != null) {
    data.todate = data.todate.slice(0, 10);
  }
  data.budget = parseInt(data.budget);
  var query = `INSERT INTO event VALUES(?)`;
  while (true) {
    var query2 = `SELECT EVENTID FROM event WHERE EVENTID='${data.eventID}'`;
    var x = await db.query(query2);
    // console.log(x);
    if (x[0].length == 0) {
      break;
    } else {
      data.eventID = 'E' + randomString();
    }
  }
  await db.query(query, [[data.eventID, data.username, data.eventname, data.fromdate, data.todate, data.preferredlocation, data.budget, data.food, data.description]])
  // // res.status(200)

  var arr = data.orgdata;

  var newarr = arr.map((item, i) => {
    return { ...item, eventID: data.eventID };
  })

  var query3 = `INSERT INTO orgreq VALUES(?)`;

  newarr.map(async (item, i) => {
    await db.query(query3, [[data.username, item.orgid, item.eventID]]);
  })

  res.status(200).send({
    message: 'Event requested successfully',
    flag: 'success'
  })
});

router.post('/sendMailOrg',async function (req,res){
  const data = req.body;
  var query = `SELECT ORGID FROM organizerdata where EMAIL=?`;
  const val = await db.query(query, data.email);
  if (val[0].length == 0) {
    return res.status(401).send({
      message: 'Email does not exist',
      flag: 'danger'
    });
  }
  else {
    var mailOptions = {
      from: 'orghiveinc@gmail.com',
      to: data.email,
      subject: 'OTP for Password Reset',
      html: `<h3>Greetings from OrgHive Inc.!</h3><h2>For the Organizer ID : ${val[0][0].ORGID} </h2><br/><b>The OTP for Password Reset is :</b><h1>${data.code}</h1>Do not share with others.Ignore the OTP, if you remember your Password.<br/><h3>Thank You!</h3>`
    };

    transport.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log(err);
        return res.status(401).send({
          message: 'Error sending mail!',
          flag: 'danger'
        });
      } else {
        return res.status(200).send({
          message: 'Email sent successfully! If not found in Inbox, check Spam',
          flag: 'success'
        });
      }
    });
  }
});

router.post('/updatePwOrg', async function (req, res) {
  const data = req.body;
  const hash = await bcrypt.hash(data.password, 10);
  var query = "UPDATE organizerdata SET PASSWORD=? WHERE EMAIL=?";
  var result = await db.query(query, [hash, data.email]);
  console.log(result);
  if (result[0].affectedRows == 1) {
    res.status(200).send({
      message: 'Password Updated successfully!',
      flag: 'success'
    });
  }
  else {
    res.status(401).send({
      message: 'Error updating password! Try Again',
      flag: 'danger'
    });
  }
});

// router.post('/getOrganizerDataCreateEventCustomer', async function (req, res) {
//   const data = req.body;
//   const eventname = data.eventname;

router.post('/getOrganizerDataCreateEventCustomer',async function(req,res){
  const data=req.body;
  const eventname=data.eventname;

  var query=`SELECT * FROM orghive.organizerdata where ORGID in (SELECT ORGID FROM orghive.organizerevents WHERE EVNT = '${eventname}')`;
  const response=await db.query(query);
  // console.log(response);
  res.status(200).send(response[0]);

})

router.post('/getCustomerProfile',async function(req,res){
  const username=req.body.username;
  // console.log(username);
  var query=`SELECT * FROM customerdata where USERNAME='${username}'`;
  const resp=await db.query(query);
  // console.log(resp);
  res.status(200).send(resp[0][0])
})

router.post('/getOrganizerProfile',async function(req,res){
  const orgid=req.body.orgid;
  // console.log(username);
  var query=`SELECT * FROM organizerdata where orgid='${orgid}'`;
  const resp=await db.query(query);
  console.log(resp[0]);
  // var query = `SELECT * FROM orghive.organizerdata where ORGID in (SELECT ORGID FROM orghive.organizerevents WHERE EVNT = '${eventname}')`;
  // const response = await db.query(query);
  // console.log(response);
  res.status(200).send(resp[0][0]);
});

router.post('/getCustomerProfile', async function (req, res) {
  const username = req.body.username;
  var query = `SELECT * FROM customerdata where USERNAME='${username}'`;
  const resp = await db.query(query);
  res.status(200).send(resp[0][0])
})



router.post('/addWallet',async function(req,res){
  const amt=req.body.amt;
  const username=req.body.username;
  // console.log(amt);
  var query=`UPDATE customerdata SET WALLET=WALLET+${amt} where USERNAME='${username}'`;
  await db.query(query);
  res.status(200).send({
    message:'Amount added successfully',
    flag:'success'
  })
})

// module.exports = router;
router.post('/getEventDetails', async function (req, res) {
  console.log('hscbhdscuvc');
  const data = req.body;
  const orgid = data.ORGID;
  var query = `SELECT * FROM orgreq o,event e, customerdata c WHERE o.EVENTID=e.EVENTID AND e.USERNAME=c.USERNAME AND ORGID=(?)`;
  var x = await db.query(query, [[orgid]]);
  if (x[0].length > 0) {
    res.status(200).send(x[0]);
  }
  else {
    res.status(401).send('error');
  }
})

router.post('/progressCustomer',async function(req,res){
  const eventid=req.body.eventid;

  var query=`SELECT * FROM msg WHERE EVENTID='${eventid}' ORDER BY CREATEDAT DESC`;
  const result= await db.query(query);
  // console.log(result[0]);
  res.status(200).send(result[0]);
})

router.post('/addProgressOrganizer',async function(req,res){

  const eventid=req.body.eventid;
  const addprogress=req.body.addprogress;

  var query= `SELECT ORGID,USERNAME FROM eventstat WHERE EVENTID='${eventid}'`;
  const result1=await db.query(query);
  const orgid=result1[0][0].ORGID;
  const username=result1[0][0].USERNAME;
  console.log(orgid);
  console.log(username);
  query =`INSERT INTO msg (ORGID,USERNAME,EVENTID,MSG) VALUES ('${orgid}','${username}','${eventid}','${addprogress}')`
  await db.query(query);
  res.status(200).send({
    message:'Progress Added Successfully',
    flag:'success'
  })
})

router.post('/eventsInProgressCustomer',async function(req,res){
  const username=req.body.username;
  var query=`SELECT eventstat.EVENTID,EVENTNAME,NAME,event.DESCRIPTION,FROMDATE,TODATE  FROM eventstat,event,organizerdata WHERE eventstat.EVENTID=event.EVENTID AND eventstat.ORGID=organizerdata.ORGID AND eventstat.STATUS='PENDING' AND eventstat.USERNAME='${username}'`;

  const result1=await db.query(query);
  res.status(200).send({
    data:result1[0]
  })
})

router.post('/eventsCompleteCustomer',async function(req,res){
  const username=req.body.username;
  var query=`SELECT eventstat.EVENTID,EVENTNAME,NAME,event.DESCRIPTION FROM eventstat,event,organizerdata WHERE eventstat.EVENTID=event.EVENTID AND eventstat.ORGID=organizerdata.ORGID AND eventstat.STATUS='COMPLETE' AND eventstat.USERNAME='${username}'`;
  
  const result1=await db.query(query);
  res.status(200).send({
    data:result1[0]
  })
})

router.post('/eventsInProgressOrganizer',async function(req,res){
  const orgid=req.body.orgid;
  var query=`SELECT eventstat.EVENTID,EVENTNAME,NAME,event.DESCRIPTION,FROMDATE,TODATE  FROM eventstat,event,organizerdata WHERE eventstat.EVENTID=event.EVENTID AND eventstat.ORGID=organizerdata.ORGID AND eventstat.STATUS='PENDING' AND eventstat.ORGID='${orgid}'`;

  const result1=await db.query(query);
  console.log(result1);
  res.status(200).send({
    data:result1[0]
  })
})


router.post('/eventsCompleteOrganizer',async function(req,res){
  const orgid=req.body.orgid;
  var query=`SELECT eventstat.EVENTID,EVENTNAME,NAME,event.DESCRIPTION FROM eventstat,event,organizerdata WHERE eventstat.EVENTID=event.EVENTID AND eventstat.ORGID=organizerdata.ORGID AND eventstat.STATUS='COMPLETE' AND eventstat.ORGID='${orgid}'`;
  
  const result1=await db.query(query);
  res.status(200).send({
    data:result1[0]
  })
})





router.post('/deleteReqOrg', async function (req, res) {
  const EVNT = req.body.EVENTID;
  const ORG = req.body.ORGID;
  var query = `SELECT * FROM orgreq WHERE ORGID='${ORG}'`
  const response = await db.query(query);
  var query2 = `DELETE FROM orgreq WHERE ORGID='${ORG}' AND EVENTID='${EVNT}'`;
  const resp = await db.query(query2);
  res.status(200).send(response[0]);
});

router.post('/eventDetail', async function (req, res) {
  const data = req.body;
  const eventid = data.EVENTID;
  var query = `SELECT * FROM event e, customerdata c WHERE EVENTID='${eventid}' AND e.USERNAME=c.USERNAME`;
  var x = await db.query(query);
  if (x[0].length > 0) {
    res.status(200).send(x[0]);
  }
  else {
    res.status(401).send();
  }
});

router.post('/acceptReqOrg', async(req,res)=>{
  try{
  const data = req.body;
  console.log(data);
  const eventid = data.EVENTID;
  const orgid = data.ORGID; 
  const newBudget = data.BUDGET;
  const description = data.DESCRIPTION;
  const username = data.USERNAME;
  var query = `INSERT INTO custreq VALUES('${username}','${orgid}','${eventid}',${newBudget},'${description}')`;
  var x = await db.query(query);
  var query2 = `DELETE FROM orgreq WHERE ORGID='${orgid}' AND EVENTID='${eventid}'`;
  var y = await db.query(query2);
  console.log(res);
  res.status(200).send();
  }
  catch(err){
    res.status(401).send();
  }
});

router.post('/eventReqDetail', async function (req, res) {
  const data = req.body;
  const username = data.USERNAME;
  var query = `SELECT * FROM custreq c, event e WHERE e.EVENTID=c.EVENTID AND c.USERNAME='${username}'`;
  var x = await db.query(query);
  if (x[0].length > 0) {
    res.status(200).send(x[0]);
  }
  else {
    // res.status(401).send();
  }
});

router.post('/deleteReqCust', async function (req, res) {
  const EVNT = req.body.EVENTID;
  const ORG = req.body.ORGID;
  var query2 = `DELETE FROM custreq WHERE ORGID='${ORG}' AND EVENTID='${EVNT}'`;
  const resp = await db.query(query2);
  res.status(200).send();
});

router.post('/acceptReqCust', async(req,res)=>{
  try{
    const username=req.body.USERNAME;
    const eventid=req.body.EVENTID;
    const orgid=req.body.ORGID;
    console.log(req.body);
  // res.status(200).send();
    var query=`DELETE FROM orgreq WHERE EVENTID='${eventid}'`;
    await db.query(query);

    query= `SELECT * FROM custreq WHERE ORGID='${orgid}' AND EVENTID='${eventid}' AND USERNAME='${username}'`;
    const result1=await db.query(query);
    const obj=result1[0][0];

    query=`DELETE FROM custreq WHERE EVENTID='${eventid}'`;
    await db.query(query);

    query= `INSERT INTO eventstat VALUES('${eventid}','${orgid}','${username}','${obj.NEWBUDGET}','${obj.DESCRIPTION}','PENDING')`;
    await db.query(query);
    
    

    res.status(200).send({
      message:'Successfully Accepted',
      flag:'success'
    })
    // console.log(result1[0]);

  }
  catch(err){
    res.status(401).send();
  }
});

router.post('/eventOrgDetail',async(req,res)=>{
  try{
    console.log(req.body);
    const orgid=req.body.ORGID;
    const eventid=req.body.EVENTID;
    var query= `SELECT * FROM custreq c, organizerdata o WHERE c.EVENTID='${eventid}' AND c.ORGID='${orgid}' AND c.ORGID=o.ORGID`;
    const resp=await db.query(query);
    console.log(resp[0][0]);
    res.send(resp[0])

  }catch(error){

  }
})


router.post('/getToDate',async (req,res) => {
  try{
    const eventid=req.body.eventid;
    console.log(eventid);
    var query = `SELECT FROMDATE,TODATE FROM event WHERE EVENTID='${eventid}'`;
    const result1=await db.query(query);
    var obj=result1[0][0];
    var findate;
    if(obj.TODATE==null){
      findate=obj.FROMDATE;
    }else{
      findate=obj.TODATE;
    }
    console.log(findate);
    res.status(200).send({
      findate:findate
    })
  }catch(error){
  
  }
})


router.post('/makePayment',async (req,res) => {
  console.log(req.body);
  const amt=req.body.amt;
  const rating=req.body.rating;
  const eventid=req.body.eventid;
  var query=`SELECT ORGID,USERNAME,NEWBUDGET FROM eventstat WHERE EVENTID='${eventid}'`;
  const result1=await db.query(query);
  var username=result1[0][0].USERNAME;
  var orgid=result1[0][0].ORGID;
  var newbud=result1[0][0].NEWBUDGET;

  var ckamt=`SELECT WALLET FROM customerdata where USERNAME='${username}'`;
  var balres=await db.query(ckamt);
  var bal=balres[0][0].WALLET;
  console.log(bal);
  if(bal<newbud){
    res.status(409).send({
      message:'Insufficient Funds,Please add balance',
      flag:'danger'
    })
  }else{
    
  query=`UPDATE customerdata SET WALLET=WALLET-${newbud} WHERE USERNAME='${username}'`;
  var query1=`UPDATE organizerdata SET WALLET=WALLET+${newbud} WHERE ORGID='${orgid}'`;
  
  var query2=`SELECT rating FROM organizerdata WHERE ORGID='${orgid}'`;
  var ratres=await db.query(query2);
  var rat=ratres[0][0].rating;
  console.log(ratres);
  if(rat){
    var nr=(rating+parseFloat(rat))/2;
    var query3=`UPDATE organizerdata SET RATING=${nr} where ORGID='${orgid}'`;
    await db.query(query3);
  }else{
    var query4=`UPDATE organizerdata SET RATING=${rating} where ORGID='${orgid}'`;
    await db.query(query4);

  }
  
  await db.query(query);
  await db.query(query1);

  query =`UPDATE eventstat SET STATUS='COMPLETE' WHERE EVENTID='${eventid}'`;
  await db.query(query);

  query=`DELETE FROM msg WHERE EVENTID='${eventid}'`;
  await db.query(query)

  res.status(200).send({
    message:'Payment Successful',
    flag:'success'
  })
  }



})
module.exports = router;
