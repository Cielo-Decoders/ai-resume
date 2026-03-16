"""Shared rate limiter instance used by routes and registered with the app."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
