require("dotenv").config()

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require("cors")
const { Project, Task } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected')).catch(err => console.log(err));

// Get all Tasks by Project ID
app.get('/tasks/project/:projectId', async (req, res) => {
    try {
        const project = await Project.findOne({ projectId: req.params.projectId });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        
        const tasks = await Task.find({ projectId: project._id }).populate('projectId', 'shortCode');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Tasks by Workspace ID
app.get('/tasks/workspace/:workspaceId', async (req, res) => {
    try {
        const projects = await Project.find({ workspaceId: req.params.workspaceId });
        const projectIds = projects.map(project => project._id);
        
        const tasks = await Task.find({ projectId: { $in: projectIds } }).populate('projectId', 'shortCode');
        res.json({tasks, projects});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/tasks', async (req, res) => {
    try {
        const { workspaceId, projectId, shortCode, taskId } = req.body;

        if (!workspaceId || !projectId || !shortCode || !taskId) {
            return res.status(400).json({ error: "workspaceId, projectId, shortCode, and taskId are required" });
        }

        // Find or create the project
        let project = await Project.findOne({ projectId, workspaceId });

        console.log(project)

        if (project === null) {
            project = new Project({ projectId, workspaceId, shortCode });
            await project.save();
        }

        const check = await Task.findOne({projectId: project._id, taskId});
        if (check) {
            await check.populate('projectId', 'shortCode');
            return res.status(201).json(check);
        }

        // Create a new task
        const task = new Task({ projectId: project._id, taskId });
        await task.save();
        await task.populate('projectId', 'shortCode');

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/projects/updateShortCodes', async (req, res) => {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Invalid input. Expected an array of updates.' });
    }

    try {
        const bulkOps = [];

        for (const update of updates) {
            const project = await Project.findOne({ projectId: update.projectId });

            if (project) {
                // Update only if editable is true
                if (project.editable) {
                    bulkOps.push({
                        updateOne: {
                            filter: { projectId: update.projectId },
                            update: { 
                                $set: { 
                                    shortCode: update.shortCode,
                                    editable: false 
                                } 
                            }
                        }
                    });
                }
            } else {
                // Project doesn't exist, insert new one with editable: false
                bulkOps.push({
                    insertOne: {
                        document: {
                            projectId: update.projectId,
                            projectName: update.projectName,
                            workspaceId: update.workspaceId,
                            shortCode: update.shortCode,
                            editable: false
                        }
                    }
                });
            }
        }

        if (bulkOps.length === 0) {
            return res.status(400).json({ message: 'No projects were updated or inserted.' });
        }

        const result = await Project.bulkWrite(bulkOps);

        res.json({ message: 'ShortCodes updated/inserted successfully', result });
    } catch (err) {
        console.error('Error updating shortCodes:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
