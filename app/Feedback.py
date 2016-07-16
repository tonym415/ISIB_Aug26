#!C:\Python34\python.exe
"""
The User class is used to handle all functions related to the feedback
"""
import os
import sys
import json
sys.path.append(os.path.realpath(os.path.dirname(__file__)))

from lib.Entity import Entity


class Feedback(Entity):

    """ for category"""
    """ initalize Feedback object """
    _context = [__name__ == "__main__"]

    def __init__(self, *userInfo, **kwargs):
        super(Feedback, self).__init__()
        for dictionary in userInfo:
            for key in dictionary:
                setattr(self, "user_" + key, dictionary[key])

        for key in kwargs:
            setattr(self, key, kwargs[key])

    def sanitizeParams(self):
        return {k[5:]: v
                for k, v in self.__dict__.items()
                if k.startswith('user')}

    def getAllCategories(self):
        """ get all logs """
        query = ("SELECT fbc_id as id, fbc_name as value"
                 " FROM feedback_categories WHERE active = 1")
        return self.executeQuery(query, ())

    def getCategoryByID(self):
        """ get all logs """
        params = self.sanitizeParams()
        query = ("SELECT fbc_name FROM feedback_categories WHERE fbc_id = %(category)s")
        return self.executeQuery(query, params)


if __name__ == "__main__":
    info = {
        "category": 1
    }
    print(Feedback(info).getCategoryByID())
