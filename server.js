const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
var isBetween = require('dayjs/plugin/isBetween');
require('dotenv').config()
dayjs.extend(isBetween);
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = mongoose.Schema({
  username: String
});
const activitySchema = mongoose.Schema({
  userId: String,
  description: String, 
  duration: Number,
  date: String 
})
const User = new mongoose.model('Body', userSchema);
const Activity = new mongoose.model('Activity', activitySchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', async function(req, res){
        try {
          const uName = req.body.username;
          const user = new User({username: uName});
          user.save();
          const resp = await User.findOne({username: uName}).lean();
          res.json(resp);
        }
        catch (err) {
          console.error(err);
        }
})

app.post('/api/exercise/add', async (req, res) => {
try {   
  let { userId, description, duration, date } = req.body;
   if(!date){
     date = dayjs().format('YYYY-MM-DD');
   }
   const activity = new Activity({
     userId: userId,
     description: description,
     duration: duration,
     date, date
   })
   activity.save();
   res.json({
    userId: userId,
    description: description,
    duration: duration,
    date, date
  })
}
catch (err){
  console.error(err);
}
})

app.get('/api/exercise/users', async (req, res) => {
  try{
    const users = await User.find().lean();
    res.json(users);
  }

  catch (err){
    console.error(err);
  }
})

app.get('/api/exercise/log', async(req, res)=>{
  const userId = req.query.userId;
  const user = await User.findById(userId, '_id username').lean();
  const activity = await Activity.find({userId: userId}).lean();
  let log = activity.map((e)=>{return {description: e.description, duration: e.duration, date: e.date}});
  if(req.query.from && req.query.to){
    log = log.filter(e=>{
      return dayjs(e.date).isBetween(req.query.from, req.query.to)
    })
  }
  if(req.query.limit){
    log = log.slice((req.query.limit - 1));
  }
  user.count = log.length;
  user.log = log;
  res.json(user);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});