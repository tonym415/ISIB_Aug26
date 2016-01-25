#!/usr/bin/python
"""
This script handles all of the processing of the debate site
@author: Tony Moses
"""
import cgi
#from formMockup import formMockup
import json
import cgitb
import os
import traceback


# next 3 lines not for production
if "REQUEST_METHOD" not in os.environ:
    import sys
    sys.path.append(os.path.realpath(os.path.dirname(__file__)))
from app.Log import *
from app.User import *
from app.Category import *
from app.Question import *
from app.Game import *
from app.Feedback import *


cgitb.enable()

# global fieldstorage object
FSTOR = None

def logAction(fs):
    """
    function logs player actions
    """
    l = {}
    if 'page' in fs.keys():
        l = Log(fs).getAllLogs()
    elif 'user_id' in fs.keys():
        l = Log(fs).newLog()
    returnJson(l)

def testDep(data):
    """ test function for class functionality (not needed for production) """
    u = User(data)
    returnJson(dir(u), False)


def sendHeaders(ctype="text/html"):
    """ Sends headers """
    print("Content-Type: %s; charset=utf-8\n\n" % ctype)


def returnJson(data, toJSON=True):
    """ Takes data (string) send back return value (JSON by default)"""
    if not toJSON:
        sendHeaders()
    else:
        sendHeaders("application/json")

    print(json.dumps(data, default=str))


def showParams(fs):
    returnJson({'funcParams': fs})


def getAllUsers(fs):
    returnJson(User(fs).getAllUsers())


def submitUserInfo(fs):
    """ submit user info to database """
    returnObj = {'error': ''}
    if 'oper' in fs:
        uInfo = User(fs).updateUser()
    else:
        uInfo = User(fs).submitUser()

    # handle return values
    if uInfo['user_id'] != 0:
        returnObj = uInfo
    else:
        returnObj['error'] = uInfo['message']

    returnJson(returnObj)


def userFunctions(fs):
    """ test function for class functionality (not needed for production) """
    user_info = {}
    if "id" in fs:
        if fs['id'] == 'login':
            """ create a json object noting user_info """
            valid_user = User(fs).isValidUser()
            if valid_user:
                user_info = User(fs).getUserCookie()
        elif fs['id'] == 'profile':
            user_info = User(fs).getUserCookie()
        elif fs['id'] == 'tr':
            user_info = User(fs).getUserTrackRecord()
    returnJson(user_info)


def validateUser(fs):
    """ test function for class functionality (not needed for production) """
    user_info = {}
    if "username" in fs:
        """ create a json object noting user_info """
        u = User(fs)
        valid_user = u.isValidUser()
        if valid_user:
            user_info = u.getUserByName()

            # do not send back hashed password
            del user_info[0]['password']
    returnJson(user_info)


def userAvailabilityCheck(fs):
    """ test function for class functionality (not needed for production) """
    availability = {}

    if "username" in fs:
        """ create a json object noting availability """
        availability["available"] = str(User(fs).isUser())

    returnJson(availability)


def feedback(fs):
    """ send user responses to admin """
    returnVal = {}
    if "id" in fs:
        if fs['id'] == 'frmFeedback':
            try:
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText

                fromaddr = fs.get('email')
                category = fs.get('category')
                name = fs.get('name')
                msgBody = fs.get('message')

                toaddr = 'tonym415@gmail.com'
                heading = " Concerns from %s" % name

                if category != '0':
                    category = Feedback(fs).getCategoryByID()[0]['fbc_name']
                    subject = 'Category: ' + category + " " + heading
                else:
                    subject = 'Uncategorized ' + heading

                msg = MIMEMultipart()
                msg['From'] = fromaddr
                msg['To'] = toaddr
                msg['Subject'] = subject

                msg.attach(MIMEText(msgBody, 'plain'))

                server = smtplib.SMTP('localhost')
                text = msg.as_string()
                server.sendmail(fromaddr, toaddr, text)
                server.quit()
            except Exception as e:
                returnJson({'error': "{}".format(e)})
                exit()
            # if everything worked send data back for custom confirmation
            returnVal['title'] = "Success"
            returnVal['message'] = "%s, your message has been sent. Please expect a response soon" % name
            # sys.stderr.write("{}".format(locals()))
            returnJson(returnVal)
        elif fs['id'] == 'feedback_categories':
            returnJson(Feedback(fs).getAllCategories())


def modifyCategory(fs):
    """ modify fs to be properly consumed by Category() """
    # check for the existence of subcategory
    c = None
    if fs['id'] in ["deleteCategory", 'renameCategory', 'adoptCategory']:
        """ deactivates Category """
        c = Category(fs).updateCategory()
    elif fs['id'] == "createCategory":
        """ Creates new Category """
        c = Category(fs).newCategory()

    returnJson(c)


def getCategories():
    """ gathers all categories """
    returnJson({"categories": Category().getAllCategories()})


def modifyQuestion(fs):
    """ modify fs to be properly consumed by Category() """
    # check for the existence of subcategory
    q = None
    if fs['id'] in ["deleteQuestion", 'editQuestion']:
        """ deactivates Category """
        q = Question(fs).updateQuestion()
    elif fs['id'] == "createQuestion":
        """ Creates new Category """
        q = Question(fs).newQuestion()

    returnJson(q)


def getCategoryQuestionsByID(fs):
    returnObj = {}
    q = Question(fs).getQuestionsByCat()
    try:
        if 'error' not in q[0].keys():
            returnObj['questions'] = q
        else:
            returnObj = q
    except KeyError as e:
        returnObj = {'error': {
            'error': 'None',
            'msg': 'No question are available for this category'
        }}

    returnJson(returnObj)


def gameFunctions(fs):
    returnObj = {}
    if 'id' in fs:
        # id tells what sub function to perform
        if fs['id'] in ['random', 'All', 'CategoryOnly', 'RandomQuestion']:
            # counter = 0 indicates first time submitting params
            if fs['counter'] == '0':
                returnObj = Game(fs).addToQueue()
            else:
                # counter > 0 indicates checking for game
                # get players from queue
                data = Game(fs).getGame()
                # send return data
                returnObj = data

                if data['game_id']:
                    # if queue properly populated
                    returnObj['status'] = 'complete'
                else:
                    # if queue not properly populated
                    returnObj['status'] = 'pending'
        elif fs['id'] == 'commentPoll':
            # get comments from players from game
            data = Game(fs).getComments()
            totPlayers = Game(fs).getTotalPlayers()

            # send return data
            returnObj['users'] = data
            returnObj['pending'] = totPlayers - len(data)
            if not data or len(data) < totPlayers:  # if no data returned
                # if queue not properly populated
                returnObj['status'] = 'pending'
            else:
                    # if queue properly populated
                returnObj['status'] = 'complete'
        elif fs['id'] == 'votePoll':
            # total number of players in the game
            totPlayers = Game(fs).getTotalPlayers()

            # get votes from players from game
            data = Game(fs).getVotes()

            # send return data
            returnObj['users'] = data
            returnObj['pending'] = totPlayers - len(data)
            if not data or len(data) < totPlayers:  # if no data returned
                # if queue not properly populated
                returnObj['status'] = 'pending'
            else:
                # if queue properly populated
                returnObj['status'] = 'complete'
                # end game
                Game(fs).endGame()

        elif fs['id'] == 'debateVote':
            # submit vote
            returnObj = Game(fs).submitVote()
        elif fs['id'] in ['getMetaData']:
            returnObj = Game(fs).getMetaData()
        elif fs['id'] in ['cancelGame']:
            # cancel game search
            returnObj = Game(fs).removeFromQueue()
        elif fs['id'] in ['gameUI']:
            # submit game
            returnObj = Game(fs).submitThoughts()

    returnJson(returnObj)


def profileFunctions(fs):
    returnObj = {}
    if 'id' in fs.keys():
        if fs['id'] == 'profile':
            returnObj['data'] = User(fs).profileUpdate(FSTOR)
        elif fs['id'] == 'getUser':
            returnObj['data'] = User(fs).getUserByID(True)
    returnJson(returnObj)


def doFunc(fStor):
    """ Deciphers function to run based on POSTed parameters
        Executes the desired function with appropriate parameters
    """
    fStor = cgiFieldStorageToDict(fStor)
    funcName = fStor['function']
    """ sanitize store for use in classes """
    unused_members = ['function', '_password']
    fStor = {i: fStor[i] for i in fStor if i not in unused_members}

    if funcName in ["CQ", "EQ", "DQ"]:
        globals()['modifyQuestion'](fStor)
    elif funcName in ["CC", "RC", "DC", "AC"]:
        globals()['modifyCategory'](fStor)
    elif funcName in ["GQ"]:
        globals()['getCategoryQuestionsByID'](fStor)
    elif funcName in ["GC"]:
        globals()['getCategories']()
    elif funcName in ["GAU"]:
        globals()['getAllUsers'](fStor)
    elif funcName in ["VU", 'TRU', "GCU"]:
        globals()['userFunctions'](fStor)
    elif funcName in ["SUI", "UU"]:
        globals()['submitUserInfo'](fStor)
    elif funcName in ["TD"]:
        globals()['testDep'](fStor)
    elif funcName in ["UAC"]:
        globals()['userAvailabilityCheck'](fStor)
    elif funcName in ["GMD", "GG", "CG", "SUG", "SVG", "GCG", "GVG"]:
        globals()['gameFunctions'](fStor)
    elif funcName in ["FB", "FBC"]:
        globals()['feedback'](fStor)
    elif funcName in ["LOG", 'GL']:
        globals()['logAction'](fStor)
    elif funcName in ['GUP', "UP", "UP"]:
        globals()['profileFunctions'](fStor)
    else:
        globals()['showParams'](fStor)


def cgiFieldStorageToDict(fieldstorage):
    """ Get a plain dictionary from cgi.FieldStorage """
    params = {}
    for key in fieldstorage.keys():
        params[key] = fieldstorage.getvalue(key)
    return params


def main():
    """ Self test this module using hardcoded data """
    # form = formMockup(id="gameParameters",
    #                   p_paramCategory="1",
    #                   paramQuestions="8",
    #                   timeLimit="2",
    #                   wager="1",
    #                   user_id="36",
    #                   function="GG",
    #                   counter="2")

    #form = formMockup(
    #       id="votePoll",
    #       game_id=7,
    #       function="GVG",
    #       counter=1)
    """ valid user in db (DO NOT CHANGE: modify below)"""
    # form = formMockup(function="SUI", confirm_password="password",
    #                   first_name="Antonio", paypal_account="tonym415",
    #                   password="password", email="tonym415@gmail",
    #                   last_name="Moses", username="tonym415")
    #doFunc(form)

if "REQUEST_METHOD" in os.environ:
    FSTOR = cgi.FieldStorage()
    if 'function' in FSTOR.keys():
        # run function depending on given values
        doFunc(FSTOR)
else:
    main()
