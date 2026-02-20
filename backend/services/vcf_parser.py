from typing import List, Dict


SUPPORTED_GENES = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"]


class VCFParser:
    def __init__(self):
        self.supported_genes = SUPPORTED_GENES
    
    def parse_vcf(self, file_content: str) -> Dict[str, List[Dict]]:
        """
        Parse VCF file and extract variants for supported genes.
        
        Returns: Dict with gene names as keys and list of variants as values
        """
        variants_by_gene = {gene: [] for gene in self.supported_genes}
        lines = file_content.strip().split('\n')
        
        for line in lines:
            if line.startswith('#'):
                continue
            
            variant = self._parse_variant_line(line)
            if variant and variant['gene'] in self.supported_genes:
                variants_by_gene[variant['gene']].append(variant)
        
        return variants_by_gene
    
    def _parse_variant_line(self, line: str) -> Dict:
        """Parse a single VCF variant line."""
        if not line.strip():
            return None
        
        try:
            fields = line.split('\t')
            if len(fields) < 9:
                return None
            
            chrom = fields[0]
            pos = fields[1]
            rsid = fields[2] if fields[2] != '.' else None
            ref = fields[3]
            alt = fields[4]
            info = fields[7]
            format_field = fields[8]
            sample = fields[9] if len(fields) > 9 else None
            
            # Extract INFO tags
            info_dict = self._parse_info(info)
            gene = info_dict.get('GENE')
            star = info_dict.get('STAR')
            rs = info_dict.get('RS', rsid)
            
            # Extract genotype
            genotype = self._extract_genotype(format_field, sample)
            
            if not gene:
                return None
            
            return {
                'chrom': chrom,
                'pos': pos,
                'rsid': rs,
                'ref': ref,
                'alt': alt,
                'gene': gene,
                'star': star,
                'genotype': genotype
            }
        except Exception as e:
            return None
    
    def _parse_info(self, info_str: str) -> Dict:
        """Parse INFO field into dictionary."""
        info_dict = {}
        for item in info_str.split(';'):
            if '=' in item:
                key, value = item.split('=', 1)
                info_dict[key] = value
            else:
                info_dict[item] = True
        return info_dict
    
    def _extract_genotype(self, format_field: str, sample: str) -> str:
        """Extract genotype (GT) from sample field."""
        if not sample or not format_field:
            return "Unknown"
        
        format_keys = format_field.split(':')
        sample_values = sample.split(':')
        
        if 'GT' in format_keys:
            gt_index = format_keys.index('GT')
            if gt_index < len(sample_values):
                gt = sample_values[gt_index]
                # Normalize genotype separators
                return gt.replace('|', '/')
        
        return "Unknown"
    
    def validate_vcf_header(self, content: str) -> bool:
        """Validate VCF file has proper header."""
        lines = content.split('\n')
        for line in lines[:20]:
            if line.startswith('##fileformat=VCF'):
                return True
        return False
