from flask import Flask, render_template, request, jsonify
from medical_simplifier import MedicalTextSimplifier
from flask_cors import CORS
import re

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)
simplifier = MedicalTextSimplifier()

@app.route('/')
def home():
    return render_template('index.html')

def process_text(text):
    """Helper function to handle text processing logic"""
    if not text.strip():
        return jsonify({'error': 'Please enter some text'}), 400
        
    # Get medical terms and their explanations
    medical_terms = simplifier.identify_medical_terms(text)
    simplified_text = text
    
    explanations = []
    for term_info in medical_terms:
        term = term_info['term']
        simplified_def = simplifier.generate_simplified_explanation(term, text)
        explanations.append({
            'term': term,
            'explanation': simplified_def
        })
        pattern = r'\b' + re.escape(term) + r'\b'
        simplified_text = re.sub(pattern, f"{term} ({simplified_def})", simplified_text)
        
    return {
        "answer": simplified_text,
        "simplified_text": simplified_text,  # For backward compatibility
        "explanations": explanations
    }

@app.route('/api/medical/simplify', methods=['POST', 'OPTIONS'])
def api_simplify():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
        
    try:
        data = request.get_json()
        text = data.get('text', '')
        result = process_text(text)
        
        if isinstance(result, tuple):  # Error response
            return result
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add the original route to maintain compatibility with HTML frontend
@app.route('/simplify', methods=['POST'])
def simplify():
    try:
        data = request.get_json()
        text = data.get('text', '')
        result = process_text(text)
        
        if isinstance(result, tuple):  # Error response
            return result
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        "status": "healthy", 
        "service": "medical_text_simplifier"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5008)