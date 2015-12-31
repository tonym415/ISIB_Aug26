#!C:\Python34\python.exe
"""
The User class is used to handle all functions related to the User
"""
import os
import io
import sys
import json
from math import ceil
from passlib.hash import pbkdf2_sha256
sys.path.append(os.path.realpath(os.path.dirname(__file__)))

from lib.Entity import Entity


class User(Entity):

    """ for User"""
    """ initalize User object """
    _context = [__name__ == "__main__"]

    def __init__(self, *userInfo, **kwargs):
        super(User, self).__init__()
        # self._cnx = lib.db2.get_connection()
        # self.cursor = self._cnx.cursor(buffered=True, dictionary=True)
        for dictionary in userInfo:
            for key in dictionary:
                # print('Key: %s' % key)
                setattr(self, "user_" + key, dictionary[key])

        for key in kwargs:
            setattr(self, key, kwargs[key])

    def sanitizeParams(self):
        return {k[5:]: v
                for k, v in self.__dict__.items()
                if k.startswith('user')}

    def getAllUsers(self):
        """ get user information by name """
        params = self.sanitizeParams()
        if 'page' in params.keys():  # for use with jqGrid
            ops = {
                'eq': '=',   # equal
                'ne': '<>',  # not equal
                'lt': '<',   # less than
                'le': '<=',  # less than or equal to
                'gt': '>',   # greater than
                'ge': '>=',  # greater than or equal to
                'bw': 'LIKE',  # begins with
                'bn': 'NOT LIKE',  # doesn't begin with
                'in': 'LIKE',  # is in
                'ni': 'NOT LIKE',  # is not in
                'ew': 'LIKE',  # ends with
                'en': 'NOT LIKE',  # doesn't end with
                'cn': 'LIKE',  # contains
                'nc': 'NOT LIKE'  # doesn't contain
            }

            def getWhereClause(col, oper, val):
                if oper == 'bw' or oper == 'bn':
                    val += '%'
                if oper == 'ew' or oper == 'en':
                    val += '%' + val
                if oper == 'cn' or oper == 'nc' or oper == 'in' or oper == 'ni':
                    val = '%' + val + '%'
                return "  %s %s '%s' " % (col, ops[oper], val)

            where = ""
            searchBool = params['_search'] if '_search' in params.keys() and params[
                '_search'] == 'true' else False
            searchField = params['searchField'] if 'searchField' in params.keys() else False
            searchOper = params['searchOper'] if 'searchOper' in params.keys() else False
            searchString = params['searchString'] if 'searchString' in params.keys() else False
            filters = params['filters'] if 'filters' in params.keys() else False

            params = {
                'page': int(params['page']),
                'limit': int(params['rows']),
                'sidx': params['sidx'] if 'sidx' in params.keys() else 1,
                'sord': params['sord']
            }
            if searchBool:
                where += " WHERE "
                if searchField:
                    where += getWhereClause(searchField, searchOper,
                                            searchString)
                elif filters:   # filter options
                    buildwhere = ""

                    # handle string value of cgi var
                    if isinstance(filters, str):
                        filters = json.loads(filters)

                    rules = filters['rules']
                    for idx in range(len(rules)):
                        field = rules[idx]['field']
                        op = rules[idx]['op']
                        data = rules[idx]['data']

                        if idx > 0:
                            buildwhere = filters['groupOp']
                            buildwhere += getWhereClause(field, op, data)
                        else:
                            buildwhere += getWhereClause(field, op, data)
                        where += buildwhere

            # get count of records
            query = ("SELECT COUNT(*) as count FROM  users "
                     "INNER JOIN roles USING(role_id) ")
            query += where
            row = self.executeQuery(query, ())
            count = row[0]['count']

            params['records'] = count
            params['total'] = ceil(count / params['limit']) if count > 0 else 0
            vPage = params['page']
            vLimit = params['limit']
            params['start'] = (vPage * vLimit) - vLimit
            query = ("SELECT user_id, first_name,last_name, email, "
                     "username, password , credit , wins, losses, "
                     "paypal_account, roles.role, "
                     "DATE_FORMAT(created, '%d %b %Y %T') as created, active  "
                     "FROM  users INNER JOIN roles USING(role_id) ")
            query += where
            query += " ORDER BY %(sidx)s %(sord)s LIMIT %(start)s, %(limit)s"
            params['rows'] = self.executeQuery(query, params)
            return params
        else:
            query = ("SELECT user_id, first_name,last_name, email,"
                     "username, password , credit , wins, losses,"
                     "paypal_account, roles.role, "
                     "DATE_FORMAT(created, '%d %b %Y %T') as created, active  "
                     "FROM  users INNER JOIN roles USING(role_id) WHERE 1")
            return self.executeQuery(query, ())

    def getUserCookie(self):
        params = self.sanitizeParams()
        """ get user information by name """
        # if no user is found by the given name return empty dictionary
        query = ("SELECT u.user_id, username, role FROM users u LEFT JOIN roles r "
                 "USING(role_id) LEFT JOIN users_metadata m ON u.user_id=m.user_id "
                 "WHERE u.active = 1 AND u.username = %(username)s AND "
                 "meta_name = 'theme'")

        retDict = self.executeQuery(query, params)[0]
        # get metadata along with basic data
        query = ("SELECT meta_name, data FROM users_metadata WHERE user_id = "
                 "%(user_id)s AND meta_name IN ('avatar','theme')")
        metaList = self.executeQuery(query, retDict)
        for rec in metaList:
            retDict[rec['meta_name']] = rec['data']

        return [retDict]

    def getUserByName(self, meta=False):
        """ get user information by name """
        # if no user is found by the given name return empty dictionary
        params = self.sanitizeParams()
        query = ("SELECT  u.user_id, first_name, username, role, password, "
                 "last_name, email, credit, wins, losses, paypal_account, "
                 "u.created, active FROM users u LEFT JOIN roles r USING(role_id) "
                 "LEFT JOIN users_metadata m ON u.user_id=m.user_id "
                 "WHERE u.active = 1 AND u.username = %(username)s AND "
                 "meta_name = 'theme'")

        retDict = self.executeQuery(query, params)[0]
        if meta:
            # get metadata along with basic data
            query = ("SELECT meta_name, data FROM users_metadata "
                     "WHERE user_id = %(user_id)s")
            metaList = self.executeQuery(query, params)
            for rec in metaList:
                retDict[rec['meta_name']] = rec['data']

        return retDict

    def getUserByID(self, meta=False):
        """ get user information by name """
        # if no user is found by the given name return empty dictionary
        params = self.sanitizeParams()
        query = ("SELECT  u.user_id, first_name, username, role, "
                 "last_name, email, credit, wins, losses, paypal_account, "
                 "u.created, active FROM users u LEFT JOIN roles r USING(role_id) "
                 "LEFT JOIN users_metadata m ON u.user_id=m.user_id "
                 "WHERE u.active = 1 AND u.user_id = %(user_id)s AND "
                 "meta_name = 'theme'")

        retDict = self.executeQuery(query, params)[0]
        if meta:
            # get metadata along with basic data
            query = ("SELECT meta_name, data FROM users_metadata "
                     "WHERE user_id = %(user_id)s")
            metaList = self.executeQuery(query, params)
            for rec in metaList:
                retDict[rec['meta_name']] = rec['data']

        return retDict

    def getUserTrackRecord(self):
        """ get user win/loss information """
        # if no user is found by the given name return empty dictionary
        params = self.sanitizeParams()
        query = ("SELECT  wins, losses FROM users WHERE user_id = %(user_id)s")
        return self.executeQuery(query, params)

    def updateUser(self):
        """ update user info """
        params = self.sanitizeParams()
        # rename id key for query string
        if 'id' in params.keys():
            params['user_id'] = params.pop('id')
            setattr(self, "user_user_id", params['user_id'])

        query = "UPDATE users SET"
        if params['oper'] == 'edit':
            for idx, k in enumerate(params):
                # remove unnecessary keys
                if k == 'oper' or k == 'user_id':
                    continue
                elif k == 'role':
                    # correct column name
                    k = 'role_id'
                    query += " %s = %r," % (k, params['role'])
                    continue
                elif k == 'active':
                    # correct values for columns
                    params[k] = (0, 1)[params[k] == "Yes"]
                query += " %s = %r," % (k, params[k])

            # remove trailing comma
            query = query[:-1] + " WHERE user_id = %(user_id)s"
        if params['oper'] == 'del':
            query += ' active = 0 WHERE user_id = %(user_id)s'

        self.executeModifyQuery(query, params)
        return {'user_id': self.cursor.lastrowid, 'stm': self.cursor.statement}

    def submitUser(self):
        """ inserts user info into the database """
        returnObj = {"user_id": 0}
        query = ("INSERT INTO  users"
                 "(first_name ,  last_name , email ,  username ,  password ,"
                 "paypal_account) VALUES (%(first_name)s, %(last_name)s,"
                 "%(email)s,%(username)s, %(password)s, %(paypal_account)s)")

        # extract only user info from class __dict__
        query_params = self.sanitizeParams()
        # hash password
        query_params['password'] = pbkdf2_sha256.encrypt(
            query_params['password'], rounds=200000, salt_size=16)
        try:
            uid = self.executeModifyQuery(query, query_params)
            uid = uid['id']
            # add user_id to current instance
            setattr(self, "user_user_id", uid)

            obj = {'user_id': uid, 'data': 'redmond', 'meta_name': 'theme'}
            # insert default theme for user
            query = ("INSERT INTO users_metadata (user_id, meta_name, data) "
                     " VALUES (%(user_id)s, %(meta_name)s, %(data)s)")
            self.executeModifyQuery(query, obj)
            returnObj = self.getUserByID()
        except self.db2._connector.IntegrityError as err:
            returnObj['message'] = "Error: {}".format(err)

        return returnObj

    def isValidUser(self, info=None):
        """ determine if user is valid based on username/password """
        # userInfo should be provided by calling function
        if info:
            userInfo = info
        else:
            userInfo = self.getUserByName()

        if 'error' in userInfo:
            validUser = False
        else:
            # test given password against database password
            hashed_pw = userInfo['password']
            validUser = pbkdf2_sha256.verify(self.user_password, hashed_pw)

        return validUser

    def isUser(self):
        """ checking for username availability """
        query = """SELECT  username  FROM  users  WHERE username = %s"""
        self.executeQuery(query, (self.user_username,))
        """ if number of rows fields is bigger them 0 that means it's NOT
         available returning 0, 1 otherwise
         """
        return (0, 1)[self.cursor.rowcount > 0]

    def profileUpdate(self, FIELDSTORE):
        # get column names for user table
        userCols = self.getColNames('users')
        params = self.sanitizeParams()

        # handle avatar
        if 'avatar' in FIELDSTORE.keys() and FIELDSTORE['avatar'].filename:

            fileItem = FIELDSTORE['avatar']
            fileName, fileExt = os.path.splitext(fileItem.filename)
            try:  # Windows needs stdio set for binary mode.
                import msvcrt
                msvcrt.setmode(0, os.O_BINARY)  # stdin  = 0
                msvcrt.setmode(1, os.O_BINARY)  # stdout = 1
            except ImportError:
                pass

            # strip leading path from file name to avoid directory traversal attacks
            # fname = os.path.basename(fileitem.filename)
            # create filename based on user_id and string
            fname = params['user_id'] + "_avatar" + fileExt.lower()
            # build absolute path to files directory
            base_path = os.path.dirname(__file__)
            dir_path = os.path.abspath(os.path.join(base_path, '..', '..', 'avatars'))

            open(os.path.join(dir_path, fname), 'wb').write(fileItem.file.read())
            message = 'The file "%s" was uploaded successfully' % fname

        # delete extraneous key
        del params['id']

        query = ("UPDATE users SET first_name = %(first_name)s, "
                 "last_name = %(last_name)s, email = %(email)s, "
                 "paypal_account = %(paypal_account)s")
        # add password query fragment if necessary
        if 'newpassword' in params.keys():
            query += ", password = %(password)s"
        query += " WHERE user_id = %(user_id)s"
        self.executeModifyQuery(query, params)

        # get data to enter in to the meta table for users
        metaCols = []
        for k in params.keys():
            metaObj = {}
            if k not in userCols:
                if k == 'file_id':
                    continue
                metaObj['user_id'] = params['user_id']
                metaObj['meta_name'] = k
                if k == 'avatar':
                    metaObj['data'] = fname
                else:
                    metaObj['data'] = params[k]
                metaCols.append(metaObj)

        retVal = {}
        for obj in metaCols:
            # check to see if record exists
            query = ("SELECT * FROM users_metadata WHERE user_id = %(user_id)s "
                     " and meta_name = %(meta_name)s")
            rec = self.executeQuery(query, obj, True)
            if rec:
                # if record exist update
                query = ("UPDATE users_metadata SET data = %(data)s WHERE "
                         " user_id = %(user_id)s and meta_name = %(meta_name)s")
            else:
                # if record does not exist insert
                query = ("INSERT INTO users_metadata (user_id, meta_name, data) "
                         "VALUES (%(user_id)s, %(meta_name)s, %(data)s)")

            retVal = self.executeModifyQuery(query, obj)

            if 'error' in retVal:
                return retVal

        return "Success"


if __name__ == "__main__":
    info = {}
    info = {"last_name": "jury",
            "first_name": "Sam",
            "email": "sam@gmail",
            "password": "password",
            "paypal_account": "sjury",
            "username": "sam",
            "function": "SUI",
            "id": "signup"}
    # """ valid user in db (DO NOT CHANGE: modify below)"""
    # info = {"confirm_password": "password", "first_name":
    #         "Antonio", "paypal_account": "tonym415", "password":
    #         "password", "email": "tonym415@gmail.com", "last_name":
    #         "Moses", "username": "tonym415"}

    """ modify user information for testing """
    # info['username'] = "user"
    # info['password'] = "password"

    """ remove  from data dict """
    u_info = {i: info[i]
              for i in info if i != 'function' and '_password' not in i}
    # print(info)

    # print(User(info).updateUser())
    u = User(u_info)
    # print(u.isValidUser())
    print(u.submitUser())
