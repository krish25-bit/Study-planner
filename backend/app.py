from flask import Flask, request, jsonify
from flask_cors import CORS
import math
from datetime import datetime
from pymongo import MongoClient
import pandas as pd
import bcrypt
import jwt
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_here'
CORS(app)

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client['db']
schedules_col = db['schedules']
users_col = db['users']

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_col.find_one({'email': data['user_email']})
            if not current_user:
                raise Exception("User not found")
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password.decode('utf-8')
    }
    users_col.insert_one(new_user)
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    user = users_col.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode({
        'user_email': user['email'],
        'exp': datetime.utcnow() + pd.Timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({"token": token, "name": user['name']})


@app.route('/api/generate-schedule', methods=['POST'])
@token_required
def generate_schedule(current_user):
    data = request.json
    subjects = data.get('subjects', [])
    exam_date_str = data.get('examDate', '')
    daily_capacity = float(data.get('dailyCapacity', 4)) # hours per day max
    
    if not subjects or not exam_date_str:
        return jsonify({"error": "Missing required fields"}), 400
        
    try:
        exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d")
        today = datetime.now()
        remaining_days = (exam_date - today).days
        
        if remaining_days <= 0:
            return jsonify({"error": "Exam date must be in the future"}), 400
            
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    # Calculate total weight based on difficulty
    difficulty_weights = {"Easy": 1, "Medium": 2, "Hard": 3}
    total_weight = sum([difficulty_weights.get(sub.get('difficulty', 'Medium'), 2) for sub in subjects])
    
    # Distribute total available study hours across subjects
    total_available_hours = remaining_days * daily_capacity
    
    schedule = []
    for sub in subjects:
        weight = difficulty_weights.get(sub.get('difficulty', 'Medium'), 2)
        # Proportion of total study time allocated to this subject
        allocated_hours = (weight / total_weight) * total_available_hours
        
        # Determine daily study hours for this subject
        daily_hours = allocated_hours / remaining_days
        
        schedule.append({
            "subject": sub.get('name'),
            "difficulty": sub.get('difficulty'),
            "totalHours": round(allocated_hours, 1),
            "dailyHours": round(daily_hours, 1)
        })
        
    # Sort schedule to prioritize harder subjects
    schedule.sort(key=lambda x: difficulty_weights.get(x['difficulty'], 2), reverse=True)

    # Prepare response
    response_data = {
        "remainingDays": remaining_days,
        "totalAvailableHours": round(total_available_hours, 1),
        "schedule": schedule
    }

    # Save to MongoDB for Analytics
    analytics_record = {
        "user_email": current_user['email'],
        "created_at": datetime.now(),
        "exam_date": exam_date,
        "remaining_days": remaining_days,
        "daily_capacity": daily_capacity,
        "total_available_hours": total_available_hours,
        "subjects": subjects,
        "num_subjects": len(subjects)
    }
    try:
        schedules_col.insert_one(analytics_record)
    except Exception as e:
        print("Failed to store analytics:", str(e))

    return jsonify(response_data)

@app.route('/api/analytics', methods=['GET'])
@token_required
def get_analytics(current_user):
    try:
        cursor = schedules_col.find({"user_email": current_user['email']})
        data = list(cursor)
        
        if not data:
            return jsonify({
                "total_plans": 0,
                "msg": "No analytics data available yet."
            })
            
        # We will compute analytics using pandas
        # Convert simple fields to dataframe
        df = pd.DataFrame(data)
        
        # 1. Total Plans
        total_plans = len(df)
        
        # 2. Extract Subject Info for deeper analysis
        subjects_data = []
        for index, row in df.iterrows():
            # subjects is a list of dicts
            for sub in row.get("subjects", []):
                subjects_data.append({
                    "plan_id": str(row["_id"]),
                    "name": sub.get("name", "Unknown"),
                    "difficulty": sub.get("difficulty", "Unknown")
                })
                
        # Subject Analysis
        if subjects_data:
            sub_df = pd.DataFrame(subjects_data)
            # Most popular subjects
            popular_subjects = sub_df['name'].value_counts().head(5).to_dict()
            # Difficulty distribution
            difficulty_dist = sub_df['difficulty'].value_counts().to_dict()
        else:
            popular_subjects = {}
            difficulty_dist = {}
            
        # Basic stats
        avg_days = df['remaining_days'].mean() if 'remaining_days' in df else 0
        avg_capacity = df['daily_capacity'].mean() if 'daily_capacity' in df else 0
        
        # Format the result to return
        analytics_result = {
            "total_plans": int(total_plans),
            "average_remaining_days": float(round(avg_days, 1)),
            "average_daily_capacity": float(round(avg_capacity, 1)),
            "popular_subjects": popular_subjects,
            "difficulty_distribution": difficulty_dist
        }
        
        return jsonify(analytics_result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
