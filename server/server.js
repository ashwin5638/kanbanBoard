require('dotenv').config();

const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/db'); 
const authRoute = require('./src/routes/authRoutes')

const app = express();


app.use(express.json());
app.use(cors());


app.get('/api/health', async (req, res) => {
  try {

    const orgs = await prisma.organization.findMany();
    res.json({ 
      success: true, 
      message: 'Database connected successfully', 
      organizations: orgs 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.use('/auth', authRoute)

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});