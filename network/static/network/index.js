import { csrftoken, getPosts } from './common.js';


document.addEventListener("DOMContentLoaded", function(){
    getPosts('/posts/');

    const post_block = document.querySelector('#post-textarea')
    // this logic here make's sure when the post block is empty it triggers the placeholder
    // to appear again
    if(post_block){
        post_block.addEventListener('input', (e)=>{
            if(post_block.textContent.trim().length === 0){
                post_block.innerHTML = '';
            }
        });
    }
    // ------------------------------------------------------------------

    const reply_block = document.querySelector('#reply-textarea')
    // this logic here make's sure when the reply block in the modal is empty, 
    // it triggers the placeholder to appear again
    reply_block.addEventListener('input', (e)=>{
        if(reply_block.textContent.trim().length === 0){
            reply_block.innerHTML = '';
        }
    });
    // ------------------------------------------------------------------

    // ---------------------------------------------------
    // if httpOnly is set to True the below code would not work since it disables access to
    // cookie through javascript
    // function getCookie(name) {
    //     let cookieValue = null;
    //     if (document.cookie && document.cookie !== '') {
    //         const cookies = document.cookie.split(';');
    //         for (let i = 0; i < cookies.length; i++) {
    //             const cookie = cookies[i].trim();
    //             // Does this cookie string begin with the name we want?
    //             if (cookie.substring(0, name.length + 1) === (name + '=')) {
    //                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    //                 break;
    //             }
    //         }
    //     }
    //     return cookieValue;
    // }
    // const csrftoken = getCookie('csrftoken');

    // --------------------------------------------------

    // django's token authentication 
    // let auth_token;
    // fetch(`/auth-token/`,{
    //     credentials:'include'
    // })
    // .then(response => response.json())
    // .then(result => {
    //     auth_token = result.token;
    // });
    // ----------------------------------

    // django's simple jwt token authentication 
    // function getJWTToken(){
    //     fetch(`/auth-token/`,{
    //         credentials:'include'
    //     })
    //     .then(response => response.json())
    //     .then(result => {
    //         return result.access;
    //         // console.log(result)
            
    //     });
    // }
    // let jwt_auth_token = getJWTToken();
    // ----------------------------------

    // this below code calls the function to post the post
    const post_button = document.querySelector('#post-button');
    if(post_button){
        post_button.addEventListener('click',function(){
        if(post_block.textContent.trim().length === 0){
            console.log('Cannot post this empty post')

        }else{
            createPost(csrftoken);
        }
    });
    }
    // --------------------------------------------------------

    // this below code calls the function to post the reply
    const reply_button = document.querySelector('#reply-button');
    if(reply_button){
        reply_button.addEventListener('click',function(){
        if(reply_block.textContent.trim().length === 0){
            console.log('Cannot post this empty reply');
        }else{
            replyPost(csrftoken);
        }
    });
    }
    // --------------------------------------------------------
    
    
    // client request to create a post
    function createPost(csrftoken){  
        let post_body = {
                    content: post_block.textContent,
        }
        fetch('/posts/',{
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken, //since using session auth csrf is a must
                // Authorization: `Bearer ${jwt_auth_token}` // when using jwt token authentication
            },
            body: JSON.stringify(post_body)
        })
        .then(async response => {
            const data = await response.json()
            if (!response.ok) {
                console.error("Validation errors:", data);
                return;
            }

            // this reloads the page so the latest comment is visible
            // once the user posts
            location.reload(); 
        })
    }
    // ------------------------------------------------------
    
    // client request to reply for a post
    function replyPost(csrftoken){  
        const postIdEle = document.getElementById('post-reply-modal');
        const post_id = postIdEle.dataset.postId;
        let reply_body = {
            content: reply_block.textContent,
            reply: post_id
        }
        console.log(post_id);
        fetch(`/replies/${post_id}/`,{
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify(reply_body)
        })
        .then(async response => {
            const data = await response.json()
            if (!response.ok) {
                console.error("Validation errors:", data);
                return;
            }

            let reply_count = document.getElementById('reply-count-'+post_id);
            reply_count.textContent = Number(reply_count.textContent.trim())+1;
            $('#commentModal').modal('hide');
            postIdEle.remove();
            
        })
    }
    // ------------------------------------------------------

    // this removes the hidden input element that was created when the modal was opened
    const modalCloseBtn = document.querySelector('[data-dismiss="modal"]');
    modalCloseBtn.addEventListener('click',()=>{
        const modalPostBlock = document.getElementById('post-reply-modal');
        if(modalPostBlock){
            modalPostBlock.remove();
        }
    });
});