require('dotenv').config();

const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/db'); 


const authRoute = require('./src/routes/authRoutes');
const organizationRoute = require('./src/routes/organizationRoute');
const tenantRoute = require('./src/routes/tenantRoutes');
const boardRoute = require('./src/routes/boardRoute');
const columnRoute = require('./src/routes/columnRoute');
const taskRoute = require('./src/routes/taskRoute');

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
app.use('/api/organizations', organizationRoute);
app.use('/api/tenants', tenantRoute);
app.use('/api/boards', boardRoute);
app.use('/api/columns', columnRoute);
app.use('/api/tasks', taskRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});