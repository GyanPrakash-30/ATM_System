from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, User, Transaction
from datetime import datetime
from flask_cors import CORS
from flask import session as session_flask
import os
import base64
import face_recognition
from PIL import Image
import io, base64


app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = "your_secret_key"

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Initialize the database
db.init_app(app)

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Create tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        data = request.form
        username = data['username']
        name = data['name']
        email = data['email']
        gender = data['gender']
        dob = data['dob']
        address = data['address']
        phone = data['phone']
        password = generate_password_hash(data['password'])
        account_no = data['account_no']
        account_type = data['account_type']
        bank_name = data['bank_name']

        # Save photo
        photo_file = request.files['photo']
        filename = secure_filename(photo_file.filename)
        photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        photo_file.save(photo_path)

        user = User(
            username=username,
            name=name,
            email=email,
            gender=gender,
            dob=dob,
            address=address,
            phone=phone,
            password=password,
            account_no=account_no,
            account_type=account_type,
            bank_name=bank_name,
            photo=filename,
            balance=0.0
        )

        try:
            db.session.add(user)
            db.session.commit()
            flash("Registration successful!", "success")
            return redirect(url_for('login'))
        except:
            db.session.rollback()
            flash("Username or Email already exists.", "danger")

    return render_template('signup.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'message': 'No data received'}), 400

    email = data.get('email')
    password_input = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password_input):
        # Do not set session yet — do that in /verify-face
        return jsonify({
            'message': 'Password verified, proceed to face verification',
            'username': user.username  # Pass username to facebox.html
        }), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/facebox')
def facebox():
    return render_template('facebox.html')

@app.route('/atm')
def atm():
    print("Current session:", session)  # Debug
    if 'user_id' not in session:
        flash("Please log in first.", "warning")
        return redirect(url_for('login'))

    return render_template('atm.html')  # Your HTML/JS-based dashboard

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    txns = Transaction.query.filter_by(user_id=user.id).order_by(Transaction.id.desc()).all()
    txn_list = [{'date': t.date.strftime("%Y-%m-%d %H:%M:%S"), 'type': t.type, 'amount': t.amount} for t in txns]

    return jsonify({
        'user_id': user.id,
        'username': user.username,
        'full_name': user.name,
        'sex': user.gender,
        'dob': user.dob,
        'email': user.email,
        'phone': user.phone,
        'account_no': user.account_no,
        'account_type': user.account_type,
        'bank_name': user.bank_name,
        'photo': user.photo,
        'balance': user.balance,
        'transactions': txn_list
    })

@app.route('/deposit', methods=['POST'])
def deposit():
    data = request.get_json()
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'message': 'User not found'}), 404

    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'message': 'Invalid amount'}), 400

        user.balance += amount

        txn = Transaction(
            user_id=user.id,
            type='Deposit',
            amount=amount,
            date=datetime.now()
        )

        db.session.add(txn)
        db.session.add(user)  # 🔄 Ensure user update is committed
        db.session.commit()

        return jsonify({'message': 'Deposit successful'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error: ' + str(e)}), 500



@app.route('/withdraw', methods=['POST'])
def withdraw():
    data = request.get_json()
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'message': 'User not found'}), 404

    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'message': 'Invalid amount'}), 400

        if user.balance < amount:
            return jsonify({'message': 'Insufficient balance'}), 400

        user.balance -= amount

        txn = Transaction(
            user_id=user.id,
            type='Withdraw',
            amount=amount,
            date=datetime.now()
        )

        db.session.add(txn)
        db.session.add(user)  # 🔄 Ensure user update is committed
        db.session.commit()

        return jsonify({'message': 'Withdraw successful'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error: ' + str(e)}), 500

@app.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.form
    with app.app_context():
        session = db.session
        user = session.query(User).filter_by(username=data['username']).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Update basic profile fields
        user.name = data['full_name']
        user.email = data['email']
        user.phone = data['phone']
        # user.gender = data['sex']
        # user.dob = data['dob']
        
        session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/change-pin', methods=['POST'])
def change_pin():
    data = request.get_json()
    with app.app_context():
        session = db.session
        user = session.query(User).filter_by(username=data['username']).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        if not check_password_hash(user.password, data['old_pin']):
            return jsonify({'message': 'Incorrect current PIN'}), 403
        user.password = generate_password_hash(data['new_pin'])
        session.commit()
        return jsonify({'message': 'PIN changed successfully'}), 200

@app.route('/verify-face', methods=['POST'])
def verify_face():
    data = request.get_json()
    if not data or 'image' not in data or 'username' not in data:
        return jsonify({'message': 'Missing image or username'}), 400

    username = data['username']
    image_base64 = data['image']

    with app.app_context():
        session_db = db.session
        user = session_db.query(User).filter_by(username=username).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Load stored image
        stored_path = os.path.join(app.config['UPLOAD_FOLDER'], user.photo)
        try:
            stored_image = face_recognition.load_image_file(stored_path)
            stored_encodings = face_recognition.face_encodings(stored_image)
            if not stored_encodings:
                return jsonify({'message': 'No face found in stored image'}), 400
        except Exception as e:
            return jsonify({'message': 'Error loading stored image', 'error': str(e)}), 500

        # Decode the captured image
        try:
            img_data = base64.b64decode(image_base64.split(",")[1])
            captured_image = face_recognition.load_image_file(io.BytesIO(img_data))
            captured_encodings = face_recognition.face_encodings(captured_image)
            if not captured_encodings:
                return jsonify({'message': 'No face found in captured image'}), 400
        except Exception as e:
            return jsonify({'message': 'Error processing webcam image', 'error': str(e)}), 500

        # Compare faces
        match_result = face_recognition.compare_faces([stored_encodings[0]], captured_encodings[0])
        if match_result[0]:
            session_flask['user_id'] = user.id  # ✅ Login session
            return jsonify({'message': 'Face verified successfully'}), 200
        else:
            return jsonify({'message': 'Face verification failed'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)

