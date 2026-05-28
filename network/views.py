from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils.dateparse import parse_datetime
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, ValidationError
from .models import User, Post, Likes
from rest_framework import generics
from rest_framework import status
# from rest_framework import mixins
from rest_framework.views import APIView
from rest_framework.renderers import TemplateHTMLRenderer
from .serializers import PostSerializer
from rest_framework.response import Response
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
# from rest_framework.authtoken.models import Token
# from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
# from rest_framework_simplejwt.authentication import JWTAuthentication
# from rest_framework_simplejwt.tokens import RefreshToken
from .pagination import StandardPagination
import json
def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

# this view helps in getting csrf token
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return Response({'csrf_token':csrf_token}) 

# this view is to get token by token-authentication
# user is authenticated with session authentication but wherever possible 
# we can implement tokenauthentication
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_auth_token(request):
#     # user = get_object_or_404(User,pk=dict(request.GET)['user_id'][0])
#     token, created = Token.objects.get_or_create(user=request.user)
#     # print(request.headers)
#     # print(token.key)
#     # print(dict(request.GET)['user_id'][0])
#     return Response({'token':token.key})
#     # token = Token.objects.create(user=)

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_jwt_auth_token(request):
#     refresh = RefreshToken.for_user(request.user)
#     return Response({
#         'refresh':str(refresh),
#         'access': str(refresh.access_token)
#     })

# function-based view to get the list of posts and create a post
# @api_view(['GET','POST'])
# def posts(request):
#     if request.method == 'GET':
#         queryset = Post.objects.all()
#         serializer = PostSerializer(queryset,many=True)
#         json = JSONRenderer().render(serializer.data)
#         return Response(json)
    
#     if request.method == 'POST':
#         serializer = PostSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response({'status':'success'})
#         return Response({'data':serializer.errors,'status':'failed'})

# this view returns if the client is authenticated or not with username
class UserStatusView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self,request,*args,**kwargs):
        if request.user.is_authenticated:
            content = {
                'is_authenticated': True,
                'username': request.user.username
            }
        else:
            content = {
                'is_authenticated': False
            }
        return Response(content)

# class based view to get list os posts and to create a post
class PostList(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardPagination

    # def create(self, request, *args, **kwargs):
    #     serializer = PostSerializer(data=request.data)
    #     if serializer.is_valid():
    #         # super().create(request, *args, **kwargs)
    #         serializer.save(user_id=self.request.user)
    #         return Response({'status':'success'})
    #     return Response({'data':serializer.errors,'status':'failed'})

    #its better to user perform_create since internally rest-framework calls the method like bellow 
    # the order is 
    # 1) post request is made
    # 2) CreateAPIView.post()
    # 3) CreateModelMixin.create()
    # 4) serializer = get_serializer(data=request.data)
    #    serializer.is_valid(raise_exception=True)
    #       validate_content() -> runs here
    # 5) perform_create(serializer) -> hook
    # 6) if validation fails -> validation error is not raised but drf returns 400 bad request automatically
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_queryset(self):
        if self.request.query_params.get('path'):
            # this queryset filters the post made my users who the session-user follows
            # for the following page
            if 'following' in self.request.query_params.get('path'):
                user = User.objects.get(pk=self.request.user.pk)
                following_users = []
                for obj in user.following_relations.all():
                    following_users.append(obj.followed.username)
                # reply__isnull=True means this post is actually a post itself and not a 
                # reply to any other post
                return Post.objects.filter(reply__isnull=True , user__username__in=following_users)
        # this queryset is for all-post page
        return Post.objects.filter(reply__isnull=True)

# this view updates the post when a user edits it     
class postUpdateView(generics.UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        if self.request.user.pk != int(self.request.data.get('user')):
            raise PermissionDenied("You cannot edit someone else's post")
        return super().perform_update(serializer)

# this update or creates the like for a post
class LikeCreateUpdateView(APIView):

    def post(self, request):
        post = Post.objects.get(pk=request.data.get('post'))
        is_active = request.data.get('is_active')
        # two ways to update or create a post
        Likes.objects.update_or_create(post=post,user=self.request.user,defaults={'is_active':is_active})

        # another way to update or create a post
        # try:
        #     l = Likes.objects.get(post=post,user=self.request.user)
        #     l.is_active = is_active
        #     l.save()
        # except ObjectDoesNotExist:
        #     Likes.objects.create(post=post,user=self.request.user,is_active=is_active)
        return Response(status=status.HTTP_200_OK)
    
# To get to the post detail page
class retrievePostView(generics.RetrieveAPIView):

    queryset = Post.objects.all()
    renderer_classes = [TemplateHTMLRenderer]
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self,request,*args,**kwargs):
        self.object = self.get_object()
        data = self.get_serializer(instance=self.object).data
        #parsing the datetime field data so django date time filters could be applied on template
        data['timestamp'] = parse_datetime(data['timestamp']) 
        return Response({'post':data},template_name='network/post_detail.html')

# To list all replies and create reply for the specific post
class ReplyListCreate(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        post = Post.objects.get(pk=self.request.data.get('reply'))
        serializer.save(user=self.request.user,reply=post)

    def get_queryset(self):
        # post_id = self.request.query_params.get('post')
        post_id = self.pk
        try:
            post = Post.objects.get(pk=post_id)
            return post.replies.all()
        except ObjectDoesNotExist:
            return None
        
    def list(self, request, *args, **kwargs):
        self.pk = kwargs.get('pk')
        return super().list(request, *args, **kwargs)
            

        
# for profile page
class userProfileView(APIView):
    renderer_classes = [TemplateHTMLRenderer]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, *args, **kwargs):
        username = kwargs.get('username')
        try:
            puser = User.objects.get(username=username) # the profile user
            # the user currenty in session, it may also contain anonymous user
            session_user = self.request.user
            following = False
            followers_count = puser.follower_relations.all().count() #current profile user followers
            followings_count = puser.following_relations.all().count() # current profile user followings
            # to determine if the user is anonymous or not
            if session_user.is_authenticated:
                if session_user.following.all().filter(username=puser.username):
                    following = True
            
        except ObjectDoesNotExist:
            raise ValidationError('Does not Exist')
        return Response(
            {
                'puser': puser, 
                'session_user':session_user.username,
                'following':following,
                'followers':followers_count,
                'followings':followings_count
            }, 
            template_name='network/profile.html')

# to follow and unfollow a user
class userFollowStatus(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self,request,*args,**kwargs):
        data = json.loads(request.body) #request data
        try:
            puser = User.objects.get(username = data.get('puser'))
            session_user = self.request.user
            following_queryset = session_user.following.all().filter(username = data.get('puser'))
            following = None
            # to unfollow a user
            if(len(following_queryset)==1 and data.get('following')=='True'):
                session_user.following.remove(puser)
                following = False
            # to follow a user
            if(len(following_queryset)==0 and data.get('following')=='False'):
                session_user.following.add(puser)
                following = True
        except ObjectDoesNotExist:
            raise ValidationError("User does not exist")
        return Response({'follow_status':following},status=status.HTTP_200_OK)

#this view retrieves all kinds of post related to the profile    
class retrieveProfilePosts(generics.ListAPIView):
    serializer_class = PostSerializer
    pagination_class = StandardPagination
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        puser_name = self.request.query_params.get('puser')
        print(puser_name)
        try:
            puser = User.objects.get(username=puser_name)
            posts = Post.objects.filter(user=puser) # all the post made by the user
            types = self.request.query_params.get('types')
            if types == 'Replies':
                #all posts made by user for which there are replies
                return posts.filter(replies__isnull=False).distinct()
            elif types == 'Likes':
                #all posts which the user liked
                return Post.objects.filter(likes__user=puser,likes__is_active=True).distinct()
            return posts
        except ObjectDoesNotExist:
            raise ValidationError("NOt Found")

    
    
        