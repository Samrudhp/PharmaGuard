import os
import json
from groq import Groq
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=self.api_key) if self.api_key else None
    
    def generate_explanation(
        self,
        gene: str,
        diplotype: str,
        phenotype: str,
        drug: str,
        risk_label: str,
        recommendation: str,
        variants: list,
        web_search_results: str = ""
    ) -> Dict:
        """
        Generate LLM-based explanation with web search context.
        
        Returns: Dict with mechanism, clinical_context, patient_friendly_summary
        """
        if not self.client:
            logger.warning("Groq API key not configured, using fallback")
            return self._fallback_explanation(
                gene, diplotype, phenotype, drug, risk_label
            )
        
        try:
            explanation = self._call_llm(
                gene, diplotype, phenotype, drug, risk_label, 
                recommendation, variants, web_search_results
            )
            
            # Validate structure
            if self._validate_explanation(explanation):
                return explanation
            else:
                # Retry once
                explanation = self._call_llm(
                    gene, diplotype, phenotype, drug, risk_label, 
                    recommendation, variants, web_search_results
                )
                if self._validate_explanation(explanation):
                    return explanation
                else:
                    return self._fallback_explanation(
                        gene, diplotype, phenotype, drug, risk_label
                    )
        
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return self._fallback_explanation(
                gene, diplotype, phenotype, drug, risk_label
            )
    
    def _call_llm(
        self,
        gene: str,
        diplotype: str,
        phenotype: str,
        drug: str,
        risk_label: str,
        recommendation: str,
        variants: list,
        web_search_results: str = ""
    ) -> Dict:
        """Call Groq API for explanation with web search context."""
        rsids = [v['rsid'] for v in variants if v.get('rsid')]
        rsids_str = ', '.join(rsids) if rsids else 'N/A'
        
        # Include web search results in prompt
        context_section = ""
        if web_search_results:
            context_section = f"\n\nAdditional Context from Recent Research:\n{web_search_results}\n"
        
        prompt = f"""You are a clinical pharmacogenomics expert. Generate a clear, structured explanation for the following pharmacogenomic finding:

Gene: {gene}
Diplotype: {diplotype}
Phenotype: {phenotype}
Drug: {drug}
Risk Assessment: {risk_label}
Recommendation: {recommendation}
Detected Variants (rsIDs): {rsids_str}{context_section}

Using the clinical guidelines and recent research context provided above, generate a JSON response with exactly three fields:
1. "mechanism": Explain the molecular mechanism (how {gene} affects {drug} metabolism, mentioning specific variants if relevant). Reference research findings. 2-3 sentences.
2. "clinical_context": Explain the clinical implications and why the risk assessment was determined. Cite relevant guidelines or research. 2-3 sentences.
3. "patient_friendly_summary": A simple explanation suitable for patients without medical background. 2-3 sentences.

Return ONLY valid JSON with these three fields. Do not modify the risk assessment or recommendation."""

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Groq's fast model
            messages=[
                {"role": "system", "content": "You are a pharmacogenomics expert providing evidence-based clinical explanations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        content = response.choices[0].message.content.strip()
        
        # Parse JSON
        if content.startswith('```json'):
            content = content.replace('```json', '').replace('```', '').strip()
        elif content.startswith('```'):
            content = content.replace('```', '').strip()
        
        explanation = json.loads(content)
        return explanation
    
    def _validate_explanation(self, explanation: Dict) -> bool:
        """Validate explanation structure."""
        required_fields = ['mechanism', 'clinical_context', 'patient_friendly_summary']
        
        if not isinstance(explanation, dict):
            return False
        
        for field in required_fields:
            if field not in explanation:
                return False
            if not explanation[field] or not isinstance(explanation[field], str):
                return False
        
        return True
    
    def _fallback_explanation(
        self,
        gene: str,
        diplotype: str,
        phenotype: str,
        drug: str,
        risk_label: str
    ) -> Dict:
        """Fallback explanation when LLM fails."""
        mechanism_templates = {
            "Safe": f"The {gene} gene encodes an enzyme responsible for metabolizing {drug}. The detected {diplotype} diplotype results in {phenotype} metabolizer status, indicating normal enzyme function.",
            "Adjust Dosage": f"The {gene} {diplotype} diplotype indicates {phenotype} metabolizer status, resulting in altered {drug} metabolism. Dose adjustment is necessary to achieve optimal therapeutic effect.",
            "Toxic": f"The {gene} {diplotype} diplotype leads to {phenotype} status, causing significantly reduced metabolism of {drug}. This increases risk of drug accumulation and toxicity.",
            "Ineffective": f"The {gene} {diplotype} diplotype results in {phenotype} metabolizer status, leading to reduced activation or increased clearance of {drug}, compromising therapeutic efficacy.",
            "Unknown": f"Limited data is available for the {gene} {diplotype} diplotype in relation to {drug} metabolism. Standard clinical monitoring is recommended."
        }
        
        mechanism = mechanism_templates.get(risk_label, mechanism_templates["Unknown"])
        
        clinical_context = f"Based on CPIC guidelines, patients with {phenotype} status for {gene} require special consideration when prescribing {drug}. The recommendation aims to optimize therapeutic outcomes while minimizing adverse effects."
        
        patient_summary = f"Your genetic test shows that your body processes {drug} differently than average. Your healthcare provider will adjust your treatment plan accordingly to ensure the medication works safely and effectively for you."
        
        return {
            "mechanism": mechanism,
            "clinical_context": clinical_context,
            "patient_friendly_summary": patient_summary
        }
