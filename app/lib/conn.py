#!C:\Python34\python.exe -u
import os
import inspect
def connStr():
    """ Returns the connection parameters for the database """
    return {
        'user': 'webuser',
        'password': 'webuser',
        'host': '54.175.67.82',
        'database': 'debate'
    }

if __name__ == "__main__":
    #pass
    print(connStr())
