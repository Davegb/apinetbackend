const express = require('express');
const router = express.Router();
const getPPI = require("../introlog/introlog");
const GO = require("../models/GO");
const KEGG = require("../models/KEGG");
const Interpro = require("../models/Interpro"); 
const Local = require("../models/Local");
const TF = require("../models/TF");
const Effector =require("../models/Effector");
const mongoose = require('mongoose');
const getGOPPI = require("../gosemsim/goPPI")
const wheatSchema = new mongoose.Schema({
    Host_Protein: {type:String},
    Pathogen_Protein: {type:String},
    ProteinA: {type:String},
    ProteinB: {type:String},
    intdb_x: {type:String},
    Method: {type:String},
    Type: {type:String},
    Confidence: {type:String},
    PMID: {type:String},
});

const GOPPISchema = new mongoose.Schema({
  Host_Protein: {type:String},
  Pathogen_Protein: {type:String},
  Host_GO: {type:String},
  Pathogen_GO: {type:String},
  score: {type:Number},
});

const DomainSchema = new mongoose.Schema({
  Host_Protein: {type:String},
  Pathogen_Protein: {type:String},
  ProteinA: {type:String},
  ProteinB: {type:String},
  score: {type:Number},
  DomianA_name :{type:String},
  DomainA_desc:{type:String},
  DomianA_interpro :{type:String},
  DomianB_name :{type:String},
  DomainB_desc:{type:String},
  DomianB_interpro :{type:String},
  intdb: {type:String},
});

function getItems(input) {
  var arr = input, obj = {};
  for (var i = 0; i < arr.length; i++) {
    if (!obj[arr[i].name]) {
      obj[arr[i].name] = 1;
    } else if (obj[arr[i].name]) {
      obj[arr[i].name] += 1;
    }
  }
  return obj;
}

router.route('/ppi').post(async(req, res) => {


  const body = JSON.parse(JSON.stringify(req.body));
  console.log(body);

//  let results = 'kbunt1653501842990result
let results = await getPPI(body.category,body.hspecies, body.pspecies, body.hi, body.hc, body.he,body.pi,body.pc,body.pe, body.intdb, body.domdb, body.genes, body.ids )
 res.json(results)
console.log(results)
 
      });

  router.route('/goppi').post(async(req, res) => {


    const body = JSON.parse(JSON.stringify(req.body));
    
    
  
  //  let results = 'kbunt1653501842990result
  let results = await getGOPPI(body.method,body.hspecies, body.pspecies, body.score, body.threshold, body.host_genes, body.pathogen_genes )
    res.json(results)
  console.log(results)
    
        });

router.route('/results/').get(async(req,res) =>{
    let {results,category, page,  size} = req.query
    if(!page){
        page = 1
      }
     if (page){
       page = parseInt(page) + 1
     }
      if (!size){
        size = 1000
      }

      const limit = parseInt(size)
      let Results =[]
      const skip = (page-1) * size;
      const resultsdb = mongoose.connection.useDb("hpinet_results")
      if (category ==='interolog'){
         Results = resultsdb.model(results, wheatSchema)
      }
      if (category ==='gosim'){
        Results = resultsdb.model(results, wheatSchema)
      }
     

      let final = await Results.find({}).limit(limit).skip(skip).exec()
      let counts = await Results.count()
      let host_protein =await Results.distinct("Host_Protein")
     
      let pathogen_protein =await Results.distinct('Pathogen_Protein')
      res.json({'results':final,'total':counts,'hostcount':host_protein.length,'pathogencount':pathogen_protein.length})

})

router.route('/download/').get(async(req,res) =>{
  let {results} = req.query
  
    const resultsdb = mongoose.connection.useDb("hpinet_results")
    const Results = resultsdb.model(results, wheatSchema)

    let final = await Results.find({})
   
    res.json({'results':final})

})

router.route('/domain_download/').get(async(req,res) =>{
  let {species, intdb} = req.query
  
    const table = species.toLowerCase()+'_domains'
    console.log(table)
    
    const resultsdb = mongoose.connection.useDb("hpinetdb")
    const Results = resultsdb.model(table, DomainSchema)
    
    let final = await Results.find({})
   
    res.json({'results':final})

})
 
router.route('/domain_results/').post(async(req,res) =>{

  const body = JSON.parse(JSON.stringify(req.body));
  // console.log(body.species);

  // let {species,page,  size, genes,idt, intdb} = req.query
  let page;
  let size;
  if(!body.page){
      page = 1 
    }
   if (body.page){
     page = parseInt(body.page) + 1
   }
    if (!body.size){
      size = 10
    }

    const table = body.species.toLowerCase()+'_domains'
    console.log(table)
    const limit = parseInt(body.size)

    const skip = (page-1) * body.size;
    const resultsdb = mongoose.connection.useDb("hpinetdb")
    const Results = resultsdb.model(table, DomainSchema)
    let final;
    let counts;
    let host_protein;
    let pathogen_protein;

    console.log(body.idt)
    console.log(body.intdb)
    if (body.genes.length>0){
      if (body.idt==='host'){
        final = await Results.find({'Host_Protein':{'$in':body.genes}, 'intdb':{'$in':body.intdb}}).limit(limit).skip(skip).exec()
        counts = await Results.count({'Host_Protein':{'$in':body.genes}})
        host_protein =await Results.distinct("Host_Protein")
        pathogen_protein =await Results.distinct('Pathogen_Protein')

      }
      if (body.idt==='pathogen'){
        // console.log("yes")
        final = await Results.find({'Pathogen_Protein':{'$in':body.genes},'intdb':{'$in':body.intdb}}).limit(limit).skip(skip).exec()
        
        counts = await Results.count({'Pathogen_Protein':{'$in':body.genes}})

        let fd = await Results.find({'Pathogen_Protein':{'$in':body.genes}})
        // host_protein =await Results.distinct("Host_Protein")
        // pathogen_protein =await Results.distinct('Pathogen_Protein')

        // console.log(final)
        host_protein =[... new Set(fd.map(data => data.Host_Protein))]
        console.log(host_protein.length)
        pathogen_protein =[... new Set(fd.map(data => data.Pathogen_Protein))]
        // console.log(pathogen_protein)
      
      }
      
    }

    if (body.genes.length===0) {
      console.log("i am here")
      final = await Results.find({'intdb':{'$in':body.intdb}}).limit(limit).skip(skip).exec()
      // console.log(final)
     
      counts = await Results.find({'intdb':{'$in':body.intdb}}).count()
    
      // // counts = data.keys(data.shareInfo[i]).length
      // host_protein = await Results.distinct("Host_Protein", {'intdb':{'$in':body.intdb}})
      // pathogen_protein =await Results.distinct('Pathogen_Protein', {'intdb':{'$in':body.intdb}})
      // console.log(host_protein.length)
      // res.json({'results':final,'total':counts,'hostcount':host_protein.length,'pathogencount':pathogen_protein.length})
      host_protein = 10
      pathogen_protein = 5
    }
    
    
    res.json({'results':final,'total':counts,'hostcount':host_protein.length,'pathogencount':pathogen_protein.length})

})
router.route('/network/').get(async(req,res) =>{
  let {results} = req.query

    const resultsdb = mongoose.connection.useDb("hpinet_results")
    const Results = resultsdb.model(results, wheatSchema)

    let final = await Results.find().exec()
    let counts = await Results.count()
    let host_protein =await Results.distinct("Host_Protein")
   
    let pathogen_protein =await Results.distinct('Pathogen_Protein')
    res.json({'results':final,'total':counts,'hostcount':host_protein.length,'pathogencount':pathogen_protein.length})

})




router.route('/go/').get(async(req, res) => {

 

  let {species, sptype, page, size} = req.query
    if(!page){
        page = 1
      }
     if (page){
       page = parseInt(page) + 1
     }
      if (!size){
        size = 10
      }

      const limit = parseInt(size)

      const skip = (page-1) * size;

      let go_results = await GO[sptype].find({'species':{'$in':species.toLowerCase()}}).limit(limit).skip(skip).exec()
      let total = await GO[sptype].find({'species':{'$in':species.toLowerCase()}}).count()
      let knum = await GO[sptype].distinct('term')
      console.log(knum.length)
      res.json({'data':go_results, 'total':total})

})


router.route('/kegg/').get(async(req, res) => {

 

  let {species,sptype, page, size} = req.query
    if(!page){
        page = 1
      }
     if (page){
       page = parseInt(page) + 1
     }
      if (!size){
        size = 10
      }

      const limit = parseInt(size)

      const skip = (page-1) * size;

      let kegg_results = await KEGG[sptype].find({'species':{'$in':species}}).limit(limit).skip(skip).exec()
      let total = await KEGG[sptype].find({'species':{'$in':species}}).count()

      res.json({'data':kegg_results, 'total':total})

})



router.route('/interpro/').get(async(req, res) => {

  let {species,sptype, page, size} = req.query
    if(!page){
        page = 1
      }
     if (page){
       page = parseInt(page) + 1
     }
      if (!size){
        size = 10
      }

      const limit = parseInt(size)

      const skip = (page-1) * size;

      let interpro_results = await Interpro[sptype].find({'species':{'$in':species}}).limit(limit).skip(skip).exec()
      let total = await Interpro[sptype].find({'species':{'$in':species}}).count()

      res.json({'data':interpro_results, 'total':total})

})

router.route('/local/').get(async(req, res) => {

  let {species,sptype, page, size} = req.query
    if(!page){
        page = 1
      }
     if (page){
       page = parseInt(page) + 1
     }
      if (!size){
        size = 10
      }

      const limit = parseInt(size)

      const skip = (page-1) * size;

      let local_results = await Local[sptype].find({'species':{'$in':species}}).limit(limit).skip(skip).exec()
      let total = await Local[sptype].find({'species':{'$in':species}}).count()

      res.json({'data':local_results, 'total':total})

})

router.route('/tf/').get(async(req, res) => {

  let {species,sptype, page, size} = req.query
    if(!page){
        page = 1
      }
     if (page){
       page = parseInt(page) + 1
     }
      if (!size){
        size = 10
      }


      const limit = parseInt(size)

      const skip = (page-1) * size;

      let transcription_results = await TF[sptype].find({'species':{'$in':species}}).limit(limit).skip(skip).exec()
      let total = await TF[sptype].find({'species':{'$in':species}}).count()

      res.json({'data':transcription_results, 'total':total})

})

router.route('/effector/').get(async(req, res) => {

  let {species, page, size} = req.query
    if(!page){
        page = 1
      }
     if (page){
       page = parseInt(page) + 1
     }
      if (!size){
        size = 10
      }

      let query = {
        'type': species
      }
      console.log(species)
      const limit = parseInt(size)

      const skip = (page-1) * size;

      let effector_results = await Effector['pathogen'].find({'type':{'$in':species}}).limit(limit).skip(skip).exec()
      let total = await Effector['pathogen'].count(query)
      console.log(effector_results)
      res.json({'data':effector_results, 'total':total})

})



module.exports = router;