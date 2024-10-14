const mongoose =require('mongoose')
// mongoose.set('strictQuery', true)
mongoose.connect("mongodb://127.0.0.1:27017/apinetdb")

.then(console.log("Database connected"))
.catch(e => {
    console.error('Connection error', e.message)
})

module.exports = connectDB = mongoose.connection