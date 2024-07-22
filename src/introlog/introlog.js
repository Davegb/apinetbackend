const { spawn } = require('child_process');
const path = require('path');

// Function to run the hpinterolog.py script
const getPPI = async (method, hspecies, pspecies, identity, coverage, evalue, pi, pc, pe, intdb, domdb,isgenes, idt) => {
  let output;

  // Build the command arguments for the script
  const commandArgs = [
    "/home/davidg/envs/hucovaria/bin/python",
    "/home/davidg/repos/hpinetbackend/src/introlog/hpinterolog.py",
    "--method", method,
    "--blastdb", "/home/davidg/repos/hpinetbackend/apinetblast.db",
    "--ppidb", "ppidb",
    "--host_table", hspecies.toLowerCase(),
    "--pathogen_table", pspecies,
    "--host_identity", parseInt(identity),
    "--host_coverage", parseInt(coverage),
    "--host_evalue", parseFloat(evalue),
    "--pathogen_identity", parseInt(pi),
    "--pathogen_coverage", parseInt(pc),
    "--pathogen_evalue", parseFloat(pe),
    "--ppitables", intdb,
    '--domdb', domdb,
    '--id', idt,
    
  ];
  

  if (isgenes ==='True') {
    commandArgs.push('--genes');
  }

  console.log(commandArgs.join(" "))
  const getS = spawn(commandArgs[0], commandArgs.slice(1));

  // Handle stdout data
  getS.stdout.on('data', (data) => {
    output = data.toString();
    console.log('output was generated: ' + output);
  });

  getS.stdin.setEncoding = 'utf-8';

  // Handle stderr data
  getS.stderr.on('data', (data) => {
    console.log('error: ' + data);
  });

  return new Promise((resolve, reject) => {
    getS.stdout.on('end', async function (code) {
        const resultData = output.replace(/\n$/, "");;
            
            resolve(resultData);
    });
  });
};

module.exports = getPPI;
