import { csrftoken, pageButton, createPostBlock } from "./common.js";

document.addEventListener('DOMContentLoaded',function(){
    const historyBackBtn = document.getElementById('history-back-img');
    historyBackBtn.addEventListener('click',function(){
        history.back();
    });

    const follow = document.getElementById('follow');

    if(follow){
        follow.addEventListener('mouseenter',()=>{
            let following = follow.dataset.following
            if(following === 'True'){
                follow.textContent = 'UnFollow';
            }
        });
    
        follow.addEventListener('mouseleave',()=>{
            let following = follow.dataset.following;
            if(following === 'True'){
                follow.textContent = 'Following';
            }
        });

        const profileUserEle = document.getElementById('profile-user')
        const profileUser = profileUserEle.dataset.username;
        follow.onclick = function(){
            toggleFollow(profileUser,follow);
        }
    }

    togglePosts("Posts");
    // adds style and click while toggling posts
    const tabs = document.querySelectorAll('[data-type]');
    tabs.forEach(tab => {
        tab.addEventListener('click',()=>{
            tabs.forEach(t => {
                t.classList.remove('post-types-border-btm')
            });

            tab.classList.add('post-types-border-btm');
            togglePosts(tab.dataset.type)
        });
    });
  
});

// toggles follow - following/unfollow
async function toggleFollow(profileUser){
    const follow = document.getElementById('follow');               
    const response = await fetch(`/profile/status/${profileUser}/`,{
        method:"PATCH",
        headers:{
            'content-type': 'Application/JSON',
            'X-CSRFtoken': csrftoken
        },
        body:JSON.stringify({
            following:follow.dataset.following,
            puser: profileUser
        })
    });
    const obj = await response.json();
    const followStatus = obj.follow_status;
    let followerCountEle = document.getElementById('followers-count');
    if(followStatus){
        follow.textContent = 'Following';
        follow.dataset.following = 'True';
        followerCountEle.textContent = Number(followerCountEle.textContent.trim()) + 1
    }else{
        follow.textContent = 'Follow';
        follow.dataset.following = 'False';
        followerCountEle.textContent = Number(followerCountEle.textContent.trim()) - 1
    }
}

// toggles post in profile page
async function togglePosts(types){
    const profileUserEle = document.getElementById('profile-user')
    const profileUser = profileUserEle.dataset.username;
    const postsTypeDiv = document.querySelector('#posts-types-container');
    let postBlocks = document.querySelectorAll('.post-container');
    // clears the previous elements before loading new posts
    for (let elem of postBlocks){
        elem.remove();
    }
    let paginationButton = document.querySelector('#pagination-button');
    if(paginationButton){
        paginationButton.remove();
    }
    let nextbutton = document.querySelector('#next');
    if(nextbutton){
        nextbutton.remove();
    }

    let prevbutton = document.querySelector('#previous');
    if(prevbutton){
        prevbutton.remove()
    }


    const response = await fetch(`/profile/posts/types/?types=${types}&puser=${profileUser}`,{
        method:"GET"
    })
    const obj = await response.json()
    let previous = obj.previous;
    let next = obj.next;
    let result = obj.results;
    
    const BUTTON_DIV = document.createElement('div');
    BUTTON_DIV.id = 'pagination-button';

    result.forEach(post => {
        const block = createPostBlock(post,"post-container");
        postsTypeDiv.append(block); 
    });
    if(previous){
        const previousButton = pageButton(previous,'previous');
        BUTTON_DIV.append(previousButton)
        postsTypeDiv.append(BUTTON_DIV); 
    }
    if(next){
        const nextButton = pageButton(next,'next');
        BUTTON_DIV.append(nextButton)
        postsTypeDiv.append(BUTTON_DIV);
    }
}