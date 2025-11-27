import os
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import FAISS
import json
from tqdm import tqdm
import dotenv

dotenv.load_dotenv()

# Initialize paths and configurations
FAISS_DB_PATH = "./medical_faiss_db"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")

# Available models
LLM_OPTIONS = [
    "llama3-8b-8192",
    "gemma-7b-it",
    "mixtral-8x7b-32768",
    "llama3-70b-8192"
]

EMBEDDING_OPTIONS = [
    "BAAI/bge-base-en-v1.5",
    "BAAI/bge-large-en-v1.5",
    "WhereIsAI/UAE-Large-V1",
    "mixedbread-ai/mxbai-embed-large-v1",
    "mixedbread-ai/mxbai-embed-2d-large-v1"
]

# Default models
DEFAULT_LLM_MODEL = "llama3-70b-8192"
DEFAULT_EMBEDDING_MODEL = "BAAI/bge-large-en-v1.5"

# Medical System Prompt
SYSTEM_PROMPT = """You are a Medical Assistant chatbot designed to help users understand medical conditions, symptoms, and treatments.

IMPORTANT RULES:
1. ONLY answer questions related to medicine, health, diseases, symptoms, or healthcare.
2. If asked about ANY non-medical topic (math, history, sports, etc.), respond ONLY with: "I can only provide information about medical and health-related topics. Please ask me about health, diseases, symptoms, or medical conditions."
3. Never engage in non-medical discussions or calculations.

Remember: Stay strictly within medical and healthcare topics only.

HOW THIS CHATBOT CAN HELP YOU:
1. Provides detailed information about medical conditions and diseases
2. Helps identify potential symptoms and their significance
3. Explains diagnostic procedures and treatment options
4. Offers preventive healthcare information
5. Assists in understanding medical terminology
6. Provides structured, easy-to-understand medical information

For each disease or condition mentioned, I will provide:
- Detailed Description
- Common Symptoms
- Diagnostic Methods
- Possible Complications
- Treatment Options

BENEFITS:
1. 24/7 access to medical information
2. Easy-to-understand explanations
3. Comprehensive disease information
4. Educational resource for health awareness
5. Quick access to medical knowledge

Remember: Stay strictly within medical and healthcare topics only.
Note: While I provide medical information, it's essential to consult healthcare professionals for proper diagnosis and treatment."""

print("🚀 Initializing Medical RAG System...")

def initialize_faiss(embeddings=None):
    print("📚 Initializing FAISS...")
    if os.path.exists(FAISS_DB_PATH):
        if embeddings is None:
            # Initialize default embeddings if none provided
            embeddings = HuggingFaceInferenceAPIEmbeddings(
                api_key=HF_API_KEY,
                model_name=DEFAULT_EMBEDDING_MODEL
            )
        return FAISS.load_local(
            FAISS_DB_PATH, 
            embeddings,
            allow_dangerous_deserialization=True  # Required for loading local FAISS database
        )
    else:
        print("⚠️ FAISS database not found. Please run faissdata.py first.")
        return None

def initialize_models(llm_model=DEFAULT_LLM_MODEL, 
                     embd_model=DEFAULT_EMBEDDING_MODEL, 
                     temperature=0.7):
    print("🧠 Loading models...")
    
    # Initialize embedding model
    embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=HF_API_KEY,
        model_name=embd_model
    )
    
    # Initialize LLM
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name=llm_model,
        temperature=temperature
    )
    
    return embeddings, llm

def create_medical_rag_chain(llm, embeddings, vectorstore):
    # Create medical-specific prompt template
    prompt_template = """
    {system_prompt}

    Please provide comprehensive information about the health-related question, including possible diseases if relevant.
    For each disease or condition, include:
    - Detailed Description
    - Common Symptoms
    - Diagnostic Methods
    - Possible Complications
    - Treatment Options

    Medical Context: {context}

    Question: {question}

    Medical Response:"""
    
    PROMPT = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question", "system_prompt"],
        partial_variables={"system_prompt": SYSTEM_PROMPT}
    )
    
    # Create retrieval chain
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
        chain_type_kwargs={
            "prompt": PROMPT
        },
        return_source_documents=True
    )
    
    return chain

def query_medical_rag(question, chain):
    print("\n🔍 Searching medical knowledge base...")
    
    try:
        # Get response from chain
        response = chain({"query": question})
        
        answer = response['result']
        sources = response['source_documents']
        
        print(f"📚 Found {len(sources)} relevant medical documents")
        
        return answer, sources
        
    except Exception as e:
        print(f"⚠️ Error during query: {str(e)}")
        return None, None

def run_medical_chatbot(llm_model=DEFAULT_LLM_MODEL, 
                       embd_model=DEFAULT_EMBEDDING_MODEL,
                       temperature=0.7):
    try:
        # Initialize components
        vectorstore = initialize_faiss()
        if vectorstore is None:
            return
            
        embeddings, llm = initialize_models(llm_model, embd_model, temperature)
        chain = create_medical_rag_chain(llm, embeddings, vectorstore)

        print("\n🏥 Welcome to your Medical Assistant!")
        print("I can help you with medical questions about diseases, symptoms, treatments, and health conditions.")
        print(f"Using LLM: {llm_model}")
        print(f"Using Embeddings: {embd_model}")
        print("\n⚠️ Disclaimer: This is not a substitute for professional medical advice.")
        print("For medical emergencies, please call emergency services immediately.")
        print("\nType your medical question below. Type 'exit' to quit.\n")

        while True:
            user_input = input("\n❓ Your Medical Question: ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'bye', 'q']:
                print("\n👋 Take care! Remember to consult healthcare professionals for medical advice.")
                break

            if len(user_input) < 5:
                print("⚠️ Please enter a more detailed question.")
                continue

            try:
                print("\n🔄 Processing your question...")
                answer, sources = query_medical_rag(user_input, chain)
                
                if answer:
                    print("\n💊 Medical Information:")
                    print("=" * 80)
                    print(answer.strip())
                    print("=" * 80)
                    
                    if sources:
                        print("\n📚 Information Sources:")
                        for i, doc in enumerate(sources, 1):
                            print(f"{i}. {doc.metadata.get('source', 'Medical Database')}")
                    
                    print("\n⚠️ Remember: This information is for educational purposes only.")
                    print("Please consult with healthcare professionals for medical advice.")
                
            except Exception as e:
                print(f"⚠️ Error while generating response: {str(e)}")
                print("Please try rephrasing your question or try again later.")

    except Exception as e:
        print(f"❌ System initialization error: {str(e)}")
        print("Please ensure all required models and data are available.")

if __name__ == "__main__":
    print("🏥 Medical Assistant Initialization")
    print("=" * 50)
    
    # You can change these parameters when calling the function
    run_medical_chatbot(
        llm_model=DEFAULT_LLM_MODEL,
        embd_model=DEFAULT_EMBEDDING_MODEL,
        temperature=0.7
    )