from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.exceptions import ValidationError


class User(AbstractUser):
    following = models.ManyToManyField('self',through="UserFollow",symmetrical=False, null=True)

    def __str__(self):
        return self.username
    
        
class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE) # the user who created the post
    content = models.TextField(blank=False,null=False) # content of the post
    timestamp = models.DateTimeField(auto_now_add=True) # creation time of the post
    # to which post this user replied if reply is null i.e this is a post otherwise this is a reply
    reply = models.ForeignKey('self',on_delete=models.CASCADE,null=True,blank=True,related_name='replies')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - post-id:{self.pk}"

class Likes(models.Model):
    post = models.ForeignKey(Post,on_delete=models.CASCADE) #the post which the user liked
    user = models.ForeignKey(User, on_delete=models.CASCADE) #the user who liked the post
    #if true the post is liked if false means post is unliked instead of deleting the record
    is_active = models.BooleanField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user','post'], name='unique_user_like_post')
        ]
        indexes = [
            models.Index(fields=['post','is_active'], name='post_is_active_idx'),
            models.Index(fields=['post','user'],name='post_user_is_idx')
        ]

class UserFollow(models.Model):
    follower = models.ForeignKey(User,on_delete=models.CASCADE,related_name='following_relations')
    followed = models.ForeignKey(User,on_delete=models.CASCADE, related_name='follower_relations')
    date_followed = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower","followed"], name="unique_user_follow"
            ),
            models.CheckConstraint(
                check=~models.Q(follower=models.F("followed")),
                name="prevent_self_follow"
            )
        ]

    # when obj.following.add(obj) -> it immediatly looks at constraints bypassing clean logic
    # because .add is low level which works directly on database level
    # def clean(self):
    #     super().clean()
    #     if self.follower_id == self.followed_id:
    #         raise ValidationError({
    #             "followed":"You cannot follow Yourself"
    #         })
        
    # def save(self,*args,**kwargs):
    #     self.full_clean()
    #     return super().save(*args,**kwargs)