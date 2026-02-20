import json
import os
from typing import Dict, Tuple


class DrugEngine:
    def __init__(self):
        self.drug_rules = self._load_drug_rules()
        self.gene_drug_mapping = self._build_gene_drug_mapping()
    
    def _load_drug_rules(self) -> dict:
        """Load drug decision rules from JSON."""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'data',
            'drug_rules.json'
        )
        with open(data_path, 'r') as f:
            return json.load(f)
    
    def _build_gene_drug_mapping(self) -> Dict[str, list]:
        """Build mapping of drugs to genes."""
        mapping = {}
        for gene, drugs in self.drug_rules.items():
            for drug in drugs.keys():
                if drug not in mapping:
                    mapping[drug] = []
                mapping[drug].append(gene)
        return mapping
    
    def get_relevant_gene(self, drug: str) -> str:
        """Get the primary gene for a drug."""
        drug_lower = drug.lower()
        genes = self.gene_drug_mapping.get(drug_lower, [])
        return genes[0] if genes else None
    
    def get_drug_recommendation(
        self,
        drug: str,
        gene: str,
        phenotype: str,
        confidence_score: float
    ) -> Dict:
        """
        Get drug-specific recommendation based on phenotype.
        
        Returns: Dict with risk_label, severity, recommendation
        """
        drug_lower = drug.lower()
        
        if gene not in self.drug_rules:
            return self._unknown_recommendation(confidence_score)
        
        gene_rules = self.drug_rules[gene]
        
        if drug_lower not in gene_rules:
            return self._unknown_recommendation(confidence_score)
        
        drug_rules = gene_rules[drug_lower]
        
        if phenotype not in drug_rules:
            return self._unknown_recommendation(confidence_score)
        
        rule = drug_rules[phenotype]
        
        return {
            'risk_label': rule['risk_label'],
            'severity': rule['severity'],
            'recommendation': rule['recommendation'],
            'confidence_score': confidence_score
        }
    
    def _unknown_recommendation(self, confidence_score: float) -> Dict:
        """Default recommendation when no rule matches."""
        return {
            'risk_label': 'Unknown',
            'severity': 'none',
            'recommendation': 'Insufficient pharmacogenomic data. Use standard dosing with clinical monitoring.',
            'confidence_score': 0.0
        }
    
    def is_drug_supported(self, drug: str) -> bool:
        """Check if drug is supported."""
        drug_lower = drug.lower()
        return drug_lower in self.gene_drug_mapping
    
    def get_supported_drugs(self) -> list:
        """Get list of all supported drugs."""
        return sorted(list(self.gene_drug_mapping.keys()))
    
    def format_clinical_recommendation(
        self,
        recommendation: str,
        risk_label: str,
        severity: str
    ) -> Dict:
        """Format recommendation into structured clinical guidance."""
        parts = self._split_recommendation(recommendation)
        
        return {
            'summary': parts['summary'],
            'dosing': parts['dosing'],
            'monitoring': parts['monitoring']
        }
    
    def _split_recommendation(self, recommendation: str) -> Dict:
        """Split recommendation into structured parts."""
        sentences = recommendation.split('. ')
        
        summary = sentences[0] if len(sentences) > 0 else recommendation
        dosing = '. '.join(sentences[:-1]) if len(sentences) > 1 else recommendation
        monitoring = sentences[-1] if len(sentences) > 1 else "Standard clinical monitoring recommended."
        
        return {
            'summary': summary,
            'dosing': dosing,
            'monitoring': monitoring
        }
