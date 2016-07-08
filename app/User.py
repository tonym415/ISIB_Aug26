#!C:\Python34\python.exe
"""
The User class is used to handle all functions related to the User
@author: Tony Moses
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
    """
    User Class
    """
    _context = [__name__ == "__main__"]

    def __init__(self, *userInfo, **kwargs):
        """ initalize User object """
        super(User, self).__init__()
        for dictionary in userInfo:
            for key in dictionary:
                # add prefix to differentiate vars in class dictionary
                setattr(self, "user_" + key, dictionary[key])

        for key in kwargs:
            setattr(self, key, kwargs[key])

    def sanitizeParams(self):
        params = {k[5:]: v
                for k, v in self.__dict__.items()
                if k.startswith('user_')}

        self.log("Params:" + str(params) + "\n\n")
        return params

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
        self.log("Statement: " + str(self.cursor.statement))
        # get metadata along with basic data
        query = ("SELECT meta_name, data FROM users_metadata WHERE user_id = "
                 "%(user_id)s AND meta_name IN ('avatar','theme')")
        metaList = self.executeQuery(query, retDict)
        self.log(str(metaList))
        self.log("Statement: " + str(self.cursor.statement))
        self.log("Rows: " + str(self.cursor.rowcount))
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

        retDict = self.executeQuery(query, params)
        # sys.stderr.write(self.cursor.statement)
        # retDict = self.executeQuery(query, params)[0]
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
        # self.log("Return Dict: %s\n" % (str(retDict)))
        if meta:
            # get metadata along with basic data
            query = ("SELECT meta_name, data FROM users_metadata "
                     "WHERE user_id = %(user_id)s")
            metaList = self.executeQuery(query, params)
            self.log("Meta Dict: %s\n" % (str(metaList)))
            for rec in metaList:
                # self.log("Rec in Dict: %s\n" % (str(rec)))
                retDict[rec["meta_name"]] = rec["data"]

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
            self.setInitMeta()
            returnObj = self.getUserByID()
        except self.db2._connector.IntegrityError as err:
            returnObj['message'] = "Error: {}".format(err)

        return returnObj

    def setInitMeta(self, avatar=None):
        params = self.sanitizeParams()
        obj = {'user_id': params['user_id'], 'data': 'redmond', 'meta_name': 'theme'}
        # insert default theme for user
        query = ("INSERT INTO users_metadata (user_id, meta_name, data) "
                " VALUES (%(user_id)s, %(meta_name)s, %(data)s)")
        self.executeModifyQuery(query, obj)

        if avatar:
            if avatar[0] == 'FB':
                obj['meta_name'] = "avatar"
                obj['data'] = "https://graph.facebook.com/{0}/picture?type=normal".format(avatar[1])
                self.executeModifyQuery(query, obj)

    def isValidUser(self, info=None):
        """ determine if user is valid based on username/password """
        validUser = False
        # userInfo should be provided by calling function
        if info:
            userInfo = info
        else:
            userInfo = self.getUserByName()[0]

        self.log("UInfo:" + str(userInfo) + "\n")
        if 'error' in userInfo:
            validUser = False
        elif userInfo['password'] == "None":
            # check alternate credentials
            self.log("User SM Login\n")
        else:
            try:
                # test given password against database password
                hashed_pw = userInfo['password']
                validUser = pbkdf2_sha256.verify(self.user_password, hashed_pw)
            except Exception as e:
                # if password don't jive user return false value for validUser
                pass

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


    def resolveUserAccounts(self):
        params = self.sanitizeParams()
        query = ("SELECT username, first_name, last_name, user_id, created FROM users WHERE email IN (SELECT email FROM users WHERE user_id = %(user_id)s)")
        users = self.executeQuery(query, params,True)

        return users

    def fbMerge(self):
        pass

    def facebookLogin(self):
        params = self.sanitizeParams()
        # get current user info from alt_auth table
        query = ("SELECT * FROM alt_auth WHERE auth_id = %(fb_id)s")
        user = self.executeQuery(query, params,True)

        if not user:
            # if user not found...create user
            params['username'] = params['email'].split("@")[0]

            # check system for duplicates for possible merge of existing accounts
            query = ("SELECT * FROM users WHERE username = %(username)s AND password IS NOT NULL")
            duplicates = self.executeQuery(query, params,True)
            self.log("Dups: %s" % duplicates)

            # if there are duplicate usernames...set merged value to 0
            # as in "no the accounts have not been merged"
            params['merged'] = (-1, 0)[duplicates]

            # insert system user
            query = ("INSERT INTO users (first_name, last_name, username, email, merged) "
                     " VALUES (%(first_name)s, %(last_name)s, %(username)s, %(email)s, %(merged)s)")
            user = self.executeModifyQuery(query, params)
            params['user_id'] = user['id']

            # add meta data for new user
            setattr(self, "user_user_id", user['id'])
            setattr(self, "user_username", params['username'])
            self.setInitMeta(['FB', params['fb_id']])

            # insert into alternate authorization table
            query = ("INSERT INTO alt_auth (auth_id, description, user_id) VALUES (%(fb_id)s,'Facebook',%(user_id)s)")
            self.executeModifyQuery(query, params)
        else:
            self.log("USER: %s\n" % str(user))
            # set up getUserByID function
            setattr(self, "user_user_id", user[0]['user_id'])
            # call function to get user information (username)
            user = self.getUserByID(True)
            # set up getUserCookie function
            setattr(self, "user_username", user['username'])
        return self.returnAlternateLoginInfo(self.getUserCookie())

    def returnAlternateLoginInfo(self, cookieInfo):
        """ Add merge info to cookie data"""
        query = ("SELECT merged FROM alt_auth WHERE user_id = %(user_id)s")
        user = self.executeQuery(query, cookieInfo[0],True)

        # if query retuns info add data
        if user:
            cookieInfo[0]["merged"] = user[0]["merged"]
        return cookieInfo

if __name__ == "__main__":
    # info = {"username":"lj14thechampion","first_name":"B'Liahl","last_name":"Detwiler","user_id":72,"fb_id":"905954012853806","id":"fbLogin","email":"lj14thechampion@gmail.com"}
    info = {"email":"tonym415@gmail.com",
            "first_name":"Antonio",
            "last_name":"Moses",
            "id":"fbLogin",
            "fb_id":10207047199316309,
            "username": "tonym415",
            "function":"userFunctions"
            }
    # info = {"username": 'user',
            # "user_id": 49,
            # "password": 'password'}
    # """ valid user in db (DO NOT CHANGE: modify below)"""
    # info = {"confirm_password": "password", "first_name":
    #         "Antonio", "paypal_account": "tonym415", "password":
    #         "password", "email": "tonym415@gmail.com", "last_name":
    #         "Moses", "username": "tonym415"}

    """ remove "user_" prefix from data dict """
    u_info = {i: info[i]
              for i in info if i != 'function' and '_password' not in i}
    # print(info)

    print(User(u_info).facebookLogin())
    # print(User(u_info).getUserByID())
