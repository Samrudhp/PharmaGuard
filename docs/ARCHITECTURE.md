# 📋 System Architecture - PharmaGuard

## Overview

PharmaGuard follows a clean, modular architecture with strict separation between deterministic clinical logic and AI-generated explanations.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Upload     │  │    Select    │  │      Results         │ │
│  │   VCF File   │  │    Drug      │  │      Display         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTP POST /api/analyze
                    (multipart/form-data)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI Router (routes/analyze.py)                      │  │
│  │  • Input Validation (file type, size, format)            │  │
│  │  • Error Handling & Response Formatting                  │  │
│  │  • Quality Metrics Tracking                              │  │
│  └────────────────┬─────────────────────────────────────────┘  │
└───────────────────┼────────────────────────────────────────────┘
                    │
┌───────────────────▼────────────────────────────────────────────┐
│                    PROCESSING PIPELINE                         │
│                   (Deterministic Logic)                        │
│                                                                │
│  Step 1: VCF PARSING                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  VCFParser (services/vcf_parser.py)                      │ │
│  │  • Parse VCF v4.2 format                                 │ │
│  │  • Extract INFO tags (GENE, RS, STAR)                    │ │
│  │  • Parse genotype (GT) field                             │ │
│  │  • Filter 6 pharmacogenes                                │ │
│  │  Output: Dict[gene -> List[variants]]                    │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                        │
│  Step 2: STAR ALLELE MATCHING                                 │
│  ┌────────────────────▼─────────────────────────────────────┐ │
│  │  StarAlleleEngine (services/star_engine.py)              │ │
│  │  • Match rsID + alt to definitions                       │ │
│  │  • Check genotype (0/1, 1/1)                             │ │
│  │  • Use INFO STAR tag if present                          │ │
│  │  • Default to *1 if no match                             │ │
│  │  Data: backend/data/star_definitions.json                │ │
│  │  Output: List[star_alleles] per gene                     │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                        │
│  Step 3: DIPLOTYPE FORMATION                                  │
│  ┌────────────────────▼─────────────────────────────────────┐ │
│  │  DiplotypeEngine (services/diplotype_engine.py)          │ │
│  │  Rules:                                                   │ │
│  │  • GT 0/0 → *1/*1                                        │ │
│  │  • GT 0/1 → *1/*X                                        │ │
│  │  • GT 1/1 → *X/*X                                        │ │
│  │  • Multiple variants → combine logically                 │ │
│  │  • Ambiguous → "Unknown"                                 │ │
│  │  Output: (allele1, allele2, diplotype)                   │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                        │
│  Step 4: PHENOTYPE DETERMINATION                              │
│  ┌────────────────────▼─────────────────────────────────────┐ │
│  │  PhenotypeEngine (services/phenotype_engine.py)          │ │
│  │  Special Case: CYP2D6                                     │ │
│  │    • Activity score model                                │ │
│  │    • Sum allele function scores                          │ │
│  │    • Map to phenotype via thresholds                     │ │
│  │  Other Genes:                                             │ │
│  │    • Direct diplotype → phenotype lookup                 │ │
│  │  Data: backend/data/phenotype_tables.json                │ │
│  │  Output: (phenotype, confidence_score)                   │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                        │
│  Step 5: DRUG RISK ASSESSMENT                                 │
│  ┌────────────────────▼─────────────────────────────────────┐ │
│  │  DrugEngine (services/drug_engine.py)                    │ │
│  │  • Map phenotype + drug → clinical rule                  │ │
│  │  • Determine risk_label (Safe/Adjust/Toxic/Ineffective)  │ │
│  │  • Assign severity (none/low/moderate/high/critical)     │ │
│  │  • Return dosing recommendation                          │ │
│  │  Data: backend/data/drug_rules.json (CPIC guidelines)    │ │
│  │  Output: {risk_label, severity, recommendation}          │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                        │
│           ✅ CLINICAL DECISION COMPLETE                        │
│              (100% Deterministic - No LLM)                    │
└───────────────────────┼────────────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                  EXPLANATION LAYER (Optional)                  │
│                     (LLM Service)                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  LLMService (services/llm_service.py)                    │ │
│  │  Input from Pipeline:                                     │ │
│  │    • Gene, diplotype, phenotype                          │ │
│  │    • Drug, risk_label                                     │ │
│  │    • Recommendation                                       │ │
│  │    • Detected variants (rsIDs)                           │ │
│  │                                                           │ │
│  │  LLM Call (OpenAI GPT-3.5):                              │ │
│  │    • Generate mechanism explanation                      │ │
│  │    • Generate clinical context                           │ │
│  │    • Generate patient summary                            │ │
│  │                                                           │ │
│  │  Validation:                                             │ │
│  │    • Check JSON structure                                │ │
│  │    • Retry once if invalid                               │ │
│  │    • Fallback to templates if fail                       │ │
│  │                                                           │ │
│  │  ⚠️ IMPORTANT: LLM DOES NOT modify clinical decisions    │ │
│  │  Output: {mechanism, clinical_context, patient_summary}  │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────┬────────────────────────────────────────┘
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                   RESPONSE ASSEMBLY                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Pydantic Schema Validation (schemas/response_schema.py) │ │
│  │  • Strict field type validation                          │ │
│  │  • Enum enforcement (risk_label, severity, phenotype)    │ │
│  │  • ISO 8601 timestamp generation                         │ │
│  │  • Quality metrics population                            │ │
│  │  • Deterministic ordering (sort by gene, sort by rsid)   │ │
│  │  Output: AnalysisResponse (validated JSON)               │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Input
```
VCF File (< 5MB) + Drug Name
     ↓
Validation Layer
```

### Processing
```
Raw VCF Text
     ↓
Parsed Variants (by gene)
     ↓
Star Alleles (*1, *2, etc.)
     ↓
Diplotypes (*1/*2)
     ↓
Phenotypes (PM, IM, NM, RM, URM)
     ↓
Risk Assessment + Recommendation
```

### Output
```
Structured JSON Response
     ↓
Frontend Rendering
```

---

## Key Design Decisions

### 1. Deterministic Core Logic

**Why?**
- Clinical decisions must be reproducible
- No randomness in risk assessment
- Auditable and explainable
- Compliant with medical standards

**Implementation:**
- All clinical logic in pure Python functions
- Static JSON data files (no external APIs)
- No ML models in decision pipeline
- LLM isolated to explanation only

### 2. Modular Service Architecture

**Why?**
- Single Responsibility Principle
- Easy to test individual components
- Simple to update specific modules
- Clear separation of concerns

**Structure:**
```
services/
├── vcf_parser.py        # Only parses VCF
├── star_engine.py       # Only matches alleles
├── diplotype_engine.py  # Only forms diplotypes
├── phenotype_engine.py  # Only determines phenotypes
├── drug_engine.py       # Only applies drug rules
└── llm_service.py       # Only generates explanations
```

### 3. Static Data Files

**Why?**
- No runtime dependency on external APIs
- Fast processing (< 2 seconds)
- Offline capability
- Version controlled guidelines

**Location:**
```
data/
├── star_definitions.json    # PharmVar allele definitions
├── phenotype_tables.json    # CPIC phenotype mappings
└── drug_rules.json          # CPIC drug guidelines
```

### 4. LLM Isolation

**Why?**
- LLM failures don't affect clinical decisions
- Explanation is enhancement, not requirement
- Graceful degradation
- Optional API key

**Fallback Chain:**
```
Try OpenAI API
     ↓ (if fails)
Retry once
     ↓ (if fails again)
Use template explanation
```

### 5. Strict Schema Validation

**Why?**
- Exact field matching for hackathon tests
- Type safety
- API contract enforcement
- Client-side reliability

**Pydantic Models:**
- Literal types for enums
- Field validation
- Automatic serialization
- Documentation generation

---

## Component Responsibilities

### VCF Parser
- ✅ Parse VCF v4.2 format
- ✅ Extract INFO tags
- ✅ Parse genotype field
- ❌ Does NOT interpret clinical meaning

### Star Allele Engine
- ✅ Match variants to star allele definitions
- ✅ Handle multiple matching strategies
- ❌ Does NOT determine phenotype

### Diplotype Engine
- ✅ Form diplotypes from alleles
- ✅ Handle genotype logic (0/0, 0/1, 1/1)
- ❌ Does NOT determine clinical risk

### Phenotype Engine
- ✅ Map diplotypes to phenotypes
- ✅ Implement activity score model (CYP2D6)
- ❌ Does NOT make drug recommendations

### Drug Engine
- ✅ Apply CPIC drug guidelines
- ✅ Determine risk and recommendations
- ❌ Does NOT parse VCF or analyze variants

### LLM Service
- ✅ Generate human-readable explanations
- ✅ Provide patient-friendly summaries
- ❌ Does NOT make clinical decisions
- ❌ Does NOT override risk assessments

---

## Error Handling Strategy

### Input Validation
```python
if not file.endswith('.vcf'):
    return error("INVALID_FILE_TYPE")

if file_size > 5MB:
    return error("FILE_TOO_LARGE")
```

### Processing Errors
```python
try:
    phenotype = determine_phenotype(...)
except Exception:
    phenotype = "Unknown"
    confidence = 0.0
```

### LLM Errors
```python
try:
    explanation = call_llm(...)
except:
    explanation = fallback_template(...)
```

---

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| VCF Upload | < 100ms | Network dependent |
| VCF Parsing | < 200ms | Pure Python |
| Allele Matching | < 50ms | Dictionary lookups |
| Phenotype Determination | < 10ms | Direct mapping |
| Drug Recommendation | < 10ms | Rule application |
| LLM Explanation | 1-2s | External API call |
| **Total** | **< 2.5s** | Including LLM |

**Without LLM:** < 500ms

---

## Scalability Considerations

### Current Architecture (Hackathon)
- Single server instance
- In-memory processing
- No database
- Stateless requests

### Future Scaling (Production)
- Add database for audit logs
- Redis caching for repeated analyses
- Load balancer for multiple instances
- Queue system for batch processing
- CDN for frontend assets

---

## Security Architecture

### Input Validation
- File type checking
- File size limits (5MB)
- UTF-8 encoding validation
- VCF format verification

### Environment Variables
- API keys in .env (not in code)
- Separate dev/prod configurations
- No secrets in repository

### CORS Configuration
- Whitelist frontend domains
- No wildcard in production
- Credentials not allowed

---

## Testing Strategy

### Unit Tests (Future)
```python
# Example
def test_vcf_parser():
    result = parse_vcf(sample_vcf)
    assert 'CYP2D6' in result
    assert len(result['CYP2D6']) > 0
```

### Integration Tests
```bash
curl -X POST /api/analyze \
  -F "file=@sample.vcf" \
  -F "drug=clopidogrel"
```

### End-to-End Tests
- Upload VCF through UI
- Verify results displayed correctly
- Test all 12 drugs
- Verify JSON downloadable

---

## Maintenance & Updates

### Updating CPIC Guidelines

1. **Update Data Files**
   ```bash
   # Edit files in backend/data/
   vim backend/data/phenotype_tables.json
   vim backend/data/drug_rules.json
   ```

2. **No Code Changes Required**
   - Data-driven architecture
   - Logic remains the same
   - Deploy updated data files

3. **Version Control**
   ```bash
   git commit -m "Update CPIC guidelines to 2026 version"
   git push
   ```

### Adding New Drugs

1. Add entry to `drug_rules.json`
2. Update `SUPPORTED_DRUGS` list in frontend
3. No backend code changes needed

### Adding New Genes

1. Add to `star_definitions.json`
2. Add to `phenotype_tables.json`
3. Update `SUPPORTED_GENES` in `vcf_parser.py`
4. Add drug mappings

---

## Architecture Benefits

✅ **Modular** - Easy to update individual components
✅ **Testable** - Each service independently testable
✅ **Safe** - Deterministic clinical decisions
✅ **Extensible** - Data-driven guideline updates
✅ **Maintainable** - Clear separation of concerns
✅ **Reliable** - Graceful fallbacks at every level
✅ **Fast** - Sub-2-second processing
✅ **Auditable** - Traceable decision path

---

**This architecture ensures PharmaGuard is both hackathon-ready and production-capable!**
