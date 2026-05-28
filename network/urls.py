
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("following/", views.index, name="following"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("posts/",views.PostList.as_view(),name='posts'),
    path("status/posts/<int:pk>",views.retrievePostView.as_view(),name='retrieve_post'),
    path('posts/<int:pk>',views.postUpdateView.as_view(),name='post-update'),
    path("replies/<int:pk>/",views.ReplyListCreate.as_view(),name='replies'),
    path("csrf-token/",views.get_csrf_token,name='csrf_token'),
    path("like/",views.LikeCreateUpdateView.as_view(),name='like'),
    path("user-status/",views.UserStatusView.as_view(),name='user-status'),
    path("profile/<str:username>/",views.userProfileView.as_view(),name='profile'),
    path("profile/status/<str:username>/",views.userFollowStatus.as_view(),name='follow-status'),
    path("profile/posts/types/",views.retrieveProfilePosts.as_view(),name='profile-posts'),
]
