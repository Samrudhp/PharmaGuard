from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from datetime import datetime
from typing import List
import uuid

from services.vcf_parser import VCFParser
from services.star_engine import StarAlleleEngine
from services.diplotype_engine import DiplotypeEngine
from services.phenotype_engine import PhenotypeEngine
from services.drug_engine import DrugEngine
from services.llm_service import LLMService
from services.web_search_service import WebSearchService
from schemas.response_schema import (
    AnalysisResponse,
    GeneProfile,
    DetectedVariant,
    RiskAssessment,
    ClinicalRecommendation,
    LLMExplanation,
    QualityMetrics,
    ErrorResponse
)

router = APIRouter()

# Initialize services — static JSON only (no runtime API calls)
vcf_parser = VCFParser()
star_engine = StarAlleleEngine(use_api=False)
diplotype_engine = DiplotypeEngine()
phenotype_engine = PhenotypeEngine(use_api=False)
drug_engine = DrugEngine()
llm_service = LLMService()
web_search_service = WebSearchService()

# File size limit (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/analyze", response_model=List[AnalysisResponse])
async def analyze_vcf(
    file: UploadFile = File(...),
    drug: str = Form(...)
):
    """
    Analyze VCF file and provide pharmacogenomic recommendations.

    Accepts a single drug name or comma-separated list of drugs.
    Always returns a list of AnalysisResponse objects (one per drug).
    """
    # Step 1: Validate input
    try:
        validation_result = await validate_input(file, drug)
        if not validation_result['valid']:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "code": validation_result['code'],
                        "message": validation_result['message'],
                        "details": validation_result['details']
                    }
                }
            )

        file_content = validation_result['content']

        # Step 2: Parse VCF once (shared across all drugs)
        variants_by_gene = vcf_parser.parse_vcf(file_content)

        # Step 3: Build pharmacogenomic profile (shared across all drugs)
        pharmacogenomic_profile = _build_pharmacogenomic_profile(variants_by_gene)

        # Step 4: Process each drug
        drugs = [d.strip() for d in drug.split(',') if d.strip()]
        results = []
        for single_drug in drugs:
            result = _analyze_single_drug(
                single_drug,
                variants_by_gene,
                pharmacogenomic_profile
            )
            results.append(result)

        return results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Internal server error",
                    "details": str(e)
                }
            }
        )


def _build_pharmacogenomic_profile(variants_by_gene: dict) -> List[GeneProfile]:
    """
    Build a complete pharmacogenomic profile for all supported genes.
    This is computed once and shared across all drug analyses.
    """
    profile = []

    for gene in vcf_parser.supported_genes:
        variants = variants_by_gene[gene]

        # Determine star alleles (ALL required variants must match)
        star_alleles = star_engine.determine_star_alleles(gene, variants)

        # Form diplotype
        star_allele_1, star_allele_2, diplotype = diplotype_engine.form_diplotype(
            star_alleles, variants
        )

        # Determine phenotype
        phenotype, confidence = phenotype_engine.determine_phenotype(
            gene, diplotype, star_allele_1, star_allele_2
        )

        # Build detected variants list
        detected_variants = []
        for variant in variants:
            detected_variants.append(DetectedVariant(
                rsid=variant['rsid'] or 'Unknown',
                gene=variant['gene'],
                ref=variant['ref'],
                alt=variant['alt'],
                genotype=variant['genotype'],
                star_allele=star_alleles[0] if star_alleles else '*1'
            ))

        detected_variants.sort(key=lambda x: x.rsid)

        gene_profile = GeneProfile(
            gene=gene,
            star_allele_1=star_allele_1,
            star_allele_2=star_allele_2,
            diplotype=diplotype,
            phenotype=phenotype,
            detected_variants=detected_variants
        )
        profile.append(gene_profile)

    profile.sort(key=lambda x: x.gene)
    return profile


def _analyze_single_drug(
    drug: str,
    variants_by_gene: dict,
    pharmacogenomic_profile: List[GeneProfile]
) -> AnalysisResponse:
    """
    Run drug-specific recommendation and LLM explanation for one drug.
    Raises HTTPException on unsupported drug.
    Clinical decision (risk_label, phenotype) is deterministic;
    LLM only generates explanation text.
    """
    quality_metrics = {
        'vcf_parsing_success': True,
        'gene_variants_found': sum(len(v) for v in variants_by_gene.values()) > 0,
        'star_allele_determined': False,
        'phenotype_determined': False,
        'recommendation_generated': False,
        'llm_explanation_generated': False
    }

    # Identify relevant gene for this drug
    relevant_gene = drug_engine.get_relevant_gene(drug)
    if not relevant_gene:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "UNSUPPORTED_DRUG",
                    "message": f"Drug '{drug}' is not supported",
                    "details": f"Supported drugs: {', '.join(drug_engine.get_supported_drugs())}"
                }
            }
        )

    # Find relevant gene profile
    relevant_profile = next(
        (p for p in pharmacogenomic_profile if p.gene == relevant_gene),
        None
    )
    if not relevant_profile:
        raise HTTPException(status_code=500, detail="Failed to generate gene profile")

    # Update quality flags
    quality_metrics['star_allele_determined'] = relevant_profile.diplotype != "Unknown"
    quality_metrics['phenotype_determined'] = relevant_profile.phenotype != "Unknown"

    # Retrieve phenotype confidence
    _, phenotype_confidence = phenotype_engine.determine_phenotype(
        relevant_gene,
        relevant_profile.diplotype,
        relevant_profile.star_allele_1,
        relevant_profile.star_allele_2
    )

    # Get deterministic drug recommendation (LLM must NOT change these values)
    drug_rec = drug_engine.get_drug_recommendation(
        drug, relevant_gene, relevant_profile.phenotype, phenotype_confidence
    )
    quality_metrics['recommendation_generated'] = True

    # Web search for optional additional context (non-blocking; errors silenced)
    web_search_results = web_search_service.search_pharmacogenomics_context(
        gene=relevant_gene,
        diplotype=relevant_profile.diplotype,
        phenotype=relevant_profile.phenotype,
        drug=drug,
        max_results=3
    )
    web_context = web_search_service.format_search_results_for_llm(web_search_results)

    # LLM generates explanation text ONLY — does not affect clinical decision
    llm_explanation_data = llm_service.generate_explanation(
        relevant_gene,
        relevant_profile.diplotype,
        relevant_profile.phenotype,
        drug,
        drug_rec['risk_label'],
        drug_rec['recommendation'],
        variants_by_gene[relevant_gene],
        web_search_results=web_context
    )
    quality_metrics['llm_explanation_generated'] = True

    # Build response objects
    risk_assessment = RiskAssessment(
        risk_label=drug_rec['risk_label'],
        severity=drug_rec['severity'],
        confidence_score=min(max(drug_rec['confidence_score'], 0.0), 1.0)
    )

    clinical_rec = drug_engine.format_clinical_recommendation(
        drug_rec['recommendation'],
        drug_rec['risk_label'],
        drug_rec['severity']
    )
    clinical_recommendation = ClinicalRecommendation(
        summary=clinical_rec['summary'],
        dosing_guidance=clinical_rec['dosing'],
        monitoring_requirements=clinical_rec['monitoring']
    )

    llm_explanation = LLMExplanation(
        mechanism=llm_explanation_data['mechanism'],
        clinical_context=llm_explanation_data['clinical_context'],
        patient_friendly_summary=llm_explanation_data['patient_friendly_summary']
    )

    return AnalysisResponse(
        patient_id=str(uuid.uuid4()),
        drug=drug,
        timestamp=datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        risk_assessment=risk_assessment,
        pharmacogenomic_profile=pharmacogenomic_profile,
        clinical_recommendation=clinical_recommendation,
        llm_generated_explanation=llm_explanation,
        quality_metrics=QualityMetrics(**quality_metrics)
    )


async def validate_input(file: UploadFile, drug: str) -> dict:
    """Validate input file and drug."""
    if not file.filename.endswith('.vcf'):
        return {
            'valid': False,
            'code': 'INVALID_FILE_TYPE',
            'message': 'Invalid file type',
            'details': 'File must have .vcf extension'
        }

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        return {
            'valid': False,
            'code': 'FILE_TOO_LARGE',
            'message': 'File size exceeds limit',
            'details': f'Maximum file size is 5MB. Your file is {len(content) / 1024 / 1024:.2f}MB'
        }

    try:
        content_str = content.decode('utf-8')
    except UnicodeDecodeError:
        return {
            'valid': False,
            'code': 'INVALID_ENCODING',
            'message': 'File encoding error',
            'details': 'File must be UTF-8 encoded'
        }

    if not vcf_parser.validate_vcf_header(content_str):
        return {
            'valid': False,
            'code': 'INVALID_VCF_FORMAT',
            'message': 'Invalid VCF format',
            'details': 'File does not contain valid VCF v4.2 header'
        }

    if not drug or not drug.strip():
        return {
            'valid': False,
            'code': 'INVALID_DRUG',
            'message': 'Drug name is required',
            'details': 'Please provide a valid drug name'
        }

    return {
        'valid': True,
        'content': content_str
    }
