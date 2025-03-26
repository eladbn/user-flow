// 2. Server Setup (server.js)
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure data directories exist
fs.ensureDirSync(path.join(__dirname, 'data/flows'));
fs.ensureDirSync(path.join(__dirname, 'data/images'));

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, 'data/images'));
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// API Routes

// Get list of all flows
app.get('/api/flows', (req, res) => {
  const flowsDir = path.join(__dirname, 'data/flows');
  
  fs.readdir(flowsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read flows directory' });
    }
    
    const flows = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const flowData = fs.readJsonSync(path.join(flowsDir, file), { throws: false }) || {};
        return {
          id: path.basename(file, '.json'),
          name: flowData.name || 'Unnamed Flow',
          stepsCount: flowData.steps ? flowData.steps.length : 0,
          createdAt: flowData.createdAt || null
        };
      });
    
    res.json(flows);
  });
});

// Get a specific flow
app.get('/api/flows/:id', (req, res) => {
  const flowPath = path.join(__dirname, 'data/flows', `${req.params.id}.json`);
  
  if (!fs.existsSync(flowPath)) {
    return res.status(404).json({ error: 'Flow not found' });
  }
  
  try {
    const flowData = fs.readJsonSync(flowPath);
    res.json(flowData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read flow data' });
  }
});

// Create a new flow
app.post('/api/flows', (req, res) => {
  const flowData = req.body;
  
  if (!flowData.name) {
    return res.status(400).json({ error: 'Flow name is required' });
  }
  
  const flowId = Date.now().toString();
  const newFlow = {
    id: flowId,
    name: flowData.name,
    description: flowData.description || '',
    createdAt: new Date().toISOString(),
    steps: flowData.steps || []
  };
  
  const flowPath = path.join(__dirname, 'data/flows', `${flowId}.json`);
  
  try {
    fs.writeJsonSync(flowPath, newFlow);
    res.status(201).json(newFlow);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create flow' });
  }
});

// Update a flow
app.put('/api/flows/:id', (req, res) => {
  const flowId = req.params.id;
  const flowData = req.body;
  const flowPath = path.join(__dirname, 'data/flows', `${flowId}.json`);
  
  if (!fs.existsSync(flowPath)) {
    return res.status(404).json({ error: 'Flow not found' });
  }
  
  try {
    const existingFlow = fs.readJsonSync(flowPath);
    const updatedFlow = {
      ...existingFlow,
      name: flowData.name || existingFlow.name,
      description: flowData.description || existingFlow.description,
      steps: flowData.steps || existingFlow.steps,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeJsonSync(flowPath, updatedFlow);
    res.json(updatedFlow);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update flow' });
  }
});

// Delete a flow
app.delete('/api/flows/:id', (req, res) => {
  const flowId = req.params.id;
  const flowPath = path.join(__dirname, 'data/flows', `${flowId}.json`);
  
  if (!fs.existsSync(flowPath)) {
    return res.status(404).json({ error: 'Flow not found' });
  }
  
  try {
    fs.unlinkSync(flowPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete flow' });
  }
});

// Upload images for steps
app.post('/api/upload', upload.fields([
  { name: 'desktopImage', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 }
]), (req, res) => {
  const files = req.files;
  const paths = {};
  
  if (files.desktopImage) {
    paths.desktopImage = `/data/images/${files.desktopImage[0].filename}`;
  }
  
  if (files.mobileImage) {
    paths.mobileImage = `/data/images/${files.mobileImage[0].filename}`;
  }
  
  res.json(paths);
});

// Serve images from data folder
app.use('/data/images', express.static(path.join(__dirname, 'data/images')));

// Serve the main app for any other route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`For network access, use http://YOUR_IP_ADDRESS:${PORT}`);
  console.log(`Admin interface available at http://localhost:${PORT}/admin.html`);
});

// Settings API endpoints
app.get('/api/settings/logo', (req, res) => {
  const settingsPath = path.join(__dirname, 'data', 'settings.json');
  
  if (!fs.existsSync(settingsPath)) {
    return res.status(404).json({ error: 'Settings not found' });
  }
  
  try {
    const settings = fs.readJsonSync(settingsPath);
    res.json({ logoPath: settings.logoPath || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.post('/api/settings/logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file uploaded' });
  }
  
  const logoPath = `/data/images/${req.file.filename}`;
  const settingsPath = path.join(__dirname, 'data', 'settings.json');
  
  try {
    // Create or update settings file
    const settings = fs.existsSync(settingsPath) 
      ? fs.readJsonSync(settingsPath) 
      : {};
    
    // Delete old logo if exists
    if (settings.logoPath && settings.logoPath !== logoPath) {
      const oldLogoPath = path.join(__dirname, settings.logoPath.replace(/^\//, ''));
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }
    
    settings.logoPath = logoPath;
    fs.writeJsonSync(settingsPath, settings);
    
    res.json({ logoPath });
  } catch (err) {
    console.error('Error saving logo settings:', err);
    res.status(500).json({ error: 'Failed to save logo settings' });
  }
});

// Settings API endpoints
app.get('/api/settings/logo', (req, res) => {
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    if (!fs.existsSync(settingsPath)) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    
    try {
      const settings = fs.readJsonSync(settingsPath);
      res.json({ logoPath: settings.logoPath || null });
    } catch (err) {
      res.status(500).json({ error: 'Failed to read settings' });
    }
  });
  
  app.post('/api/settings/logo', upload.single('logo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }
    
    const logoPath = `/data/images/${req.file.filename}`;
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    try {
      // Create or update settings file
      const settings = fs.existsSync(settingsPath) 
        ? fs.readJsonSync(settingsPath) 
        : {};
      
      // Delete old logo if exists
      if (settings.logoPath && settings.logoPath !== logoPath) {
        const oldLogoPath = path.join(__dirname, settings.logoPath.replace(/^\//, ''));
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      
      settings.logoPath = logoPath;
      fs.writeJsonSync(settingsPath, settings);
      
      res.json({ logoPath });
    } catch (err) {
      console.error('Error saving logo settings:', err);
      res.status(500).json({ error: 'Failed to save logo settings' });
    }
  });