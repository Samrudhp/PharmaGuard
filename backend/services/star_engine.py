import json
import os
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class StarAlleleEngine:
    def __init__(self, use_api=False):
        # Always use static JSON — no runtime API calls
        self.star_definitions = self._load_from_static_json()

    def _load_from_static_json(self) -> Dict:
        """Load star allele definitions from static JSON file."""
        data_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'data',
            'star_definitions.json'
        )
        with open(data_path, 'r') as f:
            return json.load(f)

    def determine_star_alleles(
        self,
        gene: str,
        variants: List[Dict]
    ) -> List[str]:
        """
        Determine star alleles for a gene based on variants.

        Rules:
          - A star allele is assigned only if ALL its defining variants
            are present with the correct ALT allele and a non-ref genotype.
          - Among matching alleles, the most specific wins
            (largest number of defining variants).
          - If no match, default to *1.

        Returns: List of star allele names (e.g., ["*1", "*2"])
        """
        if gene not in self.star_definitions:
            return ["*1"]

        if not variants:
            return ["*1"]

        # Check if INFO STAR tag is present — use directly
        star_from_info = self._get_star_from_info(variants)
        if star_from_info:
            return star_from_info

        gene_definitions = self.star_definitions[gene]

        # Collect all fully-matching alleles with their specificity score
        matches: List[tuple] = []  # (allele_name, variant_count)
        for star_allele, definition in gene_definitions.items():
            if self._matches_star_definition(variants, definition):
                matches.append((star_allele, len(definition)))

        if not matches:
            return ["*1"]

        # Specificity priority: keep only the most specific (most variants)
        max_specificity = max(count for _, count in matches)
        best_alleles = sorted(
            [allele for allele, count in matches if count == max_specificity]
        )
        return best_alleles

    def _get_star_from_info(self, variants: List[Dict]) -> List[str]:
        """Extract star alleles from INFO STAR tag if present."""
        stars = set()
        for variant in variants:
            if variant.get('star'):
                stars.add(variant['star'])
        if stars:
            return sorted(list(stars))
        return []

    def _matches_star_definition(
        self,
        variants: List[Dict],
        definition: List[Dict]
    ) -> bool:
        """
        Return True only if ALL variants in the definition are present
        in the patient variants with a non-reference genotype (GT contains
        at least one copy of ALT allele).
        """
        for def_variant in definition:
            found = False
            for variant in variants:
                if (variant['rsid'] == def_variant['rsid'] and
                        variant['alt'] == def_variant['alt']):
                    gt = variant.get('genotype', '')
                    # Accept any genotype that carries the alt allele
                    if '1' in gt or '2' in gt:
                        found = True
                        break
            if not found:
                return False
        return True

    def get_alleles_from_genotype(
        self,
        gene: str,
        variants: List[Dict]
    ) -> Dict[str, any]:
        """
        Get complete allele information including genotype context.

        Returns: Dict with alleles and their associated variants
        """
        star_alleles = self.determine_star_alleles(gene, variants)

        return {
            'star_alleles': star_alleles,
            'variants': variants,
            'reference_count': self._count_reference_alleles(variants)
        }

    def _count_reference_alleles(self, variants: List[Dict]) -> int:
        """Count reference alleles based on genotypes."""
        ref_count = 0
        for variant in variants:
            gt = variant.get('genotype', '')
            if gt == '0/0':
                ref_count += 2
            elif gt in ['0/1', '1/0']:
                ref_count += 1
        return ref_count
