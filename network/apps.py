from django.apps import AppConfig

class NetworkConfig(AppConfig):
    name = 'network'

    # since this would load initially so tried to assign token for all users here
    # also need to mention this in __init__.py 
    # for now im using a different way to create and assign token through view
    # def ready(self):
        
    #     from network.models import User
    #     from rest_framework.authtoken.models import Token

    #     for user in User.objects.all():
    #         Token.objects.get_or_create(user=user)