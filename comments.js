// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');
// Create express application
const app = express();
// Use body-parser middleware
app.use(bodyParser.json());
// Use cors middleware
app.use(cors());
// Create comments object
const commentsByPostId = {};
// Create endpoint to get all comments
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});
// Create endpoint to create new comment
app.post('/posts/:id/comments', async (req, res) => {
    // Generate random id
    const commentId = randomBytes(4).toString('hex');
    // Get content and save it to variable
    const { content } = req.body;
    // Get comments by id
    const comments = commentsByPostId[req.params.id] || [];
    // Add new comment to comments object
    comments.push({ id: commentId, content, status: 'pending' });
    // Save comments to object
    commentsByPostId[req.params.id] = comments;
    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending',
        },
    });
    // Send response
    res.status(201).send(comments);
});
// Create endpoint to receive events from event bus
app.post('/events', async (req, res) => {
    console.log('Event received:', req.body.type);
    // Get data from request body
    const { type, data } = req.body;
    // Check if event type is comment moderated
    if (type === 'CommentModerated') {
        // Get comments by post id
        const comments = commentsByPostId[data.postId];
        // Find comment by id
        const comment = comments.find((comment) => {
            return comment.id === data.id;
        });
        // Update status of comment
        comment.status = data.status;
        // Send event to event bus
        await axios.post('http://event-bus-srv:4005/events', {
            type: 'CommentUpdated',
    });
}});
