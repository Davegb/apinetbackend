const { spawn } = require('child_process');

const path = require('path');
const getphyloPPI = (genomePool, hspecies, pspecies, host_genes, pathogen_genes, hi, hc, he, pi,pc,pe, threshold)=>{

// const host_genes2 = host_genes.replace(" ",'')
// const pathogen_genes2 = pathogen_genes.replace(" ","")

let output;
let getS;
console.log("phylopred.py","--gp", genomePool,"--h", hspecies, "--p", pspecies, "--hg", host_genes, "--pg", pathogen_genes, "--hi", hi, "--hc", hc, "--he", he, "--pi", pi, "--pc", pc, "--pe", pe )

try {
    getS = spawn('/home/kaabil/envs/apinet/bin/python3', ["src/phylo/phylopred.py","--gp", genomePool,"--h", hspecies, "--p", pspecies, "--hg", host_genes, "--pg", pathogen_genes, "--hi", hi, "--hc", hc, "--he", he, "--pi", pi, "--pc", pc, "--pe", pe, "--t", threshold]);

    getS.stdout.on('data', (data) => {

        output = data.toString();

        console.log('output was generated: ' + output);
    });

    getS.stdin.setEncoding = 'utf-8';

    getS.stderr.on('data', (data) => {
        
        console.log('error:' + data);
    });
} catch (e) {
    console.log("Error running phylo prediction: " + e);
}
return new Promise((res, rej) => {
        getS.stdout.on('end', async function (code) {
            try {
                if (!output) {
                    res("Error")
                }
                const rid = output.replace(/\n$/, "");
                console.log(rid)
                res(rid)
            } catch (e) {
                console.log("Error interpreting phylo results: " + e);
            }
        })
 });

}

module.exports = getphyloPPI;