from rest_framework import serializers
from .models import Post, User, Likes
from django.core.exceptions import ObjectDoesNotExist

class PostSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    session_user = serializers.SerializerMethodField()

    class Meta:
        model=Post
        fields = ['id','user_id','username','content','timestamp','is_active','like_count','reply_count','session_user']

    def create(self, validated_data):
        # validated_data -> contains dict of data sent from client
        #  executes on calling serializer.save()

        return Post.objects.create(**validated_data)
    
    # you can do any validations specific to fields here -> this is just an example
    # def validate_content(self,value):
    #     if 'django' not in value.lower():
    #         raise serializers.ValidationError("This post is not about Django")
    #     return value
    
    def get_username(self, instance):
        return instance.user.username

    def get_user_id(self,instance):
        return instance.user.id
    
    def get_id(self,instance):
        return instance.pk

    def get_is_active(self,instance):
        user = self.context.get('request').user
        if user.is_authenticated:
            try:
                l = Likes.objects.get(post=instance.pk,user=user)
            except ObjectDoesNotExist:
                return None
            else:
                return l.is_active
        else:
            return None 
        
    def get_like_count(self,instance):
        return Likes.objects.filter(post=instance.pk,is_active=True).count()
    
    def get_reply_count(self,instance):
        return instance.replies.filter(reply__isnull=False).count()

    def get_session_user(self,instance):
        return {
            'name': self.context.get('request').user.username,
            'id': self.context.get('request').user.pk
        }