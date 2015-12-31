#!C:\Python34\python.exe
"""
The Question class is used to handle all functions related to the Question table
"""
import os
import sys
sys.path.append(os.path.realpath(os.path.dirname(__file__)))
from lib.Entity import Entity


class Question(Entity):

    """ for category"""
    """ initalize User object """
    _context = [__name__ == "__main__"]

    def __init__(self, *userInfo, **kwargs):
        super(Question, self).__init__()
        for dictionary in userInfo:
            for key in dictionary:
                setattr(self, "user_" + key, dictionary[key])

        for key in kwargs:
            setattr(self, key, kwargs[key])

    def sanitizeParams(self):
        return {k[5:]: v
                for k, v in self.__dict__.items()
                if k.startswith('user')}

    def updateQuestion(self):
        """ update category with parameters """
        # get query params for this Category instance
        params = self.sanitizeParams()

        # check for the existence of subcategory
        hasSubs = [value for key, value in params.items() if "CategoryChk" in key]

        # get function to determine query
        if params['id'] == 'deleteQuestion':
            """ if we are 'deleting' a question we unset active in db """
            query = ("UPDATE questions SET active = 0 "
                     "WHERE category_id = %(category_id)s")

            if hasSubs:
                """ if the category is not a top level category """
                params = {"category_id": int(params['d_subCategory[]'][-1])}
            else:
                params = {"category_id": int(params['d_Category'])}

        elif params['id'] == 'adoptCategory':
            query = ("UPDATE question_categories SET parent_id = %(parent_id)s "
                     "WHERE category_id = %(category_id)s")

            if hasSubs:
                """ if the category is not a top level category """
                params = {"parent_id": int(params['a_subCategory[]'][-1]),
                          "category_id": params['a_Category']}
            else:
                params = {"parent_id": int(params['a_parentCategory']),
                          "category_id": params['a_Category']}

        elif params['id'] == 'renameCategory':
            query = ("UPDATE question_categories SET category = %(category)s "
                     "WHERE category_id = %(category_id)s")

            if hasSubs:
                """ if the category is not a top level category """
                params = {"category_id": int(params['r_subCategory[]'][-1]),
                          "category": params['r_newCategory']}
            else:
                params = {"category_id": int(params['r_currentCategory']),
                          "category": params['r_newCategory']}

        returnVal = self.executeModifyQuery(query, params)
        return {'success': self.cursor.lastrowid} if 'error' not in returnVal else {'error': returnVal}

    def newQuestion(self):
        """ insert new category with/without parent_id """
        query = ("INSERT INTO questions (category_id, question_text)"
                 " VALUES (%(category_id)s, %(question_text)s)")
        params = self.sanitizeParams()

        # check for the existence of subcategory
        hasSubs = [value for key, value in params.items() if "CategoryChk" in key]

        if hasSubs:
            """ if the category is not a top level category """
            cID = params['q_subCategory[]'] if type(params['q_subCategory[]']) != 'list' else params[
                'q_subCategory[]'][-1]
            params = {"category_id": int(cID),
                      "question_text": params['q_text']}
        else:
            params = {"category_id": int(params['q_category']),
                      "question_text": params['q_text']}

        returnVal = self.executeModifyQuery(query, params)
        return {'success': self.cursor.lastrowid} if 'error' not in returnVal else {'error': returnVal}

    def getQuestionsByCat(self):
        """ get user information by name """
        query = ("SELECT question_id, question_text FROM  questions "
                 "WHERE category_id = %(category_id)s and active = 1")

        params = self.sanitizeParams()
        return self.executeQuery(query, params)

    def getAllQuestions(self):
        """ get user information by name """
        query = """SELECT category_id, question_text
                FROM  questions WHERE active = 1
            """
        return self.executeQuery(query, ())


if __name__ == "__main__":
    info = {
        "id": "createQuestion",
        "q_category": "2",
        "q_parentCategoryChk": "on",
        "q_subCategory[]": "40",
        "q_text": "Was the movies Antman good?",
        "function": "CQ"
    }

    """ modify user information for testing """
    # info['stuff'] = "stuff"

    print(Question(info).newQuestion())
