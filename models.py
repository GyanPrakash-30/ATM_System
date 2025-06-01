from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    gender = db.Column(db.String(10))
    dob = db.Column(db.String(20))
    address = db.Column(db.Text)
    phone = db.Column(db.String(15))
    password = db.Column(db.String(200), nullable=False)
    account_no = db.Column(db.String(20))
    account_type = db.Column(db.String(20))
    bank_name = db.Column(db.String(100))
    photo = db.Column(db.String(100))
    balance = db.Column(db.Float, default=0.0)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(10))
    amount = db.Column(db.Float)
    date = db.Column(db.DateTime, default=datetime.now)
