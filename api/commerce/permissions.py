from rest_framework.permissions import BasePermission

from .models import Usuario


class IsCommerceAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            isinstance(request.user, Usuario)
            and request.user.is_authenticated
            and request.user.is_administrador
        )


class IsUsuarioSelfOrCommerceAdmin(BasePermission):
    def has_permission(self, request, view):
        return isinstance(request.user, Usuario) and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return request.user.is_administrador or obj.pk == request.user.pk