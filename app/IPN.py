from circuits.web import Controller, Server
from urllib import urlencode
from sqlite3 import connect, Error as sqerr
from urllib2 import urlopen, Request
from circuits.web import Controller, Server
from time import time
import cgi
import cgitb
import User
from lib.Entity import *

cgitb.enable()

"""
Currently i have CGI enabled so that I may print out the output from the IPN listener to the ipn.html webpage to view
the returned data so I may browse what is sent and where to put it into the database.

---TODO---
make it print to the webpage to view returned data
insert commands from Entity to insert data into and update the database
(Will also have to add something for how PayPal seperates the returned data)

"""
#This code is to handle user credit payments. The code below controls receiving the IPN from paypal. It confirms
#that a specific user paid for credits, and updates our sql tables.


#this code is to handle ipn payments. This sends the user id to paypal when the customer pays.
#paypal sends the user_id along with confirmation of payment, and the amount paid. By sending us
#the user_id along with the paypal IPN, this allows us to uniquely identify who paid, so that we
#can update our sql tables appropriately.


class Root(Controller):
	# if the app will not be served at the root of the domain, uncomment the next line
	channel = "/ipn"
    def verify_ipn(data):
        # prepares provided data set to inform PayPal we wish to validate the response
        data["cmd"] = "_notify-validate"
        params = urlencode(data)

        # sends the data and request to the PayPal Sandbox
        req = Request("""https://www.sandbox.paypal.com/cgi-bin/webscr""", params)
        req.add_header("Content-type", "application/x-www-form-urlencoded")
        # reads the response back from PayPal
        response = urlopen(req)
        status = response.read()

        # If not verified
        if not status == "VERIFIED":
            return False

        # if not the correct receiver ID
        if not data["receiver_id"] == "DDBSOMETHING4KE":
            return False

        # if not the correct currency
        if not data["mc_currency"] == "USD":
            return False

        # otherwise...
        return True

	# if the app will not be served at the root of the domain, uncomment the next line
	channel = "/ipn"

	# index is invoked on the root path, or the designated channel URI
	def index(self, **data):
		# If there is no txn_id in the received arguments don't proceed
		if not "txn_id" in data:
			return "No Parameters"

		# Verify the data received with Paypal
		if not verify_ipn(data):
			return "Unable to Verify"

		# Suggested Check : check the item IDs and Prices to make sure they match with records

		# If verified, store desired information about the transaction
		userid = data["json_decode($data['custom'])->user_id"]  #here is where I decode the json IPN user_id variable that they send back to us. This allows us to uniquely match users to their payments.
		status = data["payment_status"]
		purchase = float(data["mc_gross"])  #I converted these to float so we can subtract it to find the amount of credits to assign to the player
		paypalfee = float(data["mc_fee"])
		credits = purchase - paypalfee

		# Open a connection to a local SQLite database (use MySQLdb for MySQL, psycopg or PyGreSQL for PostgreSQL)
		conn = connect('debate')
		curs = conn.cursor()
		try:
			# curs.execute("""UPDATE Users
	                # SET Credit = Credit + %s
                    # WHERE user_id= %s""", (credits, userid))
			# conn.commit()
		except sqerr, e:
			return "SQL Error: " + e.args[0]
		conn.close()

		# Alternatively you can generate license keys, email users login information
		# or setup accounts upon successful payment. The status will always be "Completed" on success.
		# Likewise you can revoke user access, if status is "Canceled", or another payment error.

		return "Success"

		##########References: http://stackoverflow.com/questions/1307378/python-mysql-update-statement
		     ###############: http://code.tutsplus.com/tutorials/how-to-setup-recurring-payments--net-30168
