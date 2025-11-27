from transformers import AutoTokenizer, AutoModel
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet
import torch
import re
import sys
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Download required NLTK data
nltk.download('punkt')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

class MedicalTextSimplifier:
    def __init__(self):
        print("Loading BioLinkBERT model...")
        try:
            # Initialize BioLinkBERT
            self.tokenizer = AutoTokenizer.from_pretrained("michiyasunaga/BioLinkBERT-base")
            self.model = AutoModel.from_pretrained("michiyasunaga/BioLinkBERT-base")
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading model: {e}")
            print("Please ensure you have the required dependencies installed:")
            print("pip install -r requirements.txt")
            sys.exit(1)

    def get_medical_context(self, term, text):
        try:
            # Prepare the input for BioLinkBERT
            inputs = self.tokenizer(
                f"{term} : {text}",
                return_tensors="pt",
                max_length=512,
                truncation=True,
                padding=True
            )
            
            # Get embeddings from BioLinkBERT
            with torch.no_grad():
                outputs = self.model(**inputs)
                embeddings = outputs.last_hidden_state[:, 0, :]  # Get [CLS] token embedding
            
            # Convert to numpy for similarity calculation
            embeddings = embeddings.numpy()
            
            # Get embeddings for some common medical explanations
            common_explanations = [
                "a medical procedure",
                "a medical condition",
                "a medical treatment",
                "a medical test",
                "a medical device"
            ]
            
            explanation_inputs = self.tokenizer(
                common_explanations,
                return_tensors="pt",
                padding=True,
                truncation=True
            )
            
            with torch.no_grad():
                explanation_outputs = self.model(**explanation_inputs)
                explanation_embeddings = explanation_outputs.last_hidden_state[:, 0, :].numpy()
            
            # Calculate similarity with common explanations
            similarities = cosine_similarity(embeddings, explanation_embeddings)
            best_match_idx = np.argmax(similarities[0])
            
            # Return the most similar explanation type
            return common_explanations[best_match_idx]
            
        except Exception as e:
            print(f"Error getting medical context: {e}")
            return None

    def is_medical_term(self, term):
        # Check if term is in medical categories in WordNet
        synsets = wordnet.synsets(term)
        medical_categories = [
            'noun.medicine', 'noun.body', 'noun.phenomenon',
            'noun.process', 'noun.state', 'noun.artifact'
        ]
        
        for synset in synsets:
            if any(cat in synset.lexname() for cat in medical_categories):
                return True
        return False

    def generate_simplified_explanation(self, term, context):
        try:
            # Get explanation type from BioLinkBERT
            explanation_type = self.get_medical_context(term, context)
            if explanation_type:
                # Get WordNet definition for more details
                synsets = wordnet.synsets(term)
                if synsets:
                    definition = synsets[0].definition()
                    return f"{explanation_type} that {definition}"
                return explanation_type
            
            # Fallback to WordNet if BioLinkBERT fails
            synsets = wordnet.synsets(term)
            if synsets:
                return synsets[0].definition()
            
            return f"a medical term related to {term}"
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return f"a medical term related to {term}"

    def identify_medical_terms(self, text):
        tokens = word_tokenize(text)
        pos_tags = nltk.pos_tag(tokens)
        
        medical_terms = []
        current_term = []
        
        for i, (token, pos) in enumerate(pos_tags):
            if pos.startswith('NN') or pos.startswith('JJ'):
                current_term.append(token)
            else:
                if current_term:
                    term = ' '.join(current_term)
                    if self.is_medical_term(term.lower()):
                        medical_terms.append({
                            'term': term,
                            'position': i - len(current_term)
                        })
                    current_term = []
        
        if current_term:
            term = ' '.join(current_term)
            if self.is_medical_term(term.lower()):
                medical_terms.append({
                    'term': term,
                    'position': len(tokens) - len(current_term)
                })
        
        return medical_terms

    def simplify_text(self, text):
        print("\nOriginal text:")
        print(text)
        
        print("\nIdentifying medical terms...")
        medical_terms = self.identify_medical_terms(text)
        
        print("\nMedical terms found:")
        simplified_text = text
        for term_info in medical_terms:
            term = term_info['term']
            simplified_def = self.generate_simplified_explanation(term, text)
            print(f"\nTerm: {term}")
            print(f"Simplified explanation: {simplified_def}")
            
            pattern = r'\b' + re.escape(term) + r'\b'
            simplified_text = re.sub(pattern, f"{term} ({simplified_def})", simplified_text)
        
        print("\nSimplified text:")
        print(simplified_text)

def main():
    try:
        simplifier = MedicalTextSimplifier()
        
        print("Enter medical text to simplify (press Enter twice to finish):")
        lines = []
        while True:
            line = input()
            if line:
                lines.append(line)
            else:
                break
        text = '\n'.join(lines)
        
        if text.strip():
            simplifier.simplify_text(text)
        else:
            print("No text entered. Please try again.")
    except KeyboardInterrupt:
        print("\nProgram interrupted by user")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()