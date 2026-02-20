import requests
import time
from typing import Dict, List, Optional
from cachetools import TTLCache
import logging

logger = logging.getLogger(__name__)

# PharmVar API base URL
PHARMVAR_BASE_URL = "https://www.pharmvar.org/api-service"

# Cache for API responses (TTL: 1 hour, max 1000 items)
# This helps avoid rate limits (2 calls/second)
api_cache = TTLCache(maxsize=1000, ttl=3600)

# Rate limiting
last_request_time = 0
MIN_REQUEST_INTERVAL = 0.5  # 2 requests per second max


class PharmVarService:
    """Service to interact with PharmVar API for dynamic data fetching."""
    
    def __init__(self):
        self.base_url = PHARMVAR_BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'PharmaGuard/1.0'
        })
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits (2 calls/second)."""
        global last_request_time
        current_time = time.time()
        time_since_last = current_time - last_request_time
        
        if time_since_last < MIN_REQUEST_INTERVAL:
            time.sleep(MIN_REQUEST_INTERVAL - time_since_last)
        
        last_request_time = time.time()
    
    def _get(self, endpoint: str) -> Optional[Dict]:
        """Make a GET request to PharmVar API with caching and rate limiting."""
        cache_key = f"pharmvar:{endpoint}"
        
        # Check cache first
        if cache_key in api_cache:
            logger.info(f"Cache hit for {endpoint}")
            return api_cache[cache_key]
        
        # Rate limit
        self._rate_limit()
        
        try:
            url = f"{self.base_url}{endpoint}"
            logger.info(f"Fetching from PharmVar: {url}")
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            api_cache[cache_key] = data
            return data
        
        except requests.exceptions.RequestException as e:
            logger.error(f"PharmVar API error for {endpoint}: {e}")
            return None
    
    def get_gene_info(self, gene_symbol: str) -> Optional[Dict]:
        """Get gene information from PharmVar."""
        return self._get(f"/genes/{gene_symbol}")
    
    def get_all_alleles_for_gene(self, gene_symbol: str) -> List[Dict]:
        """Get all alleles for a specific gene."""
        gene_info = self.get_gene_info(gene_symbol)
        if not gene_info:
            return []
        
        # Get alleles list
        alleles_data = self._get("/alleles/list")
        if not alleles_data:
            return []
        
        # Filter alleles for this gene
        gene_alleles = [a for a in alleles_data if gene_symbol in str(a)]
        return gene_alleles
    
    def get_allele_info(self, allele_identifier: str) -> Optional[Dict]:
        """Get detailed information for a specific allele."""
        return self._get(f"/alleles/{allele_identifier}")
    
    def get_allele_variants(self, allele_identifier: str) -> List[Dict]:
        """Get variants for a specific allele."""
        data = self._get(f"/alleles/{allele_identifier}/variants")
        if data and isinstance(data, list):
            return data
        return []
    
    def get_allele_function(self, allele_identifier: str) -> Optional[str]:
        """Get CPIC clinical function for an allele."""
        data = self._get(f"/alleles/{allele_identifier}/function")
        if data:
            return data.get('function')
        return None
    
    def get_variant_by_rsid(self, rsid: str) -> Optional[Dict]:
        """Get variant information by rsID."""
        # Remove 'rs' prefix if present
        rsid_num = rsid.replace('rs', '')
        return self._get(f"/variants/rsid/{rsid_num}")
    
    def get_variants_for_gene(self, gene_symbol: str) -> List[Dict]:
        """Get all variants for a gene."""
        data = self._get(f"/variants/gene/{gene_symbol}")
        if data and isinstance(data, list):
            return data
        return []
    
    def build_star_allele_definitions(self, gene_symbol: str) -> Dict:
        """
        Build star allele definitions dynamically from PharmVar API.
        
        Returns: Dict mapping star allele names to their defining variants
        """
        definitions = {}
        
        try:
            # Get all variants for this gene
            variants = self.get_variants_for_gene(gene_symbol)
            
            if not variants:
                logger.warning(f"No variants found for {gene_symbol}")
                return definitions
            
            # Group variants by allele
            allele_map = {}
            for variant in variants:
                # Extract allele information from variant
                allele_name = variant.get('alleleName') or variant.get('allele')
                if not allele_name:
                    continue
                
                if allele_name not in allele_map:
                    allele_map[allele_name] = []
                
                rsid = variant.get('rsId') or variant.get('rsid')
                ref = variant.get('referenceAllele') or variant.get('ref')
                alt = variant.get('alternateAllele') or variant.get('alt')
                
                if rsid and alt:
                    allele_map[allele_name].append({
                        'rsid': f"rs{rsid}" if not str(rsid).startswith('rs') else rsid,
                        'alt': alt,
                        'ref': ref
                    })
            
            # Convert to our format
            for allele_name, variant_list in allele_map.items():
                if variant_list:
                    definitions[allele_name] = variant_list
            
            logger.info(f"Built definitions for {gene_symbol}: {len(definitions)} alleles")
            return definitions
        
        except Exception as e:
            logger.error(f"Error building star allele definitions for {gene_symbol}: {e}")
            return definitions
    
    def get_activity_score(self, gene_symbol: str, allele_name: str) -> float:
        """
        Get activity score for an allele.
        
        For CYP2D6, uses function status to determine score.
        """
        try:
            allele_id = f"{gene_symbol}{allele_name}"
            function_data = self.get_allele_function(allele_id)
            
            if not function_data:
                return 1.0  # Default to normal
            
            function = str(function_data).lower()
            
            # Map function to activity score
            if 'no function' in function or 'non-functional' in function:
                return 0.0
            elif 'decreased' in function or 'reduced' in function:
                return 0.5
            elif 'increased' in function:
                return 2.0
            elif 'normal' in function:
                return 1.0
            else:
                return 1.0  # Default
        
        except Exception as e:
            logger.error(f"Error getting activity score: {e}")
            return 1.0


# Singleton instance
pharmvar_service = PharmVarService()
