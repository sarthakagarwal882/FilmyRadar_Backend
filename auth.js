require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);
client.connect();


async function insertData(data) {
  const db = client.db('FilmyRadar');
  const coll1 = db.collection('UserCredentials');
  const coll2 = db.collection('UserData');
  const data2 = {
    username: data.username,
    fname: data.fname,
    gender: data.gender,
    watching: {
      movies: [],
      tv: []
    },
    completed: {
      movies: [],
      tv: []
    },
    on_hold: {
      movies: [],
      tv: []
    },
    dropped: {
      movies: [],
      tv: []
    },
    plan_to_watch: {
      movies: [],
      tv: []
    }
  }
  try {
    if (((await coll1.insertOne(data)).acknowledged) && ((await coll2.insertOne(data2)).acknowledged)) {
      return (true);
    }
    else {
      return (false)
    }
  }
  catch (err) {
  }
}


async function verifyToken(token) {
  let tokenData = (jwt.verify(token, process.env.TOKEN, { expiresIn: 30, audience: process.env.JWT_AUD }, (err, decoded) => (decoded)
  ))
  if (tokenData === undefined)
    return (tokenData)
  else {
    let data = {
      username: tokenData.username
    }
    const db = client.db('FilmyRadar');
    const coll1 = db.collection('UserData')
    const query = await coll1.findOne(data);
    if (query._id.toString() == tokenData.id)
    {
      return(query);
    }
  }

}


async function checkLoginData(data) {
  const db = client.db('FilmyRadar');
  const coll = db.collection('UserCredentials');
  const coll2 = db.collection('UserData')
  const data2 = { username: (data.username) }
  try {
    const query = await coll.findOne(data);
    if (query == null) {
      return (false)
    }
    else {
      userData = await coll2.findOne(data2)
      let cookieData = {
        id: userData._id,
        username: userData.username,
        fname: userData.fname,
        gender: userData.gender
      }
      let expTime = '30 days'
      var token = jwt.sign(cookieData, process.env.TOKEN, { expiresIn: expTime, audience: process.env.JWT_AUD });
      let finalData = {
        cookieData: cookieData,
        data: userData,
        token: token,
        expireTime: expTime,
      }
      return (finalData)
    }
  }
  catch (err) {
    console.log(err);
  }
}


async function checkUsername(data) {
  const db = client.db('FilmyRadar');
  const coll = db.collection('UserCredentials');
  const coll1 = db.collection('UserData');
  const check = await coll.findOne({ username: data.username });
  if (check == null) {
    if ('fname' in data) {
      if (await insertData(data)) {
        let userData = (await coll1.findOne({ username: data.username }))
        let cookieData = {
          id: userData._id,
          username: userData.username,
          fname: userData.fname,
          gender: userData.gender
        }
        let expTime = '30 days'
        var token = jwt.sign(cookieData, process.env.TOKEN, { expiresIn: expTime, audience: process.env.JWT_ENV });
        let finalData = {
          cookieData: cookieData,
          data: userData,
          token: token,
          expireTime: expTime
        }
        return (finalData)
      }
    }
    else {
      return false
    }
  }
  else {
    if ('fname' in data)
      return false
    else
      return (check.salt);
  }
}


async function hashPass(message) {
  if ('fname' in message) {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(message.password, salt);
    message.password = hashedPass;
    message.salt = salt
    return (message);
  }
  else {
    const saltCheck = (await checkUsername(message))
    if (saltCheck === false)
      return (false)
    else {
      message.password = await bcrypt.hash(message.password, saltCheck)
      return (message)
    }
  }
}

function auth(app) {
  //Login post request
  app.post('/login', async (req, res) => {
    const message = req.body.credentials;
    const checkHash = await hashPass(message)
    if (checkHash === false) {
      {
        res.json(false)
      }
    }
    else {
      res.json(await checkLoginData(checkHash));
    }
  });

  //verification of token
  app.post('/verify', async (req, res) => {
    const message = req.body
    let check =await verifyToken(message.token)
    if (check === undefined)
      res.json('false')
    else
      res.json(check)

  });

  //Register post request
  app.post('/register', async (req, res) => {
    const message = req.body.formData;
    res.json(await checkUsername(await hashPass(message)));
  });
}



// async function del(data){
//   const db = client.db('FilmyRadar');
//   const coll = db.collection('UserCredentials');
//   const coll2 = db.collection('UserData');
//   await coll.deleteMany(data);
//   await coll2.deleteMany(data);
// }
module.exports = auth;