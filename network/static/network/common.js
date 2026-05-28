// reloads the previous page on pression backarrow
window.addEventListener('pageshow',function(event){
    if(event.persisted){
        this.location.reload();
    }
});

async function getCSRFToken(){
    const response = await fetch('/csrf-token/');
    const data = await response.json();
    return data.csrf_token;
}
// -----------------------------------------------------------------

// map data structure to store the posts content of the current page
// to dynamically modify the content on editing the post
let postContent = new Map();

// this function create individual post block
export function createPostBlock(post,container){
    let postContainer = document.createElement('div');
    postContainer.classList.add(container);
    postContainer.id = `post-container-${post.id}`;

    let sectionOneUsername = document.createElement('div');
    const secOneUsernameLink = document.createElement('a');
    secOneUsernameLink.href = `/profile/${post.username}/`
    secOneUsernameLink.textContent = '@'+post.username;
    sectionOneUsername.append(secOneUsernameLink);
    sectionOneUsername.classList.add('inline-block-display','sec-one-username');

    let sectionOneOption = document.createElement('div');
    let optionImgUrl = document.querySelector('#option-icon').src;
    let optionImg = document.createElement('img');
    const linkDiv = document.createElement('div');
    linkDiv.id = `link-div-${post.id}`;
    linkDiv.classList.add('none-display','edit-link-div');
    const link = document.createElement('a');
    link.textContent = 'edit';
    link.id = `edit-link-${post.id}`;
    linkDiv.append(link);
    optionImg.src = optionImgUrl;
    optionImg.classList.add('icon-img-size')
    sectionOneOption.append(optionImg,linkDiv);
    sectionOneOption.classList.add('inline-block-display','left-margin','align-content-right','sec-one-opt','opt-relative');

    let sectionTwo = document.createElement('section');
    sectionTwo.innerHTML = post.content;
    sectionTwo.classList.add('sec-two');
    sectionTwo.onclick = function(){ openPostPage(post); };

    let sectionThreeComment = document.createElement('div');
    sectionThreeComment.id = `sec-three-comm-${post.id}`;
    let commentImgUrl = document.querySelector('#comment-icon').src;
    let commentImg = document.createElement('img');
    commentImg.src = commentImgUrl;
    commentImg.onclick = function () {
        openCommentModal(post,'post-reply-modal');
    };
    commentImg.classList.add('icon-img-size');
    let replyCount = document.createElement('span');
    replyCount.textContent = post.reply_count;
    replyCount.id = `reply-count-${post.id}`
    replyCount.classList.add('inline-block-display','sec-three-reply-count');
    sectionThreeComment.append(commentImg,replyCount);
    sectionThreeComment.classList.add('inline-block-display','sec-three-comm');

    let sectionThreeDateTime = document.createElement('div');
    sectionThreeDateTime.id = `sec-three-dt-${post.id}`;
    sectionThreeDateTime.textContent = dtFormatFunc(post.timestamp);
    sectionThreeDateTime.classList.add('inline-block-display','sec-three-dt')
    
    let sectionThreeLike = document.createElement('div');
    sectionThreeLike.id = `sec-three-like-${post.id}`
    let likeImageUrl = document.querySelector('#like-icon').src;
    let likeImg = document.createElement('img');
    likeImg.id = `like-icon-img-${post.id}`;
    likeImg.onclick = function(){ toggleLike(likeImg.id,post);}
    if(post.is_active == true){
        likeImg.src = document.querySelector('#like-pink-icon').src;
    }else{
        likeImg.src = likeImageUrl;
    }
    likeImg.classList.add('icon-img-size','inline-block-display');
    let likeCount = document.createElement('span');
    likeCount.textContent = post.like_count;
    likeCount.id = `like-count-${post.id}`;
    likeCount.classList.add('inline-block-display','sec-three-like-count');
    sectionThreeLike.append(likeImg,likeCount);
    sectionThreeLike.classList.add('inline-block-display','sec-three-like');
    
    postContainer.append(sectionOneUsername,sectionOneOption,sectionTwo,sectionThreeComment,sectionThreeDateTime,sectionThreeLike);
    // to edit a post
    link.onclick = function(){
        if(postContainer.querySelector(`#save-div-${post.id}`)){
            postContainer.querySelector(`#save-div-${post.id}`).remove();
        }
        editPost(postContainer,post);
    }

    postContent.set(post.id, sectionTwo.textContent)
    if((post.username == post.session_user.name) && (post.user_id == post.session_user.id)){
        optionImg.onclick = function(){
            editlinkdiv(postContainer,post);
        }
    }
    return postContainer;
}
// -----------------------------------------------------

// formating timestamp received from server to match twitter/x.xom format
function dtFormatFunc(timestamp){
    let ftimestamp= new Date(timestamp);

    const timeformater = new Intl.DateTimeFormat("en-US", {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: "UTC",
    });
    const dateformater = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });

    return `${timeformater.format(ftimestamp)} \u00B7 ${dateformater.format(ftimestamp)}`;
}

// to edit a post make the block editable and modifies the UI dynamically
function editPost(container,post){
    const content = container.querySelector('.sec-two');
    content.classList.add('edit-content');
    content.onclick = null;
    content.contentEditable = true;
    content.focus();
    const commDiv = container.querySelector(`#sec-three-comm-${post.id}`);
    const likeDiv = container.querySelector(`#sec-three-like-${post.id}`);
    const dtDiv = container.querySelector(`#sec-three-dt-${post.id}`);
    commDiv.style.display = 'none';
    likeDiv.style.display = 'none';
    dtDiv.style.display = 'none';
    const div = document.createElement('div');
    div.id = `save-div-${post.id}`;
    div.style.display = 'flex';
    div.style.justifyContent = 'flex-end';
    const editButton = document.createElement('div');
    editButton.id = 'edit-post-button';
    editButton.textContent = 'save';
    if((post.username == post.session_user.name) && (post.user_id == post.session_user.id)){
        editButton.onclick = function(){
            savePost(container,post);
        }
    }   
    div.append(editButton);
    container.append(div);
}

// saves the post and modifies the UI respectively
async function savePost(container,post){
    let content = container.querySelector('.sec-two');
    let value = content.textContent;
    const response = await fetch(`/posts/${post.id}`,{
        method: 'PATCH',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': csrftoken
        },
        body: JSON.stringify({content: value,user:post.user_id})
    });
    const result = await response.json();
    console.log(response);
    console.log(result);
    if(response.ok){
        content.textContent = result.content;
        postContent.set(post.id,result.content);
    }else{
        content.textContent = postContent.get(post.id);
    }
    const linkDiv = container.querySelector(`#link-div-${post.id}`);
    linkDiv.classList.add('none-display')
    content.contentEditable = false;
    content.onclick = function(){
        openPostPage(post);
    }
    content.classList.remove('edit-content');
    container.querySelector(`#sec-three-like-${post.id}`).style.display = 'inline-block';
    container.querySelector(`#sec-three-comm-${post.id}`).style.display = 'inline-block';
    container.querySelector(`#sec-three-dt-${post.id}`).style.display = 'inline-block';
    if(container.querySelector(`#save-div-${post.id}`)){
        container.querySelector(`#save-div-${post.id}`).remove();
    }
}

function editlinkdiv(container,post){
    const content = container.querySelector('.sec-two');
    const linkDiv = container.querySelector(`#link-div-${post.id}`);
    if(linkDiv.classList.contains('none-display')){
        linkDiv.classList.remove('none-display')
    }else{
        linkDiv.classList.add('none-display')
        content.contentEditable = false;
        content.onclick = function(){
            openPostPage(post);
        }
        content.classList.remove('edit-content');
        container.querySelector(`#sec-three-like-${post.id}`).style.display = 'inline-block';
        container.querySelector(`#sec-three-comm-${post.id}`).style.display = 'inline-block';
        container.querySelector(`#sec-three-dt-${post.id}`).style.display = 'inline-block';
        if(container.querySelector(`#save-div-${post.id}`)){
            container.querySelector(`#save-div-${post.id}`).remove();
        }
        content.textContent = postContent.get(post.id)
    }
}

// this opens the post detail page
function openPostPage(post){
    location.href = `http://127.0.0.1:8000/status/posts/${post.id}`;
}

// shows the modal
export function openCommentModal(post,modalType) {
    const reply_block = document.querySelector('#reply-textarea')
    const commentModalLabel = document.getElementById("commentModalLabel");
    const hiddenPostData = document.createElement('input');
    hiddenPostData.type = 'hidden';
    hiddenPostData.dataset.postId = post.id;
    hiddenPostData.id = modalType;
    commentModalLabel.before(hiddenPostData);
    reply_block.textContent = "";
    commentModalLabel.textContent = `replying to @${post.username}`
    $('#commentModal').modal('show');
}

// toggle function for like button
const likeTimers = new Map();

export function toggleLike(id,post){
    let likeIconImg = document.getElementById(id);
    let like = document.querySelector(`#like-count-${post.id}`);
    if(id === 'pd-like-icon'){
        like = document.getElementById('pd-like-count')
        if(post.is_active === 'True'){
            post.is_active = true
        }
    }
    const wasActive = post.is_active === true;

    if(wasActive){
        likeIconImg.src = document.querySelector('#like-icon').src;
        like.textContent = Number(like.textContent.trim())-1;
        post.is_active=false;
    }else{
        likeIconImg.src = document.querySelector('#like-pink-icon').src;
        like.textContent = Number(like.textContent.trim())+1;
        post.is_active = true;
    }
    if(document.getElementById('pd-post-active')){
        if(post.is_active){
            document.getElementById('pd-post-active').dataset.postActive = 'True';
        }else{
            document.getElementById('pd-post-active').dataset.postActive = 'False';
        }
    }
    if(likeTimers.has(post.id)){
        clearTimeout(likeTimers.get(post.id));
        likeTimers.delete(post.id);
        return;
    }

    const timer = setTimeout(() => {
        sendLikeState(post);
        likeTimers.delete(post.id);
    }, 1000);

    likeTimers.set(post.id,timer);  
}
// -------------------------------

// this function creates the page buttons accordingly called by getPosts function
export function pageButton(endpoint,buttontxt){
    const button = document.createElement('button');
    button.id = buttontxt;
    button.classList.add('page-button');
    button.onclick = function(){ paginatorFunc(endpoint);};
    button.textContent = buttontxt;
    return button;
}
// ---------------------------------------------------------------------------------

// this function removes elements of the previous page and 
// calls the next set of posts
export function paginatorFunc(endpoint){
    let postBlocks = document.querySelectorAll('.post-container');
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
    for (let elem of postBlocks){
        elem.remove();
    }
    postContent.clear();
    getPosts(endpoint);
}

// ------------------------------------------------------------------------


// client get request to get all the post's when home page loads
export function getPosts(endpoint){
    
    if(location.href.includes('following/')){
        const params = new URLSearchParams({
            path: 'following'
        });
        endpoint = `${endpoint}?${params.toString()}`;
    }
    fetch(endpoint,{
        method: "GET",
    })
    .then(response => response.json())
    .then(obj => {
        let previous = obj.previous;
        let next = obj.next;
        let result = obj.results;
        const BODY_DIV = document.querySelector('.body');
        const BUTTON_DIV = document.createElement('div');
        BUTTON_DIV.id = 'pagination-button';

        result.forEach(post => {
            const block = createPostBlock(post,"post-container");
            BODY_DIV.append(block); 
        });
        if(previous){
            const previousButton = pageButton(previous,'previous');
            BUTTON_DIV.append(previousButton)
            BODY_DIV.append(BUTTON_DIV); 
        }
        if(next){
            const nextButton = pageButton(next,'next');
            BUTTON_DIV.append(nextButton)
            BODY_DIV.append(BUTTON_DIV);
        }
    })
}
// -----------------------------------------------


// this function persists the like state of the post whether liked or unliked
// called by toggleLike function
function sendLikeState(post){
    fetch('/like/',{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': csrftoken
        },
        body: JSON.stringify({
            post:post.id,
            is_active:post.is_active
        })
    })
    .then(async response => {
        console.log(response)
        if (!response.ok) {
            console.error('Something went wrong');
            return;
        }
        console.log("Success");
    });
}
// -----------------------------------------------------------


export let csrftoken;
document.addEventListener('DOMContentLoaded',function(){
    // this function gets the csrf token if user is authenticated
    async function checkUserAuthentication(){
        try{
            const response = await fetch('/user-status/');
            const data = await response.json();
            if(data.is_authenticated){
                // another way to access csrf_token even if httpOnly is set to true in django
                getCSRFToken().then(csrf_token => {
                    csrftoken = csrf_token;
                });
            }
        }catch(error){
            console.log('Error',error);
        }
    }
    checkUserAuthentication();
    // -----------------------------------------------------------

    // creates a bootstrap modal
    function createGlobalCommentModal() {
        document.body.insertAdjacentHTML("beforeend", `
        <div class="modal fade" id="commentModal" data-backdrop="static" tabindex="-1" role="dialog"
            aria-labelledby="commentModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">

            <div class="modal-header">
                <p class="modal-title" id="commentModalLabel"></p>
                <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
                </button>
            </div>

            <div class="modal-body" id="comment-modal-body">
                <div id="reply-form">
                    <div id="reply-textarea" contenteditable="true" data-placeholder="Write your reply here..."></div>
                    <div>
                        <div id="reply-button">Reply</div>
                    </div>
                </div>
            </div>

            </div>
        </div>
        </div>
        `);
    }

    createGlobalCommentModal();

});