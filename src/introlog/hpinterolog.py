from pymongo import MongoClient
import pandas as pd
import sqlite3
from sqlite3 import Error
import argparse
import time
import os


ver= '0.0.1'

parser = argparse.ArgumentParser(description="""hpinterolog {} : a python based interolog based host-pathogen identification package""".format(ver),
usage="""%(prog)s [options]""",
epilog="""Written by Naveen Duhan (naveen.duhan@usu.edu),
Kaundal Bioinformatics Lab, Utah State University,
Released under the terms of GNU General Public Licence v3""",    
formatter_class=argparse.RawTextHelpFormatter )

parser.add_argument("--version", action="version", version= 'pyseqrna (version {})'.format(ver), help= "Show version information and exit")
parser.add_argument("--method", dest='method',help="method")
parser.add_argument("--blastdb", dest='blastdb',help="Host and Pathogen Blast files database")
parser.add_argument("--ppidb", dest='ppidb', help="Interolog host pathogen interactions database")
parser.add_argument("--host_table", dest='hosttable', help="Host blast result table")
parser.add_argument("--out", dest='out', help="Outfile for results")
parser.add_argument("--pathogen_table", dest='pathogentable', help="Pathogen blast result table")
parser.add_argument("--host_identity", dest='hi', type=int, help="Host identitiy for blast filter")
parser.add_argument("--host_coverage", dest='hc',type=int, help="Host coverage for blast filter")
parser.add_argument("--host_evalue", dest='he', type=float, help="Host evalue for blast filter")
parser.add_argument("--pathogen_identity", dest='pi',type=int, help="Pathogen identitiy for blast filter")
parser.add_argument("--pathogen_coverage", dest='pc',type=int, help="Pathogen coverage for blast filter")
parser.add_argument("--pathogen_evalue", dest='pe', type=float, help="Pathogen evalue for blast filter")
parser.add_argument('--id', dest='idt', type=str, help="Id type [host, pathogen]" )
parser.add_argument('--genes', action="store_true", default=False, help="Genes ids to search")
parser.add_argument('--domdb',dest='domdb', type =str)
parser.add_argument('--ppitables', dest='ppitables', type=str, default='all', 
    help="""Provide space separated interaction database names. For example hpidb mint 
""")


def connection(db):
    client = MongoClient("mongodb://localhost:27017/")

    connectDB = client[db]

    return connectDB

def create_connection(db_file):
    """ create a database connection to a SQLite database """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        
    except Error as e:
        print(e)
    return conn

def filter_blast(db,table,ident, cov, evalue,intdb,genes=None):
    db = create_connection(db)
    if genes !=None:
        st="("
        for id in genes:

            st +="'"+id+"',"

        st = st[:-1]
        st += ")"

        query = "SELECT * FROM {} WHERE qseqid IN {} AND pident >= {} AND evalue <= {} AND qcovs >= {} AND intdb = '{}'; ".format(table,st, ident, evalue, cov, intdb)
        results = db.execute(query).fetchall()
    else:
        query = "SELECT * FROM {} WHERE pident >= {} AND evalue <= {} AND qcovs >= {} AND intdb = '{}'; ".format(table, ident, evalue, cov, intdb)
        results = db.execute(query).fetchall()

    if len(results)>0:
        df = pd.DataFrame(results, columns=['id', 'qseqid', 'sseqid', 'pident','evalue', 'qcov', 'intdb'])
                  
    else:
        df= "no"

    return df


def ppi(intdb, pathogendf, hostdf):  
    conn = create_connection('/home/kaabil/apinetdbs/ppi.sqlite')
   
    pathogen_list = pathogendf['sseqid'].values.tolist()
    host_list = hostdf['sseqid'].values.tolist()
    
    ht="("
    for id in host_list:

        ht +="'"+id+"',"

    ht = ht[:-1]
    ht += ")"
    
    pt="("
    for id in pathogen_list:

        pt +="'"+id+"',"

    pt = pt[:-1]
    pt += ")"
    # define query here
    query = "SELECT * FROM {} WHERE ProteinA IN {}  AND ProteinB IN {} OR ProteinB IN {}  AND ProteinA IN {}".format(intdb,ht,pt,ht,pt)
    result = conn.execute(query).fetchall()
  
    results = pd.DataFrame(result, columns=['ID', 'ProteinA', 'ProteinB', 'Method', 'Type', 'Confidence', 'PMID'])

    # For host as interactor A and Pathogen as Interactor B

    hostA= hostdf[['qseqid', 'sseqid','intdb']]
    pathogenB = pathogendf[['qseqid', 'sseqid','intdb']]
    hostA.columns=['Host_Protein', 'ProteinA', 'intdb']
    pathogenB.columns=['Pathogen_Protein','ProteinB', 'intdb']
    
    # For host as interactor B and Pathogen as Interactor A

    hostB= hostdf[['qseqid', 'sseqid','intdb']]
    pathogenA = pathogendf[['qseqid', 'sseqid','intdb']]
    hostB.columns=['Host_Protein', 'ProteinB', 'intdb']
    pathogenA.columns=['Pathogen_Protein','ProteinA', 'intdb']

    # Merge ppis and blast

    resultA = results.merge(hostA, on=['ProteinA'])
    resultsA = resultA.merge(pathogenB, on=['ProteinB'])

    resultB = results.merge(hostB, on=['ProteinB'])
    resultsB = resultB.merge(pathogenA, on=['ProteinA'])

    # finally merge resultsA and resultsB

    final = pd.concat([resultsA, resultsB], axis=0)

    final_results = final[['Host_Protein', 'Pathogen_Protein', 'ProteinA', 'ProteinB', 'intdb_x', 'Method', 'Type', 'Confidence', 'PMID']]
    
    # remove duplicate values

    final_results = final_results.drop_duplicates()

    return final_results

def filter_domain( table, idt =None, genes=None, domdb=None):
    mydb = create_connection("/home/kaabil/apinetdbs/domain.sqlite")

    if genes !=None:
        
        ht="("
        for id in genes:

            ht +="'"+id+"',"

        ht = ht[:-1]
        ht += ")"

        if idt !=None:
            if  idt =='host':
                query = "SELECT * FROM {} WHERE host IN {} AND intdb IN {};".format(table,ht, domdb)
                results = mydb.execute(query).fetchall()
            if  idt =='pathogen':
                query = "SELECT * FROM {} WHERE pathogen IN {} AND intdb IN {};".format(table,ht, domdb)
                results = mydb.execute(query).fetchall()
    else:
        query = "SELECT * FROM {} WHERE intdb IN {};".format(table, domdb)
        print(query)

        results = mydb.execute(query).fetchall()

    df= pd.DataFrame(results)

    print(df)
    
    df.columns = ['id', 'Host_Protein', 'Pathogen_Protein', 'ProteinA', 'ProteinB', 'Score', 'DomainA_name', 'DomainA_desc', 'DomainA_interpro', 'DomainB_name', 'DomainB_desc', 'DomainB_interpro', 'intdb']
    
    dk = df[['Host_Protein', 'Pathogen_Protein', 'ProteinA', 'ProteinB', 'Score', 'DomainA_name', 'DomainA_desc', 'DomainA_interpro', 'DomainB_name', 'DomainB_desc', 'DomainB_interpro', 'intdb']]
    
    return dk


def consensus(interolog, domain):

    final = interolog.merge(domain, on=['Host_Protein', 'Pathogen_Protein'])

    return final

def add_results(data):
    pp =connection('hpinet_results')
    name = f"hpinet{str(round(time.time() * 1000))}results"
    ptable = pp[name]
    ptable.insert_many(data)

    return name

def add_noresults(data):
    pp =connection('hpinet_results')
    name = f"hpinet{str(round(time.time() * 1000))}results"
    ptable = pp[name]
    ptable.insert_one({'result':data})

    return name

def main():

    options, unknownargs = parser.parse_known_args()
    
    results_list ={}
   
    intTables = options.ppitables.replace(' ','').split(",")
    domt = options.domdb.replace(' ','').split(",")

    domtables = tuple([word.upper() for word in domt])
    if options.genes:
        genes = open(os.path.join(os.getcwd(), "src/genes.txt")).readlines()[0]
    
    hproteins = None
    pproteins = None
    
    if options.idt == 'host':
        if options.genes:
            hproteins = genes.replace(' ','').split(",")
    if options.idt == 'pathogen':
        if options.genes:
            pproteins = genes.replace(' ','').split(",")
    
    if options.method == 'interolog':
        for hpd in intTables:
            host_blast = filter_blast(options.blastdb,options.hosttable,options.hi,options.hc,options.he,hpd, genes=hproteins)
            pathogen_blast = filter_blast(options.blastdb,options.pathogentable,options.pi,options.pc,options.pe,hpd, genes=pproteins)
            
            hd = hpd
            
        
            if  isinstance(pathogen_blast, pd.DataFrame) and isinstance(host_blast, pd.DataFrame):
                results = ppi(hd,pathogen_blast,host_blast)
                results.reset_index(inplace=True, drop=True)
                results_list[hpd]=results
            
        try:
            final = pd.concat(results_list.values(),ignore_index=True)
            final.reset_index(inplace=True, drop=True)
            rid = add_results(final.to_dict('records'))
            print(rid)
        except Exception:
            rid = add_noresults("no results")
            print(rid)

    elif options.method == "domain":
        hspecies = options.hosttable.split("_")[1]
        pspecies = options.pathogentable.split("_")[1]

    elif options.method == 'consensus':
        hspecies = options.hosttable.split("_")[1]
        pspecies = options.pathogentable.split("_")[1]
        table = f"{hspecies}_{pspecies}"

        if hproteins == None and pproteins == None:
            domain_result = filter_domain(table, domdb=domtables)
        
        elif hproteins !=None and pproteins==None:
            domain_result = filter_domain( table, idt = options.idt, genes=hproteins,domdb=domtables)

        elif hproteins ==None and pproteins !=None:
            domain_result = filter_domain( table, idt = options.idt, genes=pproteins,domdb=domtables)

        for hpd in intTables:
            host_blast = filter_blast(options.blastdb,options.hosttable,options.hi,options.hc,options.he,hpd, genes=hproteins)
            # host_blast = filter_blast(options.hosttable,options.hi,options.hc,options.he,hpd, genes=hproteins)
            pathogen_blast = filter_blast(options.blastdb,options.pathogentable,options.pi,options.pc,options.pe,hpd, genes=pproteins)
            # pathogen_blast = filter_blast(options.pathogentable,options.pi,options.pc,options.pe,hpd, genes=pproteins)
            hd =hpd+'s'
        
            if  isinstance(pathogen_blast, pd.DataFrame) and isinstance(host_blast, pd.DataFrame):
                results = ppi(hd,pathogen_blast,host_blast)
                results.reset_index(inplace=True, drop=True)
                results_list[hpd]=results
            
            
        try:
            final = pd.concat(results_list.values(),ignore_index=True)
            con_final = consensus(interolog=final, domain=domain_result)
            con_final.reset_index(inplace=True, drop=True)
            rid = add_results(con_final.to_dict('records'))

            print(rid)

            file_path= os.path.join(os.getcwd(), "src/genes.txt")

            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            rid = add_noresults("no results")
            print(rid)

        

if __name__ == '__main__':
    main()

