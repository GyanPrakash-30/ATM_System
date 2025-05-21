from database.models import db, User, Transaction
from app import app

with app.app_context():
    print("---- Users ----")
    for user in User.query.all():
        print(
            f"Username: {user.username}, PIN: {user.pin}, Full Name: {user.full_name}, Email: {user.email}, "
            f"Phone: {user.phone}, Sex: {user.sex}, DOB: {user.dob}, "
            f"Account No: {user.account_no}, Type: {user.account_type}, Bank: {user.bank_name}, "
            f"Photo: {user.photo}, Balance: {user.balance}"
        )

    print("\n---- Transactions ----")
    for tx in Transaction.query.all():
        print(f"User: {tx.username}, Type: {tx.type}, Amount: {tx.amount}, Date: {tx.date}")
