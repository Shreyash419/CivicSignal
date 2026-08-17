"""Data service for accessing regional demographic, infrastructure, and complaint datasets."""

from typing import List, Dict, Any


class DataService:
    @staticmethod
    def get_regions(country: str = None) -> List[Dict[str, Any]]:
        """Returns BRICS regions data."""
        return [
            {"id": "REG-001", "name": "Bihar", "country": "India", "population": 128500000},
            {"id": "REG-002", "name": "Uttar Pradesh", "country": "India", "population": 220000000},
            {"id": "REG-003", "name": "Pará", "country": "Brazil", "population": 8800000},
            {"id": "REG-004", "name": "Maranhão", "country": "Brazil", "population": 7200000},
            {"id": "REG-005", "name": "Siberia", "country": "Russia", "population": 19000000},
            {"id": "REG-006", "name": "Xinjiang", "country": "China", "population": 25000000},
            {"id": "REG-007", "name": "Eastern Cape", "country": "South Africa", "population": 6800000},
            {"id": "REG-008", "name": "Limpopo", "country": "South Africa", "population": 5900000},
        ]


data_service = DataService()
