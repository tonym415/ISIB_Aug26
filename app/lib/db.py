#!C:\Python34\python.exe -m
"""
db is the database object used for all connections
"""
import os
import sys
#sys.path.append(os.path.realpath(os.path.dirname(__file__)))

import mysql.connector
from mysql.connector import errorcode
import conn


class db(object):

    """docstring for db"""

    _config = conn.connStr()
    _cnx = None
    _cur = None

    def __init__(self):
        try:
            self._cnx = mysql.connector.connect(**self._config)
            self._cur = self._cnx.cursor()
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                print("Something is wrong with your user name or password")
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                print("Database does not exist")
            else:
                print(err)
            self._cnx.close()

    def query(self, query, params=None):
        return self._cur.execute(query, params)

    def __del__(self):
        self._cnx.close()


if __name__ == "__main__":
    d = db()
    query = ("SELECT * FROM `users` WHERE 1")
    cursor = db().query(query)
    print(type(cursor))
    # rows = cursor.fetchall()
    # for row in rows:
    #     print(row)
