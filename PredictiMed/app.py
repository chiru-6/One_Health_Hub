from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from medical import initialize_models, create_medical_rag_chain, initialize_faiss

app = Flask(__name__)
# Enable CORS for all routes and all origins 
CORS(app, supports_credentials=True)

# Initialize the RAG system components
try:
    embeddings, llm = initialize_models()
    vectorstore = initialize_faiss(embeddings)
    chain = create_medical_rag_chain(llm, embeddings, vectorstore)
    print("✅ RAG system initialized successfully")
except Exception as e:
    print(f"❌ Error initializing RAG system: {e}")
    print("Chat functionality will be disabled.")
    chain = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/healthcare/answer', methods=['POST'])
def health_answer():
    try:
        if chain is None:
            return jsonify({
                'answer': "Error: RAG system is not initialized. Please check server logs.",
                'sources': []
            }), 500

        if not request.is_json:
            return jsonify({
                'answer': "Error: Request must be JSON",
                'sources': []
            }), 400

        data = request.get_json()
        
        if 'question' not in data:
            return jsonify({
                'answer': "Error: 'question' field is required",
                'sources': []
            }), 400

        user_message = data['question']
        
        if len(user_message.strip()) < 5:
            return jsonify({
                'answer': "⚠️ Please enter a more detailed question.",
                'sources': []
            })

        # Query the medical RAG system
        response = chain({"query": user_message})
        
        answer = response['result']
        sources = [doc.metadata.get('source', 'Medical Database') 
                  for doc in response['source_documents']]
        
        # Add disclaimer to the answer
        answer += "\n\n⚠️ Remember: This information is for educational purposes only. Please consult with healthcare professionals for medical advice."
        
        return jsonify({
            'answer': answer,
            'sources': sources
        })
        
    except Exception as e:
        return jsonify({
            'answer': f"❌ Error: {str(e)}. Please try rephrasing your question.",
            'sources': []
        }), 500

if __name__ == '__main__':
    print("🏥 Starting Medical Chatbot Server...")
    print("✨ Access the chatbot at http://localhost:5010")
    # Run the server on all interfaces (0.0.0.0) to allow external connections
    app.run(debug=True, host='0.0.0.0', port=5010)