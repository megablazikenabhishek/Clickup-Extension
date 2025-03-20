const mongoose = require('mongoose');

// Project Schema
const projectSchema = new mongoose.Schema({
    projectId: { type: String, required: true, unique: true },
    workspaceId: {type: String, required: true},
    shortCode: { type: String, required: true },
    editable: { type: Boolean, default: true }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

// Counter Schema
const counterSchema = new mongoose.Schema({
    projectId: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    taskId: { type: String, required: true },
    ticketId: { type: Number }
}, { timestamps: true });

taskSchema.pre('save', async function (next) {
    if (!this.ticketId) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { projectId: this.projectId },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.ticketId = counter.seq;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

taskSchema.virtual('formattedTicketId').get(function () {
    if (this.populated('projectId') && this.projectId.shortCode) {
        return `${this.projectId.shortCode}-${this.ticketId}`;
    }
    return this.ticketId ? `UNKNOWN-${this.ticketId}` : null;
});

taskSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        if (ret.projectId && typeof ret.projectId === 'object' && ret.projectId._id) {
            ret.projectId = ret.projectId.projectId;
        }
        delete ret.id
        delete ret.__v
        return ret;
    }
});

taskSchema.set('toObject', {
    virtuals: true,
    transform: function (doc, ret) {
        if (ret.projectId && typeof ret.projectId === 'object' && ret.projectId._id) {
            ret.projectId = ret.projectId.projectId;
        }
        delete ret.id
        delete ret.__v
        return ret;
    }
});


const Task = mongoose.model('Task', taskSchema);

module.exports = { Project, Task };