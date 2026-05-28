import { csrftoken, getPosts, openCommentModal, toggleLike } from './common.js';

document.addEventListener('DOMContentLoaded',function(){
    
    // to navigate to the previous page
    document.getElementById('history-back-img').addEventListener('click', ()=>{
        history.back();
    });

    const pdPostId = document.querySelector('#pd-post-id');
    const commentIcon = document.getElementById('pd-comment-icon');
    // opens the modal to reply to a post
    commentIcon.addEventListener('click',function(){
        const username = document.getElementById('pd-post-username').dataset.postUsername;
        let post = {
            id: pdPostId.dataset.postId,
            username: username
        }

        openCommentModal(post,'pd-reply-modal');
    });

    const pdLikeIcon = document.getElementById('pd-like-icon');
    // toggles like and unlike in profile page
    if(pdLikeIcon){
        let post = {
            id: pdPostId.dataset.postId,
            is_active: document.getElementById('pd-post-active').dataset.postActive
        }
        pdLikeIcon.addEventListener('click',function(){
            toggleLike(pdLikeIcon.id,post);
        });
    }

    const pdtextarea = document.querySelector("#pd-reply-textarea");
    if(pdtextarea){
        pdtextarea.addEventListener('input', ()=>{
            if(pdtextarea.textContent.trim().length == 0){
                pdtextarea.innerHTML = '';
            }
        });
    }

    const reply_block = document.querySelector('#reply-textarea')
    // this logic here make's sure when the reply block is empty it triggers the placeholder
    // to appear again
    reply_block.addEventListener('input', (e)=>{
        if(reply_block.textContent.trim().length === 0){
            reply_block.innerHTML = '';
        }
    });

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

    const pd_reply_button = document.querySelector('#pd-reply-button');
    if(pd_reply_button){
        pd_reply_button.addEventListener('click',function(){
        if(pdtextarea.textContent.trim().length === 0){
            console.log('Cannot post this empty reply');
        }else{
            replyPost(csrftoken);
        }
    });
    }
    // ---------------------------------------------------------

    // this loads all the replies
    getPosts(`/replies/${pdPostId.dataset.postId}`);

    // client request to reply for a post
    function replyPost(csrftoken){ 
        let post_id, content;
        const modalPostBlock = document.getElementById('post-reply-modal');
        const pdModalPostBlock = document.getElementById('pd-reply-modal');
        if(pdModalPostBlock){
            post_id = pdModalPostBlock.dataset.postId;
            content = reply_block.textContent;
        }
        else if(modalPostBlock){
            post_id = modalPostBlock.dataset.postId;
            content = reply_block.textContent;
        }
        else{
            post_id = document.getElementById('pd-post-id').dataset.postId;
            content = pdtextarea.textContent;
        }
        let reply_body = {
            content: content,
            reply: post_id
        }
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
            if(modalPostBlock){
                let reply_count = document.getElementById('reply-count-'+post_id);
                reply_count.textContent = Number(reply_count.textContent.trim())+1;
                $('#commentModal').modal('hide');
                modalPostBlock.remove();
                return;
            }
            $('#commentModal').modal('hide');
            if(pdModalPostBlock){
                pdModalPostBlock.remove()
            }
            location.reload();
            
        })
    }
    // ------------------------------------------------------

    // removes hidden input element that was created when the modal was called/opened
    //by the opencomment modal function
    const modalCloseBtn = document.querySelector('[data-dismiss="modal"]');
    modalCloseBtn.addEventListener('click',()=>{
        const modalPostBlock = document.getElementById('post-reply-modal');
        const pdModalPostBlock = document.getElementById('pd-reply-modal');
        if(modalPostBlock){
            modalPostBlock.remove();
        }
        if(pdModalPostBlock){
            pdModalPostBlock.remove();
        }
    });
});