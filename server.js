require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoute');

const app = express();
app.use(cors());
app.use(bodyParser.json());

connectDB(process.env.MONGO_URI);

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('Phone OTP backend running'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
