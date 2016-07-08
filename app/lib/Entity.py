#!C:\Python34\python.exe
"""
The Entity base class is used to handle all functions related to the db manipulation
"""
import os
import sys
import json
from inspect import currentframe, getframeinfo
sys.path.append(os.path.realpath(os.path.dirname(__file__)))
import db2

class Entity(object):
    """ initalize db Entity object """
    _cnx = None

    def __init__(self, *info, **kwargs):
        self.db2 = db2
        self._cnx = self.db2.get_connection()
        self.cursor = self._cnx.cursor(buffered=True, dictionary=True)
        for dictionary in info:
            for key in dictionary:
                setattr(self, key, dictionary[key])

    def executeModifyQuery(self, query, params):
        returnDict = {}
        try:
            self.cursor.execute(query, params)
            self._cnx.commit()
            returnDict['id'] = self.cursor.lastrowid
        except Exception as e:
            returnDict['error'] = "{}".format(e)
            returnDict['stm'] = self.cursor.statement

        return returnDict

    def executeQuery(self, query, params, returnEmpty=False):
        returnDict = {}
        statement = ""
        try:
            self.cursor.execute(query, params)
            rowcount = self.cursor.rowcount
            statement = self.cursor.statement
            self.log("Result Count: %d\nResult Statement: %s" % (rowcount, statement))
            # self.log("Cursor status: %s" % (self.cursor.__dict__))
            if rowcount > 0:
                # stringifyData called to get convert unicode resultset
                returnDict = self.stringifyData(self.cursor.fetchall())
                 # returnDict = self.cursor.fetchall()
            elif returnEmpty:
                returnDict = {}
            else:
                raise Exception("Result Count: %d" % ( rowcount))
        except Exception as e:
            returnDict['error'] = "{}".format(e)
            returnDict['stm'] = statement

        return returnDict

    def stringifyData(self, data):
        #convert unicode resultset to string
        self.log("Orig Data: %s" % (data))
        newdata = []
        for d in data: # outer list
            newdict = {}
            for k, v in d.items(): # inner dict
                k = k.decode('utf-8')if type(k) is bytearray else str(k)
                v = v.decode('utf-8')if type(v) is bytearray else v
                newdict[k] = v
            newdata.append(newdict)

        self.log("New Data: %s" % (newdata))
        return newdata

    def getColNames(self, tableName):
        from mysql.connector import FieldFlag
        params = {}
        query = "SELECT * FROM %s" % tableName
        self.executeQuery(query, params)

        columns = []
        maxnamesize = 0
        for coldesc in self.cursor.description:
            coldesc = list(coldesc)
            coldesc[2:6] = []
            columns.append(coldesc[0])
            namesize = len(coldesc[0])
            if namesize > maxnamesize:
                maxnamesize = namesize

        return columns

    def log(self, string):
        # get calling function's info
        cf = currentframe().f_back
        lineNum = cf.f_lineno
        filename = getframeinfo(cf).filename
        sys.stderr.write(str(string) + "\t(File: %s Line: %s)\n\n" % (filename,lineNum))

if __name__ == "__main__":
    query = "SELECT  u.user_id, first_name, username, role, password, last_name, email, credit, wins, losses, paypal_account, u.created, active FROM users u LEFT JOIN roles r USING(role_id) LEFT JOIN users_metadata m ON u.user_id=m.user_id WHERE u.active = 1 AND u.username = 'user' AND meta_name = 'theme'"
    print(Entity().executeQuery(query,{}))
    # print(Entity().getColNames("users"))
