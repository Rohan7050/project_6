const mongoose = require('mongoose')

function connectDatabase() {
    mongoose.connect(process.env.URI,{ useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('mongodb running on 27017'))
}

module.exports = connectDatabase