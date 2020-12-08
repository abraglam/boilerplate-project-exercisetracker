const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
require('dotenv').config()
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

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
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', async function (req, res) {
  try {
    const uName = req.body.username;
    const user = new User({ username: uName });
    user.save();
    const resp = await User.findOne({ username: uName }).lean();
    res.json(resp);
  }
  catch (err) {
    console.error(err);
  }
})

app.post('/api/exercise/add', async (req, res) => {
  try {
    let { userId, description, duration, date } = req.body;
    const user = await User.findById(userId, '_id username').lean();
    if (!date) {
      date = new Date().toDateString();
    }
    const activity = new Activity({
      userId: userId,
      username: user.username,
      description: description,
      duration: duration,
      date, date
    })
    activity.save();
    user.date = date
    user.duration = duration;
    user.description = description;

    res.json(user)
  }
  catch (err) {
    console.error(err);
  }
})

app.get('/api/exercise/users', async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  }

  catch (err) {
    console.error(err);
  }
})

app.get('/api/exercise/log', async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId, '_id username').lean();
    const activity = await Activity.find({ userId: userId }).lean();
    let log = activity.map((e) => { return { description: e.description, duration: e.duration, date: e.date } });
    if (req.query.from && req.query.to) {
      log = log.filter(e => {
        return dayjs(e.date).isBetween(req.query.from, req.query.to)
      })
    }
    if (req.query.from && !req.query.to) {
      log = log.filter(e => {
        return dayjs(e.date).isSameOrAfter(req.query.from, req.query.to)
      })
    }

    if (req.query.to && !req.query.from) {
      log = log.filter(e => {
        return dayjs(e.date).isSameOrBefore(req.query.from, req.query.to)
      })
    }

    if (req.query.limit) {
      log = log.filter((e, i) => i <= (req.query.limit - 1));
    }
    user.count = log.length;
    user.log = log;
    res.json(user);
  }
  catch (err) {
    console.error(err);
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});