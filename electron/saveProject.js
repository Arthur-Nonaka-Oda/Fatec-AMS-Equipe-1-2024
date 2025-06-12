const path = require("path");
const fs = require("fs");

let projectId = null;

function createProjectDirectory() {
    const projectDir = path.join(__dirname, "projects");
    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
    }
}

function saveProject(projectData) {
    createProjectDirectory();
    const projectPath = path.join(__dirname, "projects", `${projectData.id}.json`);
    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2));
}

function getProjects() {
    createProjectDirectory();
    const projectsDir = path.join(__dirname, "projects");

    const directories = fs.readdirSync(projectsDir).filter(file => {
        return fs.statSync(path.join(projectsDir, file)).isDirectory();
    });

    return directories
}

function loadProject(projectId) {
    if (projectId === null) {
        throw new Error("No project ID set. Please set a project ID before loading.");
    }


    const projectPath = path.join(__dirname, "projects", projectId);
    if (fs.existsSync(projectPath)) {
        
    } else {
        throw new Error(`Project with ID ${projectId} does not exist.`);
    }
}

async function saveImports(filePath) {
    createProjectDirectory();
    let importsPath;
    if (projectId === null) {
        projectId = Math.floor(Date.now() / 1000).toString(); // Generate a unique project ID based on the current timestamp
        importsPath = path.join(__dirname, "projects", projectId, "imports");
        fs.mkdirSync(path.join(importsPath), { recursive: true });
    } else {
        importsPath = path.join(__dirname, "projects", projectId, "imports");
    }

    const fileName = path.basename(filePath);
    const destPath = path.join(importsPath, fileName);

    fs.copyFileSync(filePath, destPath);
    console.log("Depois");
    return destPath;
}

module.exports = {
    saveProject,
    loadProject,
    saveImports,
    getProjects,
    createProjectDirectory
}