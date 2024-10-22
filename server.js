require('dotenv').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(express.static('views'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/form.html'));
});

// Serve users.html page
app.get('/users.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/users.html'));
});

// Create a new user (POST)
app.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body;

  const newUser = {
    fullName: fullName,
    email: email,
    password: password,
  };

  try {
    await client.connect();
    const database = client.db('user_db');
    const collection = database.collection('users');

    const result = await collection.insertOne(newUser);
    console.log(`User created with the following id: ${result.insertedId}`);

    res.redirect('/success.html');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send({ error: 'Failed to register user' });
  } finally {
    await client.close();
  }
});

// Get all users (GET)
app.get('/users', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('user_db');
    const collection = database.collection('users');

    const users = await collection.find({}).toArray();
    res.status(200).send(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ error: 'Failed to fetch users' });
  } finally {
    await client.close();
  }
});

// Get a user by ID (GET)
app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await client.connect();
    const database = client.db('user_db');
    const collection = database.collection('users');

    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send({ error: 'Failed to fetch user' });
  } finally {
    await client.close();
  }
});

// Update a user by ID (PUT)
app.put('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { fullName, email, password } = req.body;

  const updatedUser = {
    fullName: fullName,
    email: email,
    password: password,
  };

  try {
    await client.connect();
    const database = client.db('user_db');
    const collection = database.collection('users');

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updatedUser }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.status(200).send({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send({ error: 'Failed to update user' });
  } finally {
    await client.close();
  }
});

// Delete a user by ID (DELETE)
app.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await client.connect();
    const database = client.db('user_db');
    const collection = database.collection('users');

    const result = await collection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.status(200).send({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send({ error: 'Failed to delete user' });
  } finally {
    await client.close();
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
