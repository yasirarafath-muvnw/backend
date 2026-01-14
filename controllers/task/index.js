import Project from '../../models/Project/index.js';
import Task from '../../models/Task/index.js';
import { TASK_STATUS } from '../../models/types/task/index.js';

export const createTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, assignedTo, project } = req.body;

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const task = await Task.create({
      title,
      description,
      createdBy: userId,
      assignedTo: assignedTo || null,
      project,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("project", "name");

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({
      message: "Error creating task",
      error: err.message,
    });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    // const tasks = await Task.find({ createdBy: userId }).populate("assignedTo", "username email");
    const { projectId } = req.query;

    const filter = projectId ? { project: projectId } : {};
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")     // added
      .populate("assignedTo", "name email")    // changed username → name
      .populate("project", "name");            // already good

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks", error: err.message });
  }
};


export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      project: req.query.projectId,
      createdBy: req.user.userId,
    })
      .populate("createdBy", "name email")   // added
      .populate("assignedTo", "name email")  // kept
      .populate("project", "name");          // added

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: "Error fetching task", error: err.message });
  }
};

export const deleteTaskById = async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      project: req.query.projectId,
      createdBy: req.user.userId,
    });

    if (!deletedTask) return res.status(404).json({ message: "Task not found or unauthorized" });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task", error: err.message });
  }
};

export const getTasksByUser = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.params.userId,
      project: req.query.projectId,
    })
      .populate("createdBy", "name email")   // added
      .populate("assignedTo", "name email")  // added
      .populate("project", "name");          // added

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user tasks", error: err.message });
  }
};


export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.userId;

    const validStatuses = ["pending", "in-progress", "completed"];
    if (!TASK_STATUS.includes(status)) { // enum source of truth
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, project: req.query.projectId, createdBy: userId },
      { status },
      { new: true }
    )
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("project", "name");

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error updating task", error: err.message });
  }
};
