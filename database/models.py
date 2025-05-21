from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    username = db.Column(db.String(80), primary_key=True)
    pin = db.Column(db.String(4), nullable=False)
    full_name = db.Column(db.String(120))
    sex = db.Column(db.String(10))
    dob = db.Column(db.String(20))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    account_no = db.Column(db.String(20))
    account_type = db.Column(db.String(20))
    bank_name = db.Column(db.String(50))
    photo = db.Column(db.String(120))
    balance = db.Column(db.Float, default=0.0)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), db.ForeignKey('user.username'))
    type = db.Column(db.String(10))
    amount = db.Column(db.Float)
    date = db.Column(db.String(30))
