import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_key")

# Simulated in-memory "database" for demo purposes
scores = []

@app.route('/')
def index():
    return redirect(url_for('role_selection'))

@app.route('/role-selection')
def role_selection():
    return render_template('role-selection.html')

@app.route('/basket')
def basket():
    return render_template('basketball.html')

@app.route('/login')
def login():
    role = request.args.get('role', 'patient')
    # Simulate user login by setting session user_id (for demo)
    session['user_id'] = 1
    return render_template('login.html', role=role)

@app.route('/signup')
def signup():
    role = request.args.get('role', 'patient')
    return render_template('signup.html', role=role)

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/user-dashboard')
def user_dashboard():
    return render_template('user-dashboard.html')

@app.route('/volleyball')
def volleyball():
    return render_template('volleyball.html')

@app.route('/posturegame')
def cargame():
    return render_template('car-game.html')

@app.route('/leg-game')
def leg_game():
    return render_template('leg-game.html')

@app.route('/doctor-dashboard')
def doctor_dashboard():
    return render_template('doctor-dashboard.html')

@app.route('/doctor-patient')
def doctor_patient():
    return render_template('doctor-patient.html')

@app.route('/patient-details')
def patient_details():
    return render_template('patient-details.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/my-exercises')
def my_exercises():
    return render_template('my-exercises.html')

@app.route('/communication')
def communication():
    return render_template('communication.html')

@app.route('/therapist-communication')
def therapist_communication():
    return render_template('therapist-communication.html')

@app.route('/user-game')
def user_game():
    return render_template('user-game.html')

@app.route('/balloon-game')
def balloon_game():
    return render_template('balloon-game.html')

# ✅ Game Score Submission Route
@app.route('/submit-score', methods=['POST'])
def submit_score():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    score = data.get('score')
    time_taken = data.get('time')

    new_score = {
        'user_id': session['user_id'],
        'score': score,
        'time': time_taken,
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    scores.append(new_score)
    print("New Score:", new_score)  # for debugging

    return jsonify({'success': True, 'message': 'Score submitted successfully'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


