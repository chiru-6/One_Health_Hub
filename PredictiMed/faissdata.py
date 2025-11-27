import json
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_community.vectorstores import FAISS
from tqdm import tqdm
import os
import dotenv

dotenv.load_dotenv()

# Initialize paths and configurations
FAISS_DB_PATH = "./medical_faiss_db"
HF_API_KEY = os.getenv("HF_API_KEY")
DEFAULT_EMBEDDING_MODEL = "BAAI/bge-large-en-v1.5"

def format_disease_text(disease):
    """Format disease data into a structured text document."""
    text_parts = [
        f"Disease Name: {disease.get('name', 'Unknown Disease')}",
        f"Description: {disease.get('description', 'No description available')}"
    ]
    
    # Handle symptoms (could be string or list)
    if 'symptoms' in disease:
        if isinstance(disease['symptoms'], list):
            text_parts.append(f"Symptoms: {', '.join(disease['symptoms'])}")
        else:
            text_parts.append(f"Symptoms: {disease['symptoms']}")
    
    # Handle diagnosis
    if 'diagnosis' in disease:
        if isinstance(disease['diagnosis'], list):
            text_parts.append(f"Diagnosis: {', '.join(disease['diagnosis'])}")
        else:
            text_parts.append(f"Diagnosis: {disease['diagnosis']}")
    
    # Handle treatment
    if 'treatment' in disease:
        if isinstance(disease['treatment'], list):
            text_parts.append(f"Treatment: {', '.join(disease['treatment'])}")
        else:
            text_parts.append(f"Treatment: {disease['treatment']}")
    
    # Handle complications
    if 'complications' in disease:
        if isinstance(disease['complications'], list):
            text_parts.append(f"Complications: {', '.join(disease['complications'])}")
        else:
            text_parts.append(f"Complications: {disease['complications']}")
    
    # Handle morphological_changes if present
    if 'morphological_changes' in disease:
        morph_text = []
        for change in disease['morphological_changes']:
            morph_text.append(
                f"Duration: {change.get('duration', 'Unknown')}, "
                f"Gross Changes: {change.get('gross_changes', 'None')}, "
                f"Microscopic Changes: {change.get('light_microscopic_changes', 'None')}"
            )
        text_parts.append("Morphological Changes:\n" + "\n".join(morph_text))
    
    # Handle other special parameters
    special_params = [
        'types', 'causative_organisms', 'classification',
        'risk_factors', 'prevention', 'epidemiology'
    ]
    
    for param in special_params:
        if param in disease and param != 'morphological_changes':  # Already handled above
            if isinstance(disease[param], list):
                if all(isinstance(x, dict) for x in disease[param]):
                    # Handle nested dictionaries
                    nested_text = []
                    for item in disease[param]:
                        item_text = []
                        for key, value in item.items():
                            if isinstance(value, list):
                                item_text.append(f"{key}: {', '.join(value)}")
                            else:
                                item_text.append(f"{key}: {value}")
                        nested_text.append(" | ".join(item_text))
                    text_parts.append(f"{param.title()}:\n" + "\n".join(nested_text))
                else:
                    text_parts.append(f"{param.title()}: {', '.join(disease[param])}")
            else:
                text_parts.append(f"{param.title()}: {disease[param]}")
    
    return "\n\n".join(text_parts)

def process_diseases_data():
    print("📚 Processing diseases dataset...")
    
    # Load the diseases dataset
    with open('diseases_dataset.json', 'r') as f:
        data = json.load(f)
        diseases_data = data['diseases']  # Access the nested diseases list
    
    # Prepare documents for embedding
    documents = []
    metadatas = []
    
    for disease in tqdm(diseases_data, desc="Processing diseases"):
        # Format the disease text using the helper function
        doc_text = format_disease_text(disease)
        
        # Add to documents and metadata
        documents.append(doc_text)
        metadatas.append({"source": f"Medical Database - {disease.get('name', 'Unknown Disease')}"})
    
    return documents, metadatas

def create_faiss_db():
    print("🔧 Creating FAISS database...")
    
    # Initialize embedding model
    embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=HF_API_KEY,
        model_name=DEFAULT_EMBEDDING_MODEL
    )
    
    # Process the data
    documents, metadatas = process_diseases_data()
    
    # Create FAISS vector store
    vectorstore = FAISS.from_texts(
        texts=documents,
        embedding=embeddings,
        metadatas=metadatas
    )
    
    # Save the vector store
    vectorstore.save_local(FAISS_DB_PATH)
    print(f"✅ FAISS database created and saved to {FAISS_DB_PATH}")

if __name__ == "__main__":
    print("🏥 Medical Knowledge Base Creation")
    print("=" * 50)
    
    # Create the FAISS database
    create_faiss_db() 