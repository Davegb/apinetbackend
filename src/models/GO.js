const mongoose = require('mongoose');

const GOSchema = new mongoose.Schema({

    'gene': {type:String},
    'term':{type:String}, 
    'description': {type:String},
    'definition': {type:String},
    'evidence':{type:String}, 
    'ontology':{type:String},
    'species':{type:String},
    
});



const resultsdb = mongoose.connection.useDb("apinetdb")
const GOHosts = resultsdb.model('go_hosts', GOSchema)
const GOPathogens = resultsdb.model('go_pathogens', GOSchema)


module.exports ={
    'host':GOHosts,
    'pathogen':GOPathogens,
   
}



