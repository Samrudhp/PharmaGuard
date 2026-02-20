from pydantic import BaseModel, Field
from typing import List, Literal
from datetime import datetime


class DetectedVariant(BaseModel):
    rsid: str
    gene: str
    ref: str
    alt: str
    genotype: str
    star_allele: str


class GeneProfile(BaseModel):
    gene: str
    star_allele_1: str
    star_allele_2: str
    diplotype: str
    phenotype: Literal["PM", "IM", "NM", "RM", "URM", "Unknown"]
    detected_variants: List[DetectedVariant]


class RiskAssessment(BaseModel):
    risk_label: Literal["Safe", "Adjust Dosage", "Toxic", "Ineffective", "Unknown"]
    severity: Literal["none", "low", "moderate", "high", "critical"]
    confidence_score: float = Field(ge=0.0, le=1.0)


class ClinicalRecommendation(BaseModel):
    summary: str
    dosing_guidance: str
    monitoring_requirements: str


class LLMExplanation(BaseModel):
    mechanism: str
    clinical_context: str
    patient_friendly_summary: str


class QualityMetrics(BaseModel):
    vcf_parsing_success: bool
    gene_variants_found: bool
    star_allele_determined: bool
    phenotype_determined: bool
    recommendation_generated: bool
    llm_explanation_generated: bool


class AnalysisResponse(BaseModel):
    patient_id: str
    drug: str
    timestamp: str
    risk_assessment: RiskAssessment
    pharmacogenomic_profile: List[GeneProfile]
    clinical_recommendation: ClinicalRecommendation
    llm_generated_explanation: LLMExplanation
    quality_metrics: QualityMetrics


class ErrorResponse(BaseModel):
    error: dict = Field(
        ...,
        description="Error details",
        example={
            "code": "INVALID_FILE",
            "message": "File validation failed",
            "details": "File size exceeds 5MB limit"
        }
    )
