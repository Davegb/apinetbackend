import argparse
from subprocess import Popen, PIPE
import pandas as pd
import sqlite3
from pymongo import MongoClient

def list_of_strings(arg):
    return(arg.split(","))
ver= '0.0.1'

parser = argparse.ArgumentParser(description="""goSemSim {} : an R-based gene ontology semantic similarity-based host-pathogen identification script""".format(ver),
usage="""%(prog)s [options]""",
formatter_class=argparse.RawTextHelpFormatter )

parser.add_argument("--version", action="version", version= 'goSemSim (version {})'.format(ver), help= "Show version information and exit")
parser.add_argument("--method", dest='method',help="method")
parser.add_argument("--host", dest='host', help="Host")
parser.add_argument("--pathogen", dest='pathogen', help="Pathogen")
parser.add_argument('--hgenes', dest='hgenes', type=list_of_strings, help="Genes ids host")
parser.add_argument('--pgenes', dest='pgenes', type=list_of_strings, help="Genes ids pathogen")
parser.add_argument('--score',dest='score', type =str)

parser.add_argument('--t',dest='threshold')

def add_results(data):
    pp =connection('hpinet_results')
    name = f"hpinet{str(round(time.time() * 1000))}results"
    ptable = pp[name]
    ptable.insert_many(data)

    return name

def connection(db):
    client = MongoClient("mongodb://localhost:27017/")

    connectDB = client[db]

    return connectDB

def create_connection(db_file):
    """ create a database connection to a SQLite database """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        
    except sqlite3.Error as e:
        print(e)
    return conn

def main():
    options, unknownargs = parser.parse_known_args()
    ptable= f"{options.pathogen}"
    htable= f"{options.host.lower()}"
    method= options.method
    score = options.score
    threshold = float(options.threshold)
    host_genes = options.hgenes
    pathogen_genes = options.pgenes

    try:
        conn = create_connection("/home/dock_user/hpinetgosemsim.db")
        ht="("
        for id in host_genes:

            ht +="'"+id+"',"

        ht = ht[:-1]
        ht += ")"
        
        pt="("
        for id in pathogen_genes:

            pt +="'"+id+"',"

        pt = pt[:-1]
        pt += ")"

        hquery = "SELECT * FROM {} WHERE gene IN {}  ".format(htable,ht)
        hresult = conn.execute(hquery).fetchall()
        host_results = pd.DataFrame(hresult, columns=['id', 'gene', 'term'])
        
        pquery = "SELECT * FROM {} WHERE gene IN {}  ".format(ptable,pt)
        presult = conn.execute(pquery).fetchall()
        pathogen_results = pd.DataFrame(presult, columns=['id', 'gene', 'term'])

        final = []
        for line in host_results.values.tolist():
            for pline in pathogen_results.values.tolist():

                cmd = ["Rscript", r_script, metadata_path, counts_file, outdir, str(min_module_size), str(me_diss_threshold), str(figure_res), str(wgcna_threads)]

                p = Popen(cmd, cwd=f'{current_script_dir}/R_scripts/',
                            stdin=PIPE, stdout=PIPE, stderr=PIPE)
                output, error = p.communicate()

        rid = add_results(results.to_dict('records'))
        print(rid)
    except Exception:
        rid = add_noresults("no results")
        print(rid)
    return

if __name__ == '__main__':
    main()