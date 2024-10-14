const mongoose = require('mongoose');

const TFSchema = new mongoose.Schema({

    'gene': {type:String}, 
    'tf_family': {type:String},
    'species': {type:String},
    
});

const resultsdb = mongoose.connection.useDb("apinetdb")
const TFAestivums = resultsdb.model('tf_hosts', TFSchema)


module.exports ={
    'host':TFAestivums,
   
   
}