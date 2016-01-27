#!/bin/python
"""
Tools for simulating the results of a cgi.FieldStorage()
call; useful for testing CGI scripts outside the web
"""


class FieldMockup(object):
    """ mocked up input object"""
    def __init__(self, arg):
        super(FieldMockup, self).__init__()
        self.value = arg


class mockDict(dict):
    """ overridden specialized dict object

        mockDict allows access to dictionary entries as attributes
        it also has a "getvalue" method to help simulate cgi.FieldStorage
    """
    def __init__(self):
        pass

    def getvalue(self, k):
        return self[k].value

    def __getattr__(self, name):
        return self.get(name)

    def __setattr__(self, name, value):
        self[name] = value


def formMockup(**kwargs):
    mockup = mockDict()
    for (key, value) in kwargs.items():
        if type(value) != list:
            mockup[key] = FieldMockup(str(value))
        else:
            mockup[key] = []
            for pick in value:
                mockup[key].append(FieldMockup(pick))
    return mockup


def selftest():
    """ use this form if fields can be hardcoded """
    form = formMockup(name="Bob", job="hacker", food=['Spam', 'eggs', 'ham'])
    print(form['name'].value)
    print(form['job'].value)
    for item in form['food']:
        print(item.value)

    """ use real dict if keys are in variables or computed """
    print()
    form = {'name': FieldMockup('Brian'), 'age': FieldMockup(23)}
    for key in form.keys():
        print(form[key].value)

if __name__ == '__main__':
    selftest()
