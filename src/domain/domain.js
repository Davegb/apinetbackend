const { spawn } = require('child_process');
const path = require('path');

// Function to run the hpinterolog.py script
const getDomain = async (table, domdb, page, page_size) => {
  let output;

  const commandArgs = [
    "/home/kaabil/envs/apinet/bin/python",
    "/home/kaabil/repos/apinetbackend/src/domain/apidomain.py",
    "--dbfile", "/home/kaabil/apinetdbs/domain.sqlite",
    "--ppidb", "ppidb",
    "--table", table,
    '--domaindb', domdb,
    '--pagesize', page_size,
    '--page', page,
  ];

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
      try {
          if (!output) {
            resolve("Error")
          }
          const rid = output.replace(/\n$/, "");
          console.log(rid)
          resolve(rid)
      } catch (e) {
          console.log("Error interpreting phylo results: " + e);
      }
    });
  });
};

module.exports = getDomain;
