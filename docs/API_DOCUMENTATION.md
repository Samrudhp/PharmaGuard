# API Documentation - PharmaGuard

## Base URL
```
Development: http://localhost:8000
Production: [Your deployed URL]
```

## Authentication
Currently no authentication required. For production, consider implementing OAuth2 or API keys.

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "PharmaGuard API"
}
```

---

### 2. Root Information

**GET** `/`

Get API information.

**Response:**
```json
{
  "message": "PharmaGuard API",
  "version": "1.0.0",
  "status": "running"
}
```

---

### 3. Analyze VCF

**POST** `/api/analyze`

Analyze VCF file and provide pharmacogenomic recommendations.

**Request:**

Content-Type: `multipart/form-data`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | VCF file (.vcf extension, max 5MB) |
| drug | String | Yes | Drug name (lowercase) |

**Example using cURL:**
```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@sample_patient.vcf" \
  -F "drug=clopidogrel"
```

**Example using Python:**
```python
import requests

url = "http://localhost:8000/api/analyze"
files = {"file": open("sample_patient.vcf", "rb")}
data = {"drug": "clopidogrel"}

response = requests.post(url, files=files, data=data)
print(response.json())
```

**Example using JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('drug', 'clopidogrel');

fetch('http://localhost:8000/api/analyze', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

**Successful Response (200):**
```json
{
  "patient_id": "123e4567-e89b-12d3-a456-426614174000",
  "drug": "clopidogrel",
  "timestamp": "2026-02-19T10:30:45Z",
  "risk_assessment": {
    "risk_label": "Ineffective",
    "severity": "critical",
    "confidence_score": 1.0
  },
  "pharmacogenomic_profile": [
    {
      "gene": "CYP2C19",
      "star_allele_1": "*1",
      "star_allele_2": "*2",
      "diplotype": "*1/*2",
      "phenotype": "IM",
      "detected_variants": [
        {
          "rsid": "rs4244285",
          "gene": "CYP2C19",
          "ref": "G",
          "alt": "A",
          "genotype": "0/1",
          "star_allele": "*2"
        }
      ]
    }
  ],
  "clinical_recommendation": {
    "summary": "Consider alternative antiplatelet therapy",
    "dosing_guidance": "If clopidogrel used, increase dose or monitor closely",
    "monitoring_requirements": "Monitor closely for reduced efficacy"
  },
  "llm_generated_explanation": {
    "mechanism": "The CYP2C19 gene encodes...",
    "clinical_context": "Based on CPIC guidelines...",
    "patient_friendly_summary": "Your genetic test shows..."
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "gene_variants_found": true,
    "star_allele_determined": true,
    "phenotype_determined": true,
    "recommendation_generated": true,
    "llm_explanation_generated": true
  }
}
```

**Error Responses:**

**400 - Invalid Input**
```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Invalid file type",
    "details": "File must have .vcf extension"
  }
}
```

**400 - File Too Large**
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds limit",
    "details": "Maximum file size is 5MB. Your file is 7.23MB"
  }
}
```

**400 - Unsupported Drug**
```json
{
  "error": {
    "code": "UNSUPPORTED_DRUG",
    "message": "Drug 'aspirin' is not supported",
    "details": "Supported drugs: azathioprine, atorvastatin, capecitabine..."
  }
}
```

**500 - Internal Server Error**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error",
    "details": "Error details here"
  }
}
```

---

## Data Models

### AnalysisResponse

| Field | Type | Description |
|-------|------|-------------|
| patient_id | string | Unique patient identifier (UUID) |
| drug | string | Drug name analyzed |
| timestamp | string | ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ) |
| risk_assessment | RiskAssessment | Risk evaluation |
| pharmacogenomic_profile | GeneProfile[] | Array of gene profiles |
| clinical_recommendation | ClinicalRecommendation | Clinical guidance |
| llm_generated_explanation | LLMExplanation | AI-generated explanation |
| quality_metrics | QualityMetrics | Analysis quality indicators |

### RiskAssessment

| Field | Type | Possible Values |
|-------|------|-----------------|
| risk_label | string | Safe, Adjust Dosage, Toxic, Ineffective, Unknown |
| severity | string | none, low, moderate, high, critical |
| confidence_score | float | 0.0 to 1.0 |

### GeneProfile

| Field | Type | Description |
|-------|------|-------------|
| gene | string | Gene name (CYP2D6, etc.) |
| star_allele_1 | string | First star allele |
| star_allele_2 | string | Second star allele |
| diplotype | string | Combined diplotype (e.g., *1/*2) |
| phenotype | string | PM, IM, NM, RM, URM, Unknown |
| detected_variants | DetectedVariant[] | Array of variants |

### DetectedVariant

| Field | Type | Description |
|-------|------|-------------|
| rsid | string | dbSNP rsID |
| gene | string | Gene name |
| ref | string | Reference allele |
| alt | string | Alternate allele |
| genotype | string | Genotype (0/0, 0/1, 1/1) |
| star_allele | string | Associated star allele |

### ClinicalRecommendation

| Field | Type | Description |
|-------|------|-------------|
| summary | string | Brief recommendation summary |
| dosing_guidance | string | Specific dosing instructions |
| monitoring_requirements | string | Required monitoring |

### LLMExplanation

| Field | Type | Description |
|-------|------|-------------|
| mechanism | string | Molecular mechanism explanation |
| clinical_context | string | Clinical implications |
| patient_friendly_summary | string | Patient-understandable explanation |

### QualityMetrics

| Field | Type | Description |
|-------|------|-------------|
| vcf_parsing_success | boolean | VCF parsed successfully |
| gene_variants_found | boolean | Variants detected |
| star_allele_determined | boolean | Star alleles matched |
| phenotype_determined | boolean | Phenotype assigned |
| recommendation_generated | boolean | Clinical rule applied |
| llm_explanation_generated | boolean | Explanation created |

---

## Supported Drugs

Complete list of supported drugs (case-insensitive):

- azathioprine
- atorvastatin
- capecitabine
- clopidogrel
- codeine
- escitalopram
- fluorouracil
- mercaptopurine
- phenytoin
- simvastatin
- tramadol
- warfarin

---

## Supported Genes

- CYP2D6 (Codeine, Tramadol)
- CYP2C19 (Clopidogrel, Escitalopram)
- CYP2C9 (Warfarin, Phenytoin)
- SLCO1B1 (Simvastatin, Atorvastatin)
- TPMT (Azathioprine, Mercaptopurine)
- DPYD (Fluorouracil, Capecitabine)

---

## Rate Limits

Currently no rate limits. For production deployment, consider implementing:
- 100 requests per minute per IP
- 1000 requests per day per user

---

## CORS Configuration

Default allowed origins: `http://localhost:3000`

Configure additional origins via `CORS_ORIGINS` environment variable.

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_FILE_TYPE | 400 | File is not .vcf |
| FILE_TOO_LARGE | 400 | File exceeds 5MB |
| INVALID_ENCODING | 400 | File not UTF-8 encoded |
| INVALID_VCF_FORMAT | 400 | Missing VCF header |
| INVALID_DRUG | 400 | Drug name empty |
| UNSUPPORTED_DRUG | 400 | Drug not in database |
| MISSING_INPUT | 400 | File or drug missing |
| NETWORK_ERROR | N/A | Cannot connect to server |
| INTERNAL_ERROR | 500 | Server processing error |

---

## Testing Examples

### Test Case 1: Successful Analysis
```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@sample_patient.vcf" \
  -F "drug=clopidogrel"
```

Expected: 200 OK with full analysis

### Test Case 2: Invalid File Type
```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@test.txt" \
  -F "drug=clopidogrel"
```

Expected: 400 with INVALID_FILE_TYPE error

### Test Case 3: Unsupported Drug
```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@sample_patient.vcf" \
  -F "drug=aspirin"
```

Expected: 400 with UNSUPPORTED_DRUG error

---

## Change Log

### v1.0.0 (2026-02-19)
- Initial release
- Support for 6 genes and 12 drugs
- CPIC guideline implementation
- LLM explanation generation

---

For additional support, please refer to the main README or contact the development team.
