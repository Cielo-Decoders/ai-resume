"""
Dependency injection configuration for the application.
"""
from typing import Annotated
from fastapi import Depends

from .controllers.AnalyzeController import AnalyzeController
from .services.analysis_service import extract_text_from_pdf


class Dependencies:
    """Container for application dependencies."""
    
    @staticmethod
    def get_analyze_controller() -> AnalyzeController:
        """
        Get AnalyzeController instance.
        
        Returns:
            AnalyzeController: Controller instance
        """
        return AnalyzeController()


# Type aliases for dependency injection
AnalyzeControllerDep = Annotated[AnalyzeController, Depends(Dependencies.get_analyze_controller)]