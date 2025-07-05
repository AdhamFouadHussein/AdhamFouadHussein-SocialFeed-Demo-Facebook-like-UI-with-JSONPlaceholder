# main.js Explained

This file powers the Facebook-like social feed app using the JSONPlaceholder API. Below is a section-by-section explanation for students, including extra context on how asynchronous JavaScript works and how the UI is built.

---

## 1. API URL and DOM Elements
```js
const API_URL = 'https://jsonplaceholder.typicode.com';

const userList = document.getElementById('user-list');
const userInfo = document.getElementById('user-info');
const postsFeed = document.getElementById('posts-feed');
const modal = document.getElementById('form-modal');
const closeModalBtn = document.getElementById('close-modal');
const itemForm = document.getElementById('item-form');
const createPostBtn = document.getElementById('create-post-btn');
const newPostText = document.getElementById('new-post-text');
```
**Explanation:**
- Sets the API base URL.
- Grabs references to key HTML elements for later use.

---

## 2. State Variables
```js
let users = [];
let selectedUser = null;
let allPosts = [];
let postsShownPerUser = {};
let commentsCache = {};
const POSTS_PER_USER_STEP = 1;
```
**Explanation:**
- Variables to store users, posts, which user is selected, how many posts to show per user, and cached comments.
- `POSTS_PER_USER_STEP` controls how many posts per user to show at a time in the feed.

---

## 3. Fetch Users and Posts
```js
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
```
**Explanation:**
- Fetches all users and posts from the API.
- Once loaded, calls functions to render the user list and the main feed.

**How it works:**
- `fetch` is used to make HTTP requests. It returns a Promise.
- `.then` is used to handle the result of the Promise.
- `Promise.all` allows us to wait for both users and posts to be fetched before continuing.

---

## 4. Render User List
```js
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
```
**Explanation:**
- Displays all users in the sidebar.
- Highlights the selected user and sets up click events to select a user.

---

## 5. Selecting a User
```js
function selectUser(userId) {
  selectedUser = users.find(u => u.id === userId);
  renderUserList();
  renderUserInfo();
  renderUserPosts(userId);
}
```
**Explanation:**
- Updates the selected user, re-renders the user list, user info, and shows only that user's posts.

---

## 6. Render User Info
```js
function renderUserInfo() {
  if (!selectedUser) {
    userInfo.style.display = 'none';
    userInfo.innerHTML = '';
    return;
  }
  userInfo.style.display = '';
  userInfo.innerHTML = `...`;
}
```
**Explanation:**
- Shows or hides the user info card depending on whether a user is selected. This helps keep the UI clean and focused.

---

## 7. Render Feed (Main Page)
```js
function renderFeed() {
  selectedUser = null;
  renderUserList();
  userInfo.innerHTML = '';
  userInfo.style.display = 'none';
  postsFeed.innerHTML = '';
  postsShownPerUser = {};
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
```
**Explanation:**
- Resets to the main feed (no user selected), shows 1 post per user, and adds a button to show more posts. This is the "home" view of the app.

---

## 8. Render Feed Posts
```js
function renderFeedPosts() {
  postsFeed.innerHTML = '';
  let postsToShow = [];
  users.forEach(user => {
    const userPosts = allPosts.filter(p => p.userId === user.id).slice(0, postsShownPerUser[user.id]);
    postsToShow = postsToShow.concat(userPosts);
  });
  postsToShow.sort((a, b) => a.id - b.id);
  postsToShow.forEach(post => {
    const user = users.find(u => u.id === post.userId);
    postsFeed.appendChild(createPostCard(post, user));
  });
}
```
**Explanation:**
- Shows the correct number of posts per user in the feed, sorted by post ID. This keeps the feed balanced and fair.

---

## 9. Show More Posts
```js
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
```
**Explanation:**
- Increases the number of posts shown per user and re-renders the feed. This simulates infinite scroll or "load more" behavior.

---

## 10. Render User's Posts
```js
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
```
**Explanation:**
- Shows all posts for the selected user. This is the "profile page" view.

---

## 11. Create Post Card
```js
function createPostCard(post, user) {
  // ...
}
```
**Explanation:**
- Builds the HTML for each post, including avatar, name, username, post content, edit/delete buttons (if own post), and comments toggle. This is the main building block of the feed.

---

## 12. Fetch Comment Count & Toggle Comments
```js
function fetchCommentCount(postId) { ... }
function toggleComments(postId) { ... }
```
**Explanation:**
- Fetches the number of comments for a post and toggles the display of comments when the button is clicked. Uses the real `/posts/{id}/comments` route.

---

## 13. Render Comments
```js
function renderComments(postId, comments) { ... }
```
**Explanation:**
- Displays all comments for a post, including avatars and author info. This makes the feed interactive and social.

---

## 14. Create, Edit, and Delete Posts
```js
// Create
fetch(`${API_URL}/posts`, { method: 'POST', ... })
// Edit
fetch(`${API_URL}/posts/${post.id}`, { method: 'PUT', ... })
// Delete
fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE' })
```
**Explanation:**
- Uses real API routes to create, edit, and delete posts. Updates the UI after each action. Explains the use of POST, PUT, and DELETE HTTP methods.

---

## 15. Sidebar Toggle for Mobile
```js
document.addEventListener('DOMContentLoaded', () => { ... });
```
**Explanation:**
- Adds a button to show/hide the sidebar (friends list) on small screens for a better mobile experience. Explains how the sidebar is made responsive and accessible.

---

## 16. App Initialization
```js
closeModalBtn.onclick = () => modal.classList.add('hidden');
fetchUsersAndPosts();
```
**Explanation:**
- Closes the modal when needed and starts the app by fetching users and posts. This is the entry point for the app.

---

## Additional Notes for Students

- **Asynchronous JavaScript:** The app relies heavily on Promises and async operations. Understanding how `fetch`, `.then`, and `Promise.all` work is crucial for modern web development.
- **RESTful API:** All data comes from JSONPlaceholder, a free fake REST API. The app uses real HTTP methods (GET, POST, PUT, DELETE) to interact with the API.
- **UI Structure:** The app is built with plain HTML, CSS, and JavaScript—no frameworks. This makes it easy to read and modify.
- **Responsiveness:** The app is fully responsive and works well on both desktop and mobile devices.
- **Extensibility:** You can add more features, such as creating/editing/deleting comments, or improving the UI with modals and notifications.

---

**Summary Table:**

| Concept      | Purpose                                 | Returns         | Used for                        |
|--------------|-----------------------------------------|-----------------|----------------------------------|
| `fetch`      | Make HTTP requests                      | Promise         | Getting data from a server       |
| `.then`      | Handle resolved Promise values          | Promise         | Chaining async operations        |
| `Promise.all`| Wait for multiple Promises to resolve   | Promise (Array) | Parallel async operations        |

---

This breakdown should help students understand how each part of the code works and how they fit together to create a modern, interactive social feed app. For more details, read the comments in the code and experiment with the UI!
