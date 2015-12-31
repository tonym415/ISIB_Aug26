#!C:\Python34\python.exe
"""
The User class is used to handle all functions related to the User
"""
import os
import sys
sys.path.append(os.path.realpath(os.path.dirname(__file__)))

from lib.Entity import Entity


class Game(Entity):

    """ for category"""
    """ initalize User object """
    _context = [__name__ == "__main__"]

    def __init__(self, *userInfo, **kwargs):
        super(Game, self).__init__()
        for dictionary in userInfo:
            for key in dictionary:
                setattr(self, "user_" + key, dictionary[key])

        for key in kwargs:
            setattr(self, key, kwargs[key])

    def sanitizeParams(self):
        params = {k[5:]: v
                  for k, v in self.__dict__.items()
                  if k.startswith('user')}

        if "p_paramCategory" not in params.keys():
            params['category_id'] = 0
        else:
            params['category_id'] = params["p_paramCategory"]
            params.pop('p_paramCategory')
        if "p_subCategory" in params.keys():
            params['category_id'] = params["p_subCategory"]
            params.pop("p_subCategory")
        if "paramQuestions" not in params:
            params['paramQuestions'] = 0
        if "wager" not in params:
            params['wager'] = 0
        if "timeLimit" not in params:
            params['timeLimit'] = 0

        return params

    def removeFromQueue(self):
        """ add user params to queue"""
        query = ("UPDATE game_queue SET active = 0 WHERE queue_id = %(queue_id)s")
        params = self.sanitizeParams()
        return self.executeModifyQuery(query, params)

    def addToQueue(self):
        """ add user params to queue"""
        returnDict = {}
        try:
            # load params
            params = self.sanitizeParams()
            query = ("INSERT INTO game_queue (user_id, category_id, question_id, wager_id, "
                     "time_id) VALUES (%(user_id)s, %(category_id)s, %(paramQuestions)s, %(wager)s, "
                     "%(timeLimit)s)")
            returnVal = self.executeModifyQuery(query, params)
            query = ("SELECT * FROM game_queue WHERE queue_id = %s")
            returnDict['queue'] = self.executeQuery(query, (self.cursor.lastrowid,))[0]
        except Exception as e:
            returnDict['error'] = "{}".format(e)
            returnDict['stm'] = self.cursor.statement

        return returnDict

    # def getPlayerQueue(self):
    #     """ get all user in queue ready for game """
    #     query = ("SELECT queue_id, user_id, game_queue.category_id, game_queue.question_id, "
    #              "game_queue.wager_id, game_queue.time_id, active FROM "
    #              "game_queue JOIN  (SELECT category_id, question_id, wager_id, time_id FROM "
    #              "game_queue WHERE active = 1 GROUP BY category_id, question_id, wager_id, "
    #              "time_id HAVING count(*) >= 3) AS sub ON "
    #              "(game_queue.category_id=sub.category_id) AND "
    #              "(game_queue.question_id=sub.question_id) AND "
    #              "(game_queue.wager_id=sub.wager_id) "
    #              "AND(game_queue.time_id=sub.time_id)")
    #     return self.executeQuery(query, (), True)

    def getQueuedUsers(self):
        """ get available user in queue """
        returnObj = {}
        params = self.sanitizeParams()
        query = ("SELECT queue_id, game_id, user_id FROM game_queue WHERE "
                 "question_id= %(paramQuestions)s and wager_id = %(wager)s "
                 "and time_id = %(timeLimit)s and category_id = %(category_id)s "
                 "and active = 1 limit 0, 3")
        return self.executeQuery(query, params, True)

    def getGameID(self):
        """ get next game_id """
        query = ("SELECT COALESCE(MAX(game_id), 0) + 1 as game_id FROM game WHERE 1")
        return self.executeQuery(query, ())[0]['game_id']

    def submitVote(self):
        params = self.sanitizeParams()
        query = ("UPDATE game SET hasVoted = 1 WHERE "
                 "user_id = %(user_id)s and game_id = %(game_id)s")
        self.executeModifyQuery(query, params)

        query = ("UPDATE game SET votes = votes + 1 WHERE "
                 "user_id = %(vote_id)s and game_id = %(game_id)s")
        self.executeModifyQuery(query, params)
        return {"status": "Success"}

    def getVotes(self):
        params = self.sanitizeParams()
        playerVotes = []

        # get all comments for the game
        query = ("SELECT user_id, username, votes FROM game INNER JOIN users "
                 "USING(user_id) WHERE game_id = %(game_id)s AND hasVoted = 1")
        playerVotes = self.executeQuery(query, params)

        # get user avatars
        for uinfo in playerVotes:
            query = (
                "SELECT data FROM users_metadata WHERE meta_name = 'avatar' "
                "AND user_id = %(user_id)s")
            data = self.executeQuery(query, uinfo, True)
            if data:
                uinfo['avatar'] = data[0]['data']
            else:
                uinfo['avatar'] = ""
        return playerVotes

    def getCategory(self):
        """ get random question  """
        params = self.sanitizeParams()
        stmWhere = " "
        # if a category is available choose question from category pool
        if params['category_id'] != 0:
            stmWhere = " q.category_id = %(category_id)s AND "

        query = ("SELECT question_id, q.category_id, question_text as text "
                 "from questions q INNER JOIN question_categories qc "
                 "USING(category_id) WHERE %s q.active = 1 ORDER BY RAND() LIMIT 1")
        query = query % stmWhere

        return self.executeQuery(query, params, True)[0]

    def getWager(self):
        """ get random question  """
        params = self.sanitizeParams()
        stmWhere = " "
        # if a category is available choose question from category pool
        if params['wager'] != 0:
            stmWhere = " credit_id = %(wager)s AND "

        query = ("SELECT credit_id, credit_value FROM credit_options "
                 "WHERE %s active = 1 ORDER BY RAND() LIMIT 1")
        query = query % stmWhere

        return self.executeQuery(query, params, True)[0]

    def getTimeLimit(self):
        """ get random question  """
        params = self.sanitizeParams()
        stmWhere = " "
        # if a category is available choose question from category pool
        if params['timeLimit'] != 0:
            stmWhere = " time_id = %(timeLimit)s AND "

        query = ("SELECT time_id, time_in_seconds FROM time_options "
                 "WHERE %s active = 1 ORDER BY RAND() LIMIT 1")
        query = query % stmWhere

        return self.executeQuery(query, params, True)[0]

    def getGame(self):
        # game id
        g_id = None

        # return object
        returnDict = {'game_id': g_id}

        # get queued users
        users = self.getQueuedUsers()
        if len(users) >= 3:
            # set game_id
            g_id = self.getGameID()
            params = self.sanitizeParams()

            returnDict['game_id'] = g_id
            returnDict['users'] = []

            # game specific creation based on parameters
            category = self.getCategory()   # [{question_id}, {text}, {category_id}]
            wager = self.getWager()         # [{credit_id}, {credit_value}]
            timeLimit = self.getTimeLimit()  # [{time_id}, {time_in_seconds}]

            # set return object
            returnDict['question'] = category['text']
            returnDict['wager'] = wager['credit_value']
            returnDict['time'] = timeLimit['time_in_seconds']

            # move users from queue to game
            for qUser in users:
                qUser['category_id'] = category['category_id']
                qUser['question_id'] = category['question_id']
                qUser['wager_id'] = wager['credit_id']
                qUser['time_id'] = timeLimit['time_id']
                qUser['game_id'] = g_id
                # update queue
                query = ("UPDATE game_queue SET game_id = %(game_id)s, "
                         "category_id = %(category_id)s, question_id = %(question_id)s, "
                         "wager_id = %(wager_id)s, time_id = %(time_id)s "
                         "WHERE queue_id = %(queue_id)s")
                self.executeModifyQuery(query, qUser)
                # update game
                query = ("INSERT INTO game (user_id, game_id) VALUES "
                         "(%(user_id)s, %(game_id)s)")
                self.executeModifyQuery(query, qUser)

                # get user info
                query = ("SELECT username FROM users WHERE user_id = %(user_id)s ")
                user = self.executeQuery(query, qUser)[0]
                query = ("SELECT data as avatar FROM users_metadata WHERE "
                         "user_id = %(user_id)s AND meta_name = 'avatar'")
                data = self.executeQuery(query, qUser, True)
                if data:
                    user['avatar'] = data[0]['avatar']
                else:
                    user['avatar'] = ""
                returnDict['users'].append(user)

        return returnDict

    def endGame(self):
        params = self.sanitizeParams()
        query = ("UPDATE game SET active = 0 WHERE "
                 "game_id = %(game_id)s")
        self.executeModifyQuery(query, params)
        query = ("UPDATE game_queue SET active = 0 WHERE "
                 "game_id = %(game_id)s")
        self.executeModifyQuery(query, params)

        return {"status": "Success"}

    def submitThoughts(self):
        params = self.sanitizeParams()
        query = ("UPDATE game SET thoughts = %(thoughts)s WHERE "
                 "user_id = %(user_id)s and game_id = %(game_id)s")
        self.executeModifyQuery(query, params)
        return {"status": "Success"}

    def getTotalPlayers(self):
        params = self.sanitizeParams()
        query = ("SELECT user_id FROM game  WHERE game_id = %(game_id)s")
        self.executeQuery(query, params)
        return self.cursor.rowcount

    def getComments(self):
        params = self.sanitizeParams()
        playerResponses = []

        # get all comments for the game
        query = ("SELECT user_id, username, thoughts FROM game INNER JOIN users "
                 "USING(user_id) WHERE game_id = %(game_id)s and thoughts IS NOT NULL")
        playerResponses = self.executeQuery(query, params)

        # get user avatars
        for uinfo in playerResponses:
            query = (
                "SELECT data FROM users_metadata WHERE meta_name = 'avatar' "
                "AND user_id = %(user_id)s")
            data = self.executeQuery(query, uinfo, True)
            if data:
                uinfo['avatar'] = data[0]['data']
            else:
                uinfo['avatar'] = ""
        return playerResponses

    def getMetaData(self):
        """ get metadata """
        returnObj = {}
        query = ("SELECT time_id, time_in_seconds FROM time_options WHERE active = 1")
        returnObj['times'] = self.executeQuery(query, ())
        query = ("SELECT credit_id, credit_value FROM credit_options WHERE active = 1")
        returnObj['wagers'] = self.executeQuery(query, ())
        return returnObj

if __name__ == "__main__":
    # info = {
    #     'id': 'gameUI',
    #     'thoughts': 'whatever',
    #     'game_id': '1',
    #     'user_id': '36'
    # }
    info = {
        'id': 'gameParametersCategoryOnly',
        'user_id': '36',
        'function': 'GG',
        'counter': '0'
    }
    """ modify user information for testing """
    # info['stuff'] = "stuff"

    print(Game(info).addToQueue())
    print(Game(info).getGame())
