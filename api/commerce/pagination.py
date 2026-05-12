"""Pagination helpers for commerce API resources."""

from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Small page-number pagination with user-controlled page size."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
