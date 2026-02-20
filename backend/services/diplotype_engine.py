from typing import List, Tuple


class DiplotypeEngine:
    def __init__(self):
        pass
    
    def form_diplotype(
        self,
        star_alleles: List[str],
        variants: List[dict]
    ) -> Tuple[str, str, str]:
        """
        Form diplotype from star alleles and variants.
        
        Returns: (star_allele_1, star_allele_2, diplotype_string)
        """
        if not star_alleles:
            return ("*1", "*1", "*1/*1")
        
        # Check if we have clear genotype information
        genotype_info = self._analyze_genotypes(variants)
        
        if len(star_alleles) == 1:
            allele = star_alleles[0]
            return self._form_from_single_allele(allele, genotype_info)
        
        elif len(star_alleles) == 2:
            allele1, allele2 = sorted(star_alleles)
            diplotype = f"{allele1}/{allele2}"
            return (allele1, allele2, diplotype)
        
        else:
            # Multiple alleles detected - ambiguous
            return ("Unknown", "Unknown", "Unknown")
    
    def _analyze_genotypes(self, variants: List[dict]) -> dict:
        """Analyze genotype patterns in variants."""
        genotype_counts = {
            '0/0': 0,
            '0/1': 0,
            '1/0': 0,
            '1/1': 0,
            'Unknown': 0
        }
        
        for variant in variants:
            gt = variant.get('genotype', 'Unknown')
            if gt in genotype_counts:
                genotype_counts[gt] += 1
            else:
                genotype_counts['Unknown'] += 1
        
        # Determine if homozygous or heterozygous
        has_homozygous = genotype_counts['1/1'] > 0
        has_heterozygous = (genotype_counts['0/1'] + genotype_counts['1/0']) > 0
        all_reference = genotype_counts['0/0'] == len(variants)
        
        return {
            'has_homozygous': has_homozygous,
            'has_heterozygous': has_heterozygous,
            'all_reference': all_reference,
            'counts': genotype_counts
        }
    
    def _form_from_single_allele(
        self,
        allele: str,
        genotype_info: dict
    ) -> Tuple[str, str, str]:
        """Form diplotype when single variant allele detected."""
        if genotype_info['all_reference']:
            # All 0/0 - homozygous reference
            return ("*1", "*1", "*1/*1")
        
        elif genotype_info['has_homozygous']:
            # 1/1 - homozygous variant
            diplotype = f"{allele}/{allele}"
            return (allele, allele, diplotype)
        
        elif genotype_info['has_heterozygous']:
            # 0/1 or 1/0 - heterozygous
            diplotype = f"*1/{allele}"
            return ("*1", allele, diplotype)
        
        else:
            # Unclear - default to heterozygous
            diplotype = f"*1/{allele}"
            return ("*1", allele, diplotype)
    
    def normalize_diplotype(self, diplotype: str) -> str:
        """Normalize diplotype order (lower number first)."""
        if '/' not in diplotype:
            return diplotype
        
        alleles = diplotype.split('/')
        if len(alleles) != 2:
            return diplotype
        
        # Sort star alleles
        sorted_alleles = sorted(alleles, key=self._allele_sort_key)
        return f"{sorted_alleles[0]}/{sorted_alleles[1]}"
    
    def _allele_sort_key(self, allele: str) -> int:
        """Generate sort key for star allele."""
        if allele == "*1":
            return 0
        elif allele == "Unknown":
            return 9999
        else:
            # Extract number from star allele (e.g., *2 -> 2)
            try:
                num_part = allele.replace('*', '').replace('A', '').replace('B', '').replace('C', '')
                return int(num_part)
            except:
                return 9998
