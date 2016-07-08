#!C:\Python34\python.exe
"""
The User class is used to handle all functions related to the User
"""
import os
import sys
sys.path.append(os.path.realpath(os.path.dirname(__file__)))

from lib.Entity import Entity


class Category(Entity):

    """ for category"""
    """ initalize User object """
    _cnx = None
    _context = [__name__ == "__main__"]

    def __init__(self, *userInfo, **kwargs):
        super(Category, self).__init__()
        for dictionary in userInfo:
            for key in dictionary:
                setattr(self, "user_" + key, dictionary[key])

        for key in kwargs:
            setattr(self, key, kwargs[key])

    def sanitizeParams(self):
        return {k[5:]: v
                for k, v in self.__dict__.items()
                if k.startswith('user')}

    def updateCategory(self):
        """ update category with parameters """
        # get query params for this Category instance
        params = self.sanitizeParams()

        # check for the existence of subcategory
        hasSubs = [value for key, value in params.items() if "CategoryChk" in key]

        # get function to determine query
        if params['id'] == 'deleteCategory':
            """ if we are 'deleting' a category we unset active in db """
            query = ("UPDATE question_categories SET active = 0 "
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
        return {'success': self.cursor.lastrowid, 'stm': self.cursor.statement} if 'error' not in returnVal else {'error': returnVal}

    def newCategory(self):
        """ insert new category with/without parent_id """
        query = ("INSERT INTO question_categories (category, parent_id)"
                 " VALUES (%(c_Category)s, %(parent_id)s)")
        params = self.sanitizeParams()
        # specific sanitation of data
        if 'c_Category' in params.keys():
            cat = params['c_Category']
            if not cat or cat == "":
                return {'error': "missing new category name"}
            else:
                if 'parent_id' not in params.keys():
                    params['parent_id'] = 0
                returnVal = self.executeModifyQuery(query, params)
                return {'success': self.cursor.lastrowid} if 'error' not in returnVal else {'error': returnVal}

    def getAllCategories(self):
        """ get user information by name """
        query = """SELECT category_id, category, parent_id
                FROM  question_categories WHERE active = 1
            """
        return self.executeQuery(query, ())

if __name__ == "__main__":
    info = {'id': 'deleteCategory', 'd_Category': 3,
            'd_parentCategoryChk': 'on', 'd_subCategory[]': ["4", "19"]}

    """ modify user information for testing """
    # info['stuff'] = "stuff"

    print(Category(info).getAllCategories())
