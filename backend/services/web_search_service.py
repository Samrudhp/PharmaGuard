import os
import logging
from typing import List, Dict
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class WebSearchService:
    """Service to search the web using Tavily API for pharmacogenomic context."""

    def __init__(self):
        self.api_key = os.getenv('TAVILY_API_KEY')
        self._client = None
        if self.api_key:
            try:
                from tavily import TavilyClient
                self._client = TavilyClient(api_key=self.api_key)
                logger.info("Tavily search client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Tavily client: {e}")
        else:
            logger.warning("TAVILY_API_KEY not set — web search disabled")

    def _search(self, query: str, max_results: int = 3) -> List[Dict]:
        """
        Core Tavily search. Returns normalized result list.
        Falls back to [] gracefully if client unavailable or error occurs.
        """
        if not self._client:
            return []

        try:
            response = self._client.search(
                query=query,
                search_depth="basic",
                max_results=max_results,
                include_answer=False
            )
            results = []
            for r in response.get('results', []):
                results.append({
                    'title':   r.get('title', ''),
                    'snippet': r.get('content', ''),
                    'url':     r.get('url', ''),
                    'source':  self._extract_domain(r.get('url', ''))
                })
            logger.info(f"Tavily returned {len(results)} results for: {query[:60]}")
            return results
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return []

    # ── Public methods (same interface as before) ──────────────────────────

    def search_pharmacogenomics_context(
        self,
        gene: str,
        diplotype: str,
        phenotype: str,
        drug: str,
        max_results: int = 3
    ) -> List[Dict]:
        """Search for pharmacogenomics context for the LLM explanation."""
        query = f"{gene} {diplotype} pharmacogenomics {drug} CPIC clinical guidelines"
        return self._search(query, max_results)

    def search_drug_gene_interaction(self, drug: str, gene: str) -> List[Dict]:
        """Search for drug-gene interaction data."""
        query = f"{drug} {gene} drug interaction pharmacogenomics clinical guidelines"
        return self._search(query, max_results=2)

    def search_phenotype_implications(self, gene: str, phenotype: str) -> List[Dict]:
        """Search for clinical implications of a phenotype."""
        query = f"{gene} {phenotype} metabolizer clinical implications"
        return self._search(query, max_results=2)

    def format_search_results_for_llm(self, results: List[Dict]) -> str:
        """Format search results for inclusion in LLM prompt."""
        if not results:
            return "No web search results available."

        formatted = "Web Search Results:\n\n"
        for i, r in enumerate(results, 1):
            formatted += f"{i}. {r['title']}\n"
            formatted += f"   Source: {r['source']}\n"
            formatted += f"   {r['snippet'][:200]}...\n\n"
        return formatted

    # ── Helpers ────────────────────────────────────────────────────────────

    def _extract_domain(self, url: str) -> str:
        try:
            return urlparse(url).netloc or 'Unknown'
        except Exception:
            return 'Unknown'


# Singleton instance
web_search_service = WebSearchService()
