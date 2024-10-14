from pymongo import MongoClient
import pandas as pd
import sqlite3
from sqlite3 import Error
import argparse
import time
import os


ver= '0.0.1'

parser = argparse.ArgumentParser(description="""apidomain {} : a python based domain-based host-pathogen identification script""".format(ver),
usage="""%(prog)s [options]""",
epilog="""Written by David Guevara (david.guevara@usu.edu),
Kaundal Bioinformatics Lab, Utah State University,
Released under the terms of GNU General Public Licence v3""",    
formatter_class=argparse.RawTextHelpFormatter )

parser.add_argument("--version", action="version", version= 'apidomain (version {})'.format(ver), help= "Show version information and exit")
parser.add_argument("--dbfile", dest='dbfile',help="Host and pathogen domain database file")
parser.add_argument("--table", dest='table', help="Host-pathogen result table")
parser.add_argument("--page", dest='page', type=int, default=0, help="Page of results")
parser.add_argument("--pagesize", dest='pagesize', type=int, default=500, help="Page size for results")
parser.add_argument('--domaindb', dest='domaindb', type=str, default='all', 
    help="""Provide comma-separated interaction database names. For example, '--domaindb 3did,iddi'.
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

def filter_domain(table, domaindb, page_size=500, page=0):
    conn = create_connection('/home/kaabil/apinetdbs/domain.sqlite')
    # query = "SELECT * FROM {} WHERE intdb IN {} LIMIT {} OFFSET {}".format(table, domaindb, page_size, page*page_size)
    query = "SELECT * FROM {} WHERE intdb IN {}".format(table, domaindb)
    result = conn.execute(query).fetchall()
    df= pd.DataFrame(result)
    df.columns = ['Host_Protein', 'Pathogen_Protein', 'ProteinA', 'ProteinB', 'Score', 'DomainA_name', 'DomainA_desc', 'DomainA_interpro', 'DomainB_name', 'DomainB_desc', 'DomainB_interpro', 'intdb']

    return df

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
   
    domt = options.domaindb.split(",")
    domtables = [word.lower() for word in domt]
    domtables = "','".join(domtables)
    domtables = "('" + domtables + "')"

    results = filter_domain(options.table, domtables, page_size=options.pagesize, page=options.page)
    if isinstance(results, pd.DataFrame):
        results.reset_index(inplace=True, drop=True)
    try:
        final = pd.concat(results_list.values(),ignore_index=True)
        final.reset_index(inplace=True, drop=True)
        rid = add_results(final.to_dict('records'))
        print(rid)
    except Exception:
        rid = add_noresults("no results")
        print(rid)
        

if __name__ == '__main__':
    main()

