const mongoose = require('mongoose');

const EffectorSchema = new mongoose.Schema({

    'gene': {type:String}, 
    'length': {type:Number},
    'description':{type:String},
    'type':{type:String},
    'species':{type:String},
    
});

const resultsdb = mongoose.connection.useDb("apinetdb")

const EffectorPathogens = resultsdb.model('effector_secretory_proteins', EffectorSchema)

module.exports ={
    
    'pathogen':EffectorPathogens,
}