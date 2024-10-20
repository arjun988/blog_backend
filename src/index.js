const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const AWS = require('aws-sdk');
const path = require('path'); 
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = express();
app.use(cors());
app.use(bodyParser.json());

console.log('Checking environment variables:', {
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
   // region: process.env.AWS_REGION
});
AWS.config.update({
    region: 'ap-south-1', // Change to your region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'BlogPosts'; // Your DynamoDB table name

app.get('/posts', async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
    };
    try {
        const data = await dynamoDB.scan(params).promise();
        res.json(data.Items);
    } catch (error) {
        res.status(500).json({ error: 'Could not fetch posts' });
    }
});

// app.post('/posts', async (req, res) => {
//     const params = {
//         TableName: 'BlogPosts',
//         Item: {
//             id: '123',
//             title: 'Test Post',
//             content: 'This is a test post',
//             likes: 0,
//             comments: [],
//         }
//     };
    
//     dynamoDB.put(params, function(err, data) {
//         if (err) {
//             console.error("Unable to add item. Error:", JSON.stringify(err, null, 2));
//         } else {
//             console.log("PutItem succeeded:", JSON.stringify(data, null, 2));
//         }
//     });
// });

app.post('/posts', async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            id: Date.now().toString(),
            title: req.body.title,
            content: req.body.content,
            likes: 0,
            comments: [],
        },
    };
    // try {
    //     await dynamoDB.put(params).promise();
    //     res.status(201).json(params.Item);
    // } catch (error) {
    //     res.status(500).json({ error: 'Could not create post' });
    // }
    dynamoDB.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("PutItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
});
app.put('/posts/:id', async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { id: req.params.id },
        UpdateExpression: 'SET title = :title, content = :content',
        ExpressionAttributeValues: {
            ':title': req.body.title,
            ':content': req.body.content,
        },
    };
    try {
        await dynamoDB.update(params).promise();
        res.json({ id: req.params.id, title: req.body.title, content: req.body.content });
    } catch (error) {
        res.status(500).json({ error: 'Could not update post' });
    }
});

app.post('/posts/:id/like', async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { id: req.params.id },
        UpdateExpression: 'SET likes = likes + :inc',
        ExpressionAttributeValues: {
            ':inc': 1,
        },
    };
    try {
        await dynamoDB.update(params).promise();
        res.json({ message: 'Post liked' });
    } catch (error) {
        res.status(500).json({ error: 'Could not like post' });
    }
});

app.post('/posts/:id/comments', async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { id: req.params.id },
        UpdateExpression: 'SET comments = list_append(comments, :comment)',
        ExpressionAttributeValues: {
            ':comment': [req.body],
        },
    };
    try {
        await dynamoDB.update(params).promise();
        res.json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ error: 'Could not add comment' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
