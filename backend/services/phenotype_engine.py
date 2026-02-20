import json
import os
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


class PhenotypeEngine:
    def __init__(self, use_api=False):
        # Always static — no runtime PharmVar API calls
        self.phenotype_tables = self._load_phenotype_tables()

    def _load_phenotype_tables(self) -> dict:
        """Load phenotype tables from static JSON."""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'data',
            'phenotype_tables.json'
        )
        with open(data_path, 'r') as f:
            return json.load(f)

    def determine_phenotype(
        self,
        gene: str,
        diplotype: str,
        star_allele_1: str,
        star_allele_2: str
    ) -> Tuple[str, float]:
        """
        Determine phenotype from gene and diplotype.

        Returns: (phenotype, confidence_score)
        """
        if gene not in self.phenotype_tables:
            return ("Unknown", 0.0)

        if diplotype == "Unknown":
            return ("Unknown", 0.0)

        # CYP2D6 uses activity-score model with explicit boundaries
        if gene == "CYP2D6":
            return self._cyp2d6_phenotype(star_allele_1, star_allele_2)

        # All other genes: direct diplotype table lookup
        gene_table = self.phenotype_tables[gene]

        normalized = self._normalize_diplotype(diplotype)
        if normalized in gene_table:
            return (gene_table[normalized], 1.0)

        reversed_d = self._reverse_diplotype(normalized)
        if reversed_d in gene_table:
            return (gene_table[reversed_d], 1.0)

        return ("Unknown", 0.0)

    def _cyp2d6_phenotype(
        self,
        allele_1: str,
        allele_2: str
    ) -> Tuple[str, float]:
        """
        CYP2D6 activity score model with explicit CPIC boundary logic.

        Thresholds (CPIC guidelines):
          score == 0          → PM  (Poor Metabolizer)
          0 < score < 1.25    → IM  (Intermediate Metabolizer)
          1.25 <= score <= 2.25 → NM (Normal Metabolizer)
          score > 2.25        → URM (Ultrarapid Metabolizer)
        """
        activity_scores = self.phenotype_tables['CYP2D6']['activity_scores']

        # Use static scores; default 1.0 for unknown alleles
        score_1 = activity_scores.get(allele_1, 1.0)
        score_2 = activity_scores.get(allele_2, 1.0)
        total = score_1 + score_2

        # Confidence: lower if alleles aren't in the table
        known_1 = allele_1 in activity_scores
        known_2 = allele_2 in activity_scores
        confidence = 1.0 if (known_1 and known_2) else (0.5 if (known_1 or known_2) else 0.0)

        if total == 0:
            phenotype = "PM"
        elif 0 < total < 1.25:
            phenotype = "IM"
        elif 1.25 <= total <= 2.25:
            phenotype = "NM"
        elif total > 2.25:
            phenotype = "URM"
        else:
            phenotype = "Unknown"

        logger.debug(
            f"CYP2D6 activity: {allele_1}({score_1}) + {allele_2}({score_2}) "
            f"= {total} → {phenotype}"
        )
        return (phenotype, confidence)

    def _normalize_diplotype(self, diplotype: str) -> str:
        """Normalize diplotype order (lower number first)."""
        if '/' not in diplotype:
            return diplotype
        alleles = diplotype.split('/')
        sorted_alleles = sorted(alleles, key=self._sort_allele)
        return f"{sorted_alleles[0]}/{sorted_alleles[1]}"

    def _reverse_diplotype(self, diplotype: str) -> str:
        """Reverse diplotype order."""
        if '/' not in diplotype:
            return diplotype
        alleles = diplotype.split('/')
        return f"{alleles[1]}/{alleles[0]}"

    def _sort_allele(self, allele: str) -> int:
        """Sort key for alleles — *1 first, then numeric order."""
        if allele == "*1":
            return 0
        try:
            num = allele.replace('*', '').replace('A', '').replace('B', '').replace('C', '')
            return int(num)
        except Exception:
            return 9999
