const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const getPPI = require("../introlog/introlog");
const getDomain = require("../domain/domain");
const GO = require("../models/GO");
const KEGG = require("../models/KEGG");
const Interpro = require("../models/Interpro");
const Local = require("../models/Local");
const TF = require("../models/TF");
const Effector = require("../models/Effector");
const mongoose = require('mongoose');
const getGOPPI = require("../gosemsim/goPPI");
const getphyloPPI = require("../phylo/phylo");
const wheatSchema = new mongoose.Schema({
  Host_Protein: { type: String },
  Pathogen_Protein: { type: String },
  ProteinA: { type: String },
  ProteinB: { type: String },
  intdb_x: { type: String },
  Method: { type: String },
  Type: { type: String },
  Confidence: { type: String },
  PMID: { type: String },
});

const GOPPISchema = new mongoose.Schema({
  Host_Protein: { type: String },
  Pathogen_Protein: { type: String },
  Host_GO: { type: String },
  Pathogen_GO: { type: String },
  score: { type: Number },
});

const PhyloPPISchema = new mongoose.Schema({
  Host_Protein: { type: String },
  Pathogen_Protein: { type: String },
  Score: { type: Number },
  Host_Pattern: { type: String },
  Pathogen_Pattern: { type: String },
  
});

const DomainSchema = new mongoose.Schema({
  Host_Protein: { type: String },
  Pathogen_Protein: { type: String },
  ProteinA: { type: String },
  ProteinB: { type: String },
  score: { type: Number },
  DomianA_name: { type: String },
  DomainA_desc: { type: String },
  DomianA_interpro: { type: String },
  DomianB_name: { type: String },
  DomainB_desc: { type: String },
  DomianB_interpro: { type: String },
  intdb: { type: String },
});

function splithost(string) {
  const cdsOrCdsRegex = /(cds|CDS)/i;
  const lastDotIndex = string.lastIndexOf('.');
  const secondLastDotIndex = string.lastIndexOf('.', lastDotIndex - 1);

  if (cdsOrCdsRegex.test(string)) {
    return string.slice(0, secondLastDotIndex);
  } else {
    return string.slice(0, lastDotIndex);
  }
}

router.route('/ppi').post(async (req, res) => {

  const body = JSON.parse(JSON.stringify(req.body));

  let isgenes;
  
  let genes;
  let species;

  if (body.searchType ==='keyword'){
    
    if (body.ids ==='host'){
      species = body.host.toLowerCase()
    }
    else{
      species = body.pathogen.toLowerCase()
    }
    console.log(species)
    if (body.anotType === 'go'){
      const query = {
        $or: [
          
          { "gene": { $regex: body.keyword, $options: 'i' } },
          { "term": { $regex: body.keyword, $options: 'i' } },
          { "description": { $regex: body.keyword, $options: 'i' } },
          { "definition": { $regex: body.keyword, $options: 'i' } },
          { "evidence": { $regex: body.keyword, $options: 'i' } },
          { "ontology": { $regex: body.keyword, $options: 'i' } },
          
        ],
        'species':{$regex: species, $options: "i"}
      }

      keyword_data = await GO[body.ids].find(query)
      
      const geneArray = keyword_data.map(obj => obj.gene);
      console.log(geneArray.length)
      genes = geneArray.join(',');
      
    }
    if (body.anotType === 'local'){
      const query = {
        $or: [
          
          { "gene": { $regex: body.keyword, $options: 'i' } },
          { "location": { $regex: body.keyword, $options: 'i' } },
          
        ],
        'species':{$regex: species, $options: "i"}
      }

      keyword_data = await Local[body.ids].find(query)
      
      const geneArray = keyword_data.map(obj => obj.gene);
      console.log(geneArray.length)
      genes = geneArray.join(',');
      
    }
    if (body.anotType === 'pathway'){
      const query = {
        $or: [
          
          { "gene": { $regex: body.keyword, $options: 'i' } },
          { "pathway": { $regex: body.keyword, $options: 'i' } },
          { "description": { $regex: body.keyword, $options: 'i' } }
          
        ],
        'species':{$regex: species, $options: "i"}
      }

      keyword_data = await KEGG[body.ids].find(query)
      
      const geneArray = keyword_data.map(obj => obj.gene);
      console.log(geneArray.length)
      genes = geneArray.join(',');
      
    }
    if (body.anotType === 'tf') {
      const query = {
          $or: [
              { "gene": { $regex: body.keyword, $options: 'i' } },
              { "tf_family": { $regex: body.keyword, $options: 'i' } }
          ],
          'species':{$regex: species, $options: "i"}
      };
  
      console.log(query);
      keyword_data = await TF[body.ids].find(query);
  
      console.log(keyword_data);
  
      const geneArray = keyword_data.map(obj => obj.gene);
      console.log(geneArray.length);
      genes = geneArray.join(',');
  }
  
  if (body.anotType === 'interpro') {
    const isInteger = Number.isInteger(parseInt(body.keyword));
    const query = {
        $or: [
            { "gene": { $regex: body.keyword, $options: 'i' } },
            { "interpro_id": { $regex: body.keyword, $options: 'i' } },
            { "sourcedb": { $regex: body.keyword, $options: 'i' } },
            { "domain": { $regex: body.keyword, $options: 'i' } },
            { "domain_description": { $regex: body.keyword, $options: 'i' } }
        ],
        'species': { $regex: species, $options: "i" }
    };

    if (isInteger) {
        query.$or.push({ "length": parseInt(body.keyword) });
    }

    keyword_data = await Interpro[body.ids].find(query);

    const geneArray = keyword_data.map(obj => obj.gene);
    console.log(geneArray.length);
    genes = geneArray.join(',');
}

    if (body.anotType === 'virulence'){
      const query = {
        $or: [
          
          { "gene": { $regex: body.keyword, $options: 'i' } },
          { "description": { $regex: body.keyword, $options: 'i' } },
          { "type": { $regex: body.keyword, $options: 'i' } },
        
        
        ],
        'species':{$regex: species, $options: "i"}
      }

      keyword_data = await Effector[body.ids].find(query)
      
      const geneArray = keyword_data.map(obj => obj.gene);
      console.log(geneArray.length)
      genes = geneArray.join(',');
      
    }
  }
  else{

    genes = body.genes
    
  }

  if (genes.length !==0 | body.keyword ){
    isgenes= "True"
 }
 else{
    isgenes = "False"
 }


  const filePath = path.join(__dirname,`../genes.txt`);

  
  fs.writeFile(filePath, genes, (err) => {
    if (err) {
      console.error('Error writing to the file:', err);
    } 
  });

  let results = await getPPI(body.category, body.hspecies, body.pspecies, body.hi, body.hc, body.he, body.pi, body.pc, body.pe, body.intdb, body.domdb, isgenes,body.ids)
  
  res.json(results)

});

router.route('/goppi').post(async (req, res) => {

  const body = JSON.parse(JSON.stringify(req.body));

  let results = await getGOPPI(body.method, body.hspecies, body.pspecies, body.score, body.threshold, body.host_genes, body.pathogen_genes)
  
  res.json(results)
  
});

router.route('/phyloppi').post(async (req, res) => {
 
  const body = JSON.parse(JSON.stringify(req.body));
try{
    let results = await getphyloPPI(body.method, body.hspecies, body.pspecies, body.host_genes, body.pathogen_genes, body.hi, body.hc, body.he, body.pi, body.pc, body.pe, body.threshold)
    
    res.json(results)

    console.log("sent results")
}
catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error: "An error occurred" });
}
 
});

router.route('/results/').get(async (req, res) => {
  try {
    const { results, category, page, size } = req.query;
    const pageInt = parseInt(page) || 1;
    const sizeInt = parseInt(size) || 1000;
    const skip = (pageInt - 1) * sizeInt;

    const resultsdb = mongoose.connection.useDb("hpinet_results");
    let ResultsModel;

    try {
      if (category === 'interolog') {
        ResultsModel = resultsdb.model(results, wheatSchema);
      } else if (category === 'gosim') {
        ResultsModel = resultsdb.model(results, GOPPISchema);
      } else if (category === 'phylo') {
        ResultsModel = resultsdb.model(results, PhyloPPISchema);
      } else {
        return res.status(400).json({ error: 'Invalid category' });
      }

      const [final, counts, hostProtein, pathogenProtein] = await Promise.all([
        ResultsModel.find({}).limit(sizeInt).skip(skip).exec(),
        ResultsModel.countDocuments(),
        ResultsModel.distinct("Host_Protein"),
        ResultsModel.distinct("Pathogen_Protein"),
      ]);

      res.json({
        results: final,
        total: counts,
        hostcount: hostProtein.length,
        pathogencount: pathogenProtein.length,
      });
    } catch(e) { 
      console.log("An error occurred: " + e);
      res.json({
        results: [],
        error: "There was an error with your query.",
        total: 0,
        hostcount: 0,
        pathogencount: 0,
      })
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.route('/annotation/').get(async (req, res) => {
  try {
    console.log(req.query);

    let { host, pathogen, hid, pid } = req.query;

    const rhid = splithost(hid);

    // Convert host, pathogen, and species to lowercase for case insensitivity
    host = host.toLocaleLowerCase()
    pathogen = pathogen.toLocaleLowerCase()
    
    // Perform case-insensitive search for genes and species
    // let hgo_results = await GO['host'].find({ 'species': { $regex: new RegExp(host, 'i') }, 'gene': { $regex: new RegExp('^' + hid + '$', 'i') } });
    let hgo_results = await GO['host'].find();
    let pgo_results = await GO['pathogen'].find({ 'species': { $regex: new RegExp(pathogen, 'i') }, 'gene': { $regex: new RegExp('^' + pid + '$', 'i') } });
    let hkegg_results = await KEGG['host'].find({ 'species': { $regex: new RegExp(host, 'i') }, 'gene': { $regex: new RegExp('^' + hid + '$', 'i') } });
    let pkegg_results = await KEGG['pathogen'].find({ 'species': { $regex: new RegExp(pathogen, 'i') }, 'gene': { $regex: new RegExp('^' + pid + '$', 'i') } });
    let hlocal_results = await Local['host'].find({ 'species': { $regex: new RegExp(host, 'i') }, 'gene': { $regex: new RegExp('^' + hid + '$', 'i') } });
    let plocal_results = await Local['pathogen'].find({ 'species': { $regex: new RegExp(pathogen, 'i') }, 'gene': { $regex: new RegExp('^' + pid + '$', 'i') } });
    let hinterpro_results = await Interpro['host'].find({ 'species': { $regex: new RegExp(host, 'i') }, 'gene': { $regex: new RegExp('^' + hid + '$', 'i') } });
    let pinterpro_results = await Interpro['pathogen'].find({ 'species': { $regex: new RegExp(pathogen, 'i') }, 'gene': { $regex: new RegExp('^' + pid + '$', 'i') } });
    let htf_results = await TF['host'].find({ 'species': { $regex: new RegExp(host, 'i') }, 'gene': { $regex: new RegExp('^' + hid + '$', 'i') } });
    let effector_results = await Effector['pathogen'].find({ 'species': { $regex: new RegExp(pathogen, 'i') }, 'gene': { $regex: new RegExp('^' + pid + '$', 'i') } });

    console.log(hinterpro_results)

    // Filter out duplicate JSON objects
    hgo_results = filterDuplicates(hgo_results);
    pgo_results = filterDuplicates(pgo_results);
    hkegg_results = filterDuplicates(hkegg_results);
    pkegg_results = filterDuplicates(pkegg_results);
    hlocal_results = filterDuplicates(hlocal_results);
    plocal_results = filterDuplicates(plocal_results);
    hinterpro_results = filterDuplicates(hinterpro_results);
    pinterpro_results = filterDuplicates(pinterpro_results);
    htf_results = filterDuplicates(htf_results);
    effector_results = filterDuplicates(effector_results);

    res.json({
      'hgo': hgo_results,
      'pgo': pgo_results,
      'hkegg': hkegg_results,
      'pkegg': pkegg_results,
      'hlocal': hlocal_results,
      'plocal': plocal_results,
      'htf': htf_results,
      'peff': effector_results,
      'hint': hinterpro_results,
      'pint': pinterpro_results
    });

    console.log(res)
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function areObjectsEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
      return false;
  }

  for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
          return false;
      }
  }

  return true;
}

function filterDuplicates(results) {
  const uniqueResults = [];

  for (const result of results) {
      let isDuplicate = false;
      for (const uniqueResult of uniqueResults) {
          if (areObjectsEqual(result, uniqueResult)) {
              isDuplicate = true;
              break;
          }
      }
      if (!isDuplicate) {
          uniqueResults.push(result);
      }
  }

  return uniqueResults;
}

router.route('/download/').get(async (req, res) => {
  try {
    let { results } = req.query;

    const resultsdb = mongoose.connection.useDb("hpinet_results");
    const Results = resultsdb.model(results, wheatSchema);

    let final = await Results.find({}).exec();

    res.json({ 'results': final });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.route('/domain_download/').post(async (req, res) => {
  try {
    const body = req.body;
    const table = body.species.toLowerCase() + '_domains';
    const resultsdb = mongoose.connection.useDb("hpinetdb");
    const Results = resultsdb.model(table, DomainSchema);
    
    const query = { intdb: { $in: body.intdb } };

    if (body.genes && body.genes.length > 0) {
      if (body.idt === 'host') {
        query.Host_Protein = { $in: body.genes };
      } else if (body.idt === 'pathogen') {
        query.Pathogen_Protein = { $in: body.genes};
      }
    }
   console.log(query)
    const [final] = await Promise.all([
      Results.find(query),
    ]);
    
    res.json({
      results: final,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }

})

router.route('/domain_results').post(async (req, res) => {

  const body = JSON.parse(JSON.stringify(req.body));

  let results = await getDomain(body.species, body.intdb, body.page, body.size)
  
  res.json(results)
});

// router.route('/domain_results/').post(async (req, res) => {
//   console.log(req.body)
//   try {
//     const body = req.body;
//     const page = parseInt(body.page) || 1;
//     const size = parseInt(body.size) || 10;
//     const table = body.species.toLowerCase() + '_domains';
//     const limit = size;
//     const skip = (page - 1) * size;
//     const resultsdb = mongoose.connection.useDb("apinetdb");
//     const upresults = mongoose.connection.useDb("apinet_results");
//     const Results = resultsdb.model(table, DomainSchema);
//     let isgenes;
  
  
//   let genes; // Initialize genes to an empty string
//   let species;

//   if (body.searchType ==='keyword'){
    
//     if (body.ids ==='host'){
//       species = body.host.toLowerCase()
//     }
//     else{
//       species = body.pathogen.toLowerCase()
//     }
//     console.log(species)
//     if (body.anotType === 'go'){
//       const query = {
//         $or: [
          
//           { "gene": { $regex: body.keyword, $options: "i"} },
//           { "term": { $regex: body.keyword, $options: "i"} },
//           { "description": { $regex: body.keyword, $options: "i"} },
//           { "definition": { $regex: body.keyword, $options: "i" } },
//           { "evidence": { $regex: body.keyword, $options: "i"} },
//           { "ontology": { $regex: body.keyword, $options: "i" } },
          
//         ],
//         'species':{$regex: species, $options: "i"}
//       }

//       keyword_data = await GO[body.ids].find(query)
      
//       const geneArray = keyword_data.map(obj => obj.gene);
//       console.log(geneArray.length)
//       genes = geneArray.join(',');
      
//     }
//     if (body.anotType === 'local'){
//       const query = {
//         $or: [
          
//           { "gene": { $regex: body.keyword, $options: "i"} },
//           { "location": { $regex: body.keyword, $options: "i"} },
          
//         ],
//         'species':{$regex: species, $options: "i"}
//       }

//       keyword_data = await Local[body.ids].find(query)
      
//       const geneArray = keyword_data.map(obj => obj.gene);
//       console.log(geneArray.length)
//       genes = geneArray.join(',');
      
//     }
//     if (body.anotType === 'pathway'){
//       const query = {
//         $or: [
          
//           { "gene": { $regex: body.keyword, $options: "i"} },
//           { "pathway": { $regex: body.keyword, $options: "i"} },
//           { "description": { $regex: body.keyword, $options: "i"} }
          
//         ],
//         'species':{$regex: species, $options: "i"}
//       }

//       keyword_data = await KEGG[body.ids].find(query)
      
//       const geneArray = keyword_data.map(obj => obj.gene);
//       console.log(geneArray.length)
//       genes = geneArray.join(',');
      
//     }
//     if (body.anotType === 'tf'){
//       const query = {
//         $or: [
          
//           { "gene": { $regex: body.keyword, $options: "i"} },
//           { "tf_family": { $regex: body.keyword, $options: "i"} }
        
//         ],
//         'species':{$regex: species, $options: "i"}
//       }

//       keyword_data = await TF[body.ids].find(query)
      
//       const geneArray = keyword_data.map(obj => obj.gene);
//       console.log(geneArray.length)
//       genes = geneArray.join(',');
      
//     }

//     if (body.anotType === 'interpro') {
//       const isInteger = Number.isInteger(parseInt(body.keyword));
//       const query = {
//           $or: [
//               { "gene": { $regex: body.keyword, $options: 'i' } },
//               { "interpro_id": { $regex: body.keyword, $options: 'i' } },
//               { "sourcedb": { $regex: body.keyword, $options: 'i' } },
//               { "domain": { $regex: body.keyword, $options: 'i' } },
//               { "domain_description": { $regex: body.keyword, $options: 'i' } }
//           ],
//           'species': { $regex: species, $options: "i" }
//       };
  
//       if (isInteger) {
//           query.$or.push({ "length": parseInt(body.keyword) });
//       }
  
//       keyword_data = await Interpro[body.ids].find(query);
  
//       const geneArray = keyword_data.map(obj => obj.gene);
//       // console.log(geneArray.length);
//       genes = geneArray.join(',');
//   }
  
//     if (body.anotType === 'virulence'){
//       const query = {
//         $or: [
          
//           { "gene": { $regex: body.keyword, $options: "i"} },
//           { "description": { $regex: body.keyword, $options: "i"} },
//           { "type": { $regex: body.keyword, $options: "i"} },
//         ],
//         'species':{$regex: species, $options: "i"}
//       }

//       keyword_data = await Effector[body.ids].find(query)
      
//       const geneArray = keyword_data.map(obj => obj.gene);
//       // console.log(geneArray.length)
//       genes = geneArray.join(',');
      
//     }
//   }
//   else{

//     genes = body.genes || ''
    
//   }


//     const query = { intdb: { $in: body.intdb } };

//     if (genes.length !==0 | body.keyword ) {
//       if (body.idt === 'host') {
//         query.Host_Protein = { $in: genes };
//       } else if (body.idt === 'pathogen') {
//         query.Pathogen_Protein = { $in: genes};
//       }
//     }
//    console.log(query)
//     const [final, counts, hostProtein, pathogenProtein] = await Promise.all([
//       Results.find(query).limit(limit).skip(skip).lean().exec(),
//       Results.count(query),
//       Results.distinct("Host_Protein", query),
//       Results.distinct("Pathogen_Protein", query)
//     ]);
    

//     const timestamp = new Date().getTime(); // Get current timestamp
//     const tableName = `hpinet${timestamp}results`; // Construct table name with timestamp
//     console.log(tableName)
//     // Create a new MongoDB collection with the timestamp-based name
//     const newCollection = upresults.collection(tableName);

//   //   const finalArray = Array.isArray(final) ? final : [final];

//   //   if (finalArray.some(item => typeof item !== 'object' || item === null)) {
//   //     throw new Error('Invalid document found in final array');
//   // }
//   // console.log(finalArray)
//     // Insert the data into the new collection
//     await newCollection.insertMany(final);

//     res.json({
//       results: final,
//       total: counts,
//       hostcount: hostProtein.length,
//       pathogencount: pathogenProtein.length,
//       resultid: tableName
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "An error occurred" });
//   }
// });


router.route('/network/').get(async (req, res) => {
  try {
    let { results } = req.query;

    const resultsdb = mongoose.connection.useDb("hpinet_results");
    const Results = resultsdb.model(results, wheatSchema);

    let final = await Results.find().exec();
    let counts = await Results.countDocuments();
    let host_protein = await Results.distinct("Host_Protein");
    let pathogen_protein = await Results.distinct('Pathogen_Protein');
    res.json({ 'results': final, 'total': counts, 'hostcount': host_protein.length, 'pathogencount': pathogen_protein.length });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.route('/go/').get(async (req, res) => {
  console.log(req.query)
  let { species, sptype, page, size } = req.query;
  
  // Default values for page and size
  let pageNumber = parseInt(page) || 1;
  let pageSize = parseInt(size) || 10;
  
  // Calculate skip based on pagination
  const skip = (pageNumber - 1) * pageSize;

  try {
    // Query to fetch GO results with case-insensitive species matching
    let go_results = await GO[sptype].find({ 'species': { $regex: new RegExp(species, 'i') } }).limit(pageSize).skip(skip).exec();
    
    // Count total matching documents
    let total = await GO[sptype].countDocuments({ 'species': { $regex: new RegExp(species, 'i') } });
    
    // Fetch distinct term counts
    let knum = await GO[sptype].distinct('term');
    
    console.log(knum.length);
    
    // Send response with data and total count
    res.json({ 'data': go_results, 'total': total });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

});


router.route('/kegg/').get(async (req, res) => {
  try {
    let { species, sptype, page, size } = req.query;

    // Default values for page and size
    let pageNumber = parseInt(page) || 1;
    let pageSize = parseInt(size) || 10;

    // Calculate skip based on pagination
    const skip = (pageNumber - 1) * pageSize;

    // Query to fetch KEGG results with case-insensitive species matching
    let kegg_results = await KEGG[sptype].find({ 'species': { $regex: new RegExp(species, 'i') } }).limit(pageSize).skip(skip).exec();

    // Count total matching documents
    let total = await KEGG[sptype].countDocuments({ 'species': { $regex: new RegExp(species, 'i') } });

    // Send response with data and total count
    res.json({ 'data': kegg_results, 'total': total });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.route('/interpro/').get(async (req, res) => {
  try {
    let { species, sptype, page, size } = req.query;

    // Default values for page and size
    let pageNumber = parseInt(page) || 1;
    let pageSize = parseInt(size) || 10;

    // Calculate skip based on pagination
    const skip = (pageNumber - 1) * pageSize;

    // Query to fetch Interpro results with case-insensitive species matching
    let interpro_results = await Interpro[sptype].find({ 'species': { $regex: new RegExp(species, 'i') } }).limit(pageSize).skip(skip).exec();

    // Count total matching documents
    let total = await Interpro[sptype].countDocuments({ 'species': { $regex: new RegExp(species, 'i') } });

    // Send response with data and total count
    res.json({ 'data': interpro_results, 'total': total });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.route('/local/').get(async (req, res) => {
  try {
    let { species, sptype, page, size } = req.query;

    // Default values for page and size
    let pageNumber = parseInt(page) || 1;
    let pageSize = parseInt(size) || 10;

    // Calculate skip based on pagination
    const skip = (pageNumber - 1) * pageSize;

    // Query to fetch Localization results with case-insensitive species matching
    let local_results = await Local[sptype].find({ 'species': { $regex: new RegExp(species, 'i') } }).limit(pageSize).skip(skip).exec();

    // Count total matching documents
    let total = await Local[sptype].countDocuments({ 'species': { $regex: new RegExp(species, 'i') } });

    // Send response with data and total count
    res.json({ 'data': local_results, 'total': total });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.route('/tf/').get(async (req, res) => {
  try {
    let { species, sptype, page, size } = req.query;

    // Default values for page and size
    let pageNumber = parseInt(page) || 1;
    let pageSize = parseInt(size) || 10;

    // Calculate skip based on pagination
    const skip = (pageNumber - 1) * pageSize;

    // Query to fetch TF results with case-insensitive species matching
    let transcription_results = await TF[sptype].find({ 'species': { $regex: new RegExp(species, 'i') } }).limit(pageSize).skip(skip).exec();

    // Count total matching documents
    let total = await TF[sptype].countDocuments({ 'species': { $regex: new RegExp(species, 'i') } });

    // Send response with data and total count
    res.json({ 'data': transcription_results, 'total': total });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.route('/effector/').get(async (req, res) => {
  try {
    let { species, page, size } = req.query;

    // Default values for page and size
    let pageNumber = parseInt(page) || 1;
    let pageSize = parseInt(size) || 10;

    // Calculate skip based on pagination
    const skip = (pageNumber - 1) * pageSize;

    // Query to fetch Effector results with case-insensitive species matching
    let query = {
      'species': { $regex: new RegExp(species, 'i') }
    };

    const limit = parseInt(size);

    let effector_results = await Effector['pathogen'].find(query).limit(limit).skip(skip).exec();

    // Count total matching documents
    let total = await Effector['pathogen'].countDocuments(query);

    res.json({ 'data': effector_results, 'total': total });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;