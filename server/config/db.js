const mongoose = require("mongoose");

mongoose.set('strictQuery', false);

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/BlogApp";
mongoose.connect(MONGO_URI).then(()=>{
    console.log("connected!");
}).catch((err)=>{
    console.log(err);
})