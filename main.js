const API_URL = 'https://jsonplaceholder.typicode.com';

const userList = document.getElementById('user-list');
const userInfo = document.getElementById('user-info');
const postsFeed = document.getElementById('posts-feed');
const modal = document.getElementById('form-modal');
const closeModalBtn = document.getElementById('close-modal');
const itemForm = document.getElementById('item-form');
const createPostBtn = document.getElementById('create-post-btn');
const newPostText = document.getElementById('new-post-text');

let users = [];
let selectedUser = null;
let allPosts = [];
let postsShownPerUser = {};
let commentsCache = {};
const POSTS_PER_USER_STEP = 1;

// Fetch users and posts
function fetchUsersAndPosts() {
  Promise.all([
    fetch(`${API_URL}/users`).then(res => res.json()),
    fetch(`${API_URL}/posts`).then(res => res.json())
  ]).then(([usersData, postsData]) => {
    users = usersData;
    allPosts = postsData;
    renderUserList();
    renderFeed();
  });
}

function renderUserList() {
  userList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.innerHTML = `<img class="user-avatar" src="https://i.pravatar.cc/150?img=${user.id}" alt="avatar" /> <span>${user.name}</span>`;
    li.className = selectedUser && selectedUser.id === user.id ? 'selected' : '';
    li.onclick = () => selectUser(user.id);
    userList.appendChild(li);
  });
}

function selectUser(userId) {
  selectedUser = users.find(u => u.id === userId);
  renderUserList();
  renderUserInfo();
  renderUserPosts(userId);
}

function renderUserInfo() {
  if (!selectedUser) {
    userInfo.style.display = 'none';
    userInfo.innerHTML = '';
    return;
  }
  userInfo.style.display = '';
  userInfo.innerHTML = `
    <h3><img class="user-avatar" src="https://i.pravatar.cc/150?img=${selectedUser.id}" alt="avatar" style="vertical-align:middle;margin-right:10px;">${selectedUser.name} <span style="color:#888;font-size:0.9em">(@${selectedUser.username})</span></h3>
    <p><b>Email:</b> ${selectedUser.email}</p>
    <p><b>Company:</b> ${selectedUser.company?.name || ''}</p>
    <p><b>Website:</b> <a href="http://${selectedUser.website}" target="_blank">${selectedUser.website}</a></p>
    <p><b>Address:</b> ${selectedUser.address?.city}, ${selectedUser.address?.street}</p>
  `;
}

function renderFeed() {
  selectedUser = null;
  renderUserList();
  userInfo.innerHTML = '';
  userInfo.style.display = 'none';
  postsFeed.innerHTML = '';
  postsShownPerUser = {};
  // Show 1 post per user
  users.forEach(user => {
    postsShownPerUser[user.id] = POSTS_PER_USER_STEP;
  });
  renderFeedPosts();
  // Add show more button
  const showMoreBtn = document.createElement('button');
  showMoreBtn.textContent = 'Show more posts';
  showMoreBtn.className = 'show-more-btn';
  showMoreBtn.onclick = showMorePosts;
  postsFeed.appendChild(showMoreBtn);
}

function renderFeedPosts() {
  // Remove all except show more button
  postsFeed.innerHTML = '';
  let postsToShow = [];
  users.forEach(user => {
    const userPosts = allPosts.filter(p => p.userId === user.id).slice(0, postsShownPerUser[user.id]);
    postsToShow = postsToShow.concat(userPosts);
  });
  // Sort by post id (or you can randomize or sort by title for demo)
  postsToShow.sort((a, b) => a.id - b.id);
  postsToShow.forEach(post => {
    const user = users.find(u => u.id === post.userId);
    postsFeed.appendChild(createPostCard(post, user));
  });
}

function showMorePosts() {
  users.forEach(user => {
    postsShownPerUser[user.id] += POSTS_PER_USER_STEP;
  });
  renderFeedPosts();
  // Re-append show more button
  const showMoreBtn = document.createElement('button');
  showMoreBtn.textContent = 'Show more posts';
  showMoreBtn.className = 'show-more-btn';
  showMoreBtn.onclick = showMorePosts;
  postsFeed.appendChild(showMoreBtn);
}

function renderUserPosts(userId) {
  postsFeed.innerHTML = '';
  const userPosts = allPosts.filter(p => p.userId === userId);
  if (!userPosts.length) {
    postsFeed.textContent = 'No posts.';
    return;
  }
  userPosts.forEach(post => {
    const user = users.find(u => u.id === post.userId);
    postsFeed.appendChild(createPostCard(post, user));
  });
}

function createPostCard(post, user) {
  const postDiv = document.createElement('div');
  postDiv.className = 'post';
  let isOwnPost = !selectedUser || (selectedUser && user.id === selectedUser.id);
  postDiv.innerHTML = `
    <div class="post-header">
      <img class="user-avatar" src="https://i.pravatar.cc/150?img=${user.id}" alt="avatar" />
      <div class="post-user-info">
        <span class="post-user-name">${user.name}</span>
        <span class="post-user-username">@${user.username}</span>
      </div>
      ${isOwnPost ? `<span class="post-actions">
        <button class="edit-post-btn" data-postid="${post.id}">Edit</button>
        <button class="delete-post-btn" data-postid="${post.id}">Delete</button>
      </span>` : ''}
    </div>
    <div class="post-title">${post.title}</div>
    <div class="post-body">${post.body}</div>
    <button class="toggle-comments-btn" data-postid="${post.id}">Comments (<span id="comment-count-${post.id}">...</span>)</button>
    <div class="comments comments-collapsed" id="comments-for-${post.id}"></div>
  `;
  fetchCommentCount(post.id);
  postDiv.querySelector('.toggle-comments-btn').onclick = () => toggleComments(post.id);
  // Edit/Delete handlers for own posts
  if (isOwnPost) {
    const editBtn = postDiv.querySelector('.edit-post-btn');
    const deleteBtn = postDiv.querySelector('.delete-post-btn');
    if (editBtn) editBtn.onclick = () => editPost(post);
    if (deleteBtn) deleteBtn.onclick = () => deletePost(post.id);
  }
  return postDiv;
}

function fetchCommentCount(postId) {
  fetch(`${API_URL}/posts/${postId}/comments`)
    .then(res => res.json())
    .then(comments => {
      commentsCache[postId] = comments;
      const countSpan = document.getElementById(`comment-count-${postId}`);
      if (countSpan) countSpan.textContent = comments.length;
    });
}

function toggleComments(postId) {
  const commentsDiv = document.getElementById(`comments-for-${postId}`);
  if (!commentsDiv) return;
  if (commentsDiv.classList.contains('comments-collapsed')) {
    commentsDiv.classList.remove('comments-collapsed');
    if (commentsCache[postId]) {
      renderComments(postId, commentsCache[postId]);
    } else {
      commentsDiv.innerHTML = 'Loading comments...';
      fetch(`${API_URL}/posts/${postId}/comments`)
        .then(res => res.json())
        .then(comments => {
          commentsCache[postId] = comments;
          renderComments(postId, comments);
        });
    }
  } else {
    commentsDiv.classList.add('comments-collapsed');
    commentsDiv.innerHTML = '';
  }
}

function renderComments(postId, comments) {
  const commentsDiv = document.getElementById(`comments-for-${postId}`);
  if (!commentsDiv) return;
  if (!comments.length) {
    commentsDiv.textContent = 'No comments.';
    return;
  }
  commentsDiv.innerHTML = comments.map((c, i) => `
    <div class="comment">
      <img class="comment-avatar" src="https://i.pravatar.cc/100?img=${(c.email.charCodeAt(0)+i)%70+1}" alt="avatar" />
      <div>
        <div class="comment-author">${c.name} <span style="color:#888;font-size:0.9em">(${c.email})</span></div>
        <div class="comment-body">${c.body}</div>
      </div>
    </div>
  `).join('');
}

// Demo: Add new post (client-side only)
if (createPostBtn && newPostText) {
  createPostBtn.onclick = () => {
    const text = newPostText.value.trim();
    if (!text) return;
    let userId = selectedUser ? selectedUser.id : users[0]?.id;
    if (!userId) return;
    const newPost = {
      title: text.split(" ").slice(0, 5).join(" "),
      body: text,
      userId: userId
    };
    fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    })
      .then(res => res.json())
      .then(post => {
        // JSONPlaceholder returns the created post with an id
        allPosts.unshift(post);
        if (selectedUser) {
          renderUserPosts(userId);
        } else {
          renderFeed();
        }
        newPostText.value = '';
      });
  };
}

function editPost(post) {
  const newBody = prompt('Edit your post:', post.body);
  if (newBody !== null && newBody.trim() !== '') {
    const updatedPost = {
      ...post,
      body: newBody,
      title: newBody.split(' ').slice(0, 5).join(' ')
    };
    fetch(`${API_URL}/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPost)
    })
      .then(res => res.json())
      .then(() => {
        post.body = updatedPost.body;
        post.title = updatedPost.title;
        if (selectedUser) {
          renderUserPosts(post.userId);
        } else {
          renderFeed();
        }
      });
  }
}

function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE' })
    .then(() => {
      allPosts = allPosts.filter(p => p.id !== postId);
      if (selectedUser) {
        renderUserPosts(selectedUser.id);
      } else {
        renderFeed();
      }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    if (!document.getElementById('sidebar-toggle')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'sidebar-toggle';
      toggleBtn.id = 'sidebar-toggle';
      toggleBtn.innerHTML = '☰ Friends';
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
      };
      document.body.appendChild(toggleBtn);
      // Hide sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 900 && sidebar.classList.contains('open')) {
          if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
            sidebar.classList.remove('open');
          }
        }
      });
    }
  });
  
closeModalBtn.onclick = () => modal.classList.add('hidden');

// Initial load
fetchUsersAndPosts();