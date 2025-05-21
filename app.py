from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import base64
import face_recognition
from PIL import Image
import io

from database.models import db, User, Transaction

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///atm.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
db.init_app(app)

with app.app_context():
    db.create_all()

# === ROUTES ===

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.form
    with app.app_context():
        session = db.session
        if session.get(User, data['username']):
            return jsonify({'message': 'User already exists'}), 400

        file = request.files['photo']
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        user = User(
            username=data['username'],
            pin=data['pin'],
            full_name=data['full_name'],
            sex=data['sex'],
            dob=data['dob'],
            email=data['email'],
            phone=data['phone'],
            account_no=data['account_no'],
            account_type=data['account_type'],
            bank_name=data['bank_name'],
            photo=filename,
            balance=0.0
        )
        session.add(user)
        session.commit()
        return jsonify({'message': 'Registration successful'}), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    with app.app_context():
        session = db.session
        user = session.get(User, data['username'])
        if user and user.pin == data['pin']:
          # return jsonify({'message': 'Login successful'}), 200
            return jsonify({'message': 'Verify Your Face Now!'}), 200
        return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/verify-face', methods=['POST'])
def verify_face():
    data = request.get_json()
    if not data or 'image' not in data or 'username' not in data:
        return jsonify({'message': 'Missing image or username'}), 400

    username = data['username']
    image_base64 = data['image']

    with app.app_context():
        session = db.session
        user = session.get(User, username)
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
            img = Image.open(io.BytesIO(img_data)).convert('RGB')
            captured_image = face_recognition.load_image_file(io.BytesIO(img_data))
            captured_encodings = face_recognition.face_encodings(captured_image)
            if not captured_encodings:
                return jsonify({'message': 'No face found in captured image'}), 400
        except Exception as e:
            return jsonify({'message': 'Error processing webcam image', 'error': str(e)}), 500

        # Compare faces
        match_result = face_recognition.compare_faces([stored_encodings[0]], captured_encodings[0])
        if match_result[0]:
            return jsonify({'message': 'Face verified successfully'}), 200
        else:
            return jsonify({'message': 'Face verification failed'}), 401

@app.route('/profile')
def profile():
    username = request.args.get('username')
    with app.app_context():
        session = db.session
        user = session.get(User, username)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        txns = session.query(Transaction).filter_by(username=username).order_by(Transaction.id.desc()).all()
        txn_list = [{'date': t.date, 'type': t.type, 'amount': t.amount} for t in txns]

        return jsonify({
            'username': user.username,
            'full_name': user.full_name,
            'sex': user.sex,
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
    with app.app_context():
        session = db.session
        user = session.get(User, data['username'])
        if not user:
            return jsonify({'message': 'User not found'}), 404

        user.balance += data['amount']
        txn = Transaction(
            username=user.username,
            type='Deposit',
            amount=data['amount'],
            date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
        session.add(txn)
        session.commit()
        return jsonify({'message': 'Deposit successful'}), 200


@app.route('/withdraw', methods=['POST'])
def withdraw():
    data = request.get_json()
    with app.app_context():
        session = db.session
        user = session.get(User, data['username'])
        if not user:
            return jsonify({'message': 'User not found'}), 404
        if user.balance < data['amount']:
            return jsonify({'message': 'Insufficient balance'}), 400

        user.balance -= data['amount']
        txn = Transaction(
            username=user.username,
            type='Withdraw',
            amount=data['amount'],
            date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )
        session.add(txn)
        session.commit()
        return jsonify({'message': 'Withdraw successful'}), 200


@app.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.form
    with app.app_context():
        session = db.session
        user = session.get(User, data['username'])
        if not user:
            return jsonify({'message': 'User not found'}), 404
        if data['old_pin'] != user.pin:
            return jsonify({'message': 'Incorrect current PIN'}), 403

        user.full_name = data['full_name']
        user.email = data['email']
        user.phone = data['phone']
        if data.get('new_pin'):
            user.pin = data['new_pin']
        session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200



@app.route('/static/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
