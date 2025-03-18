let workspaceId = "";
let projectData = [];

const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
    saveBtn.addEventListener('click', function () {
        const projectValue = document.getElementById('project').value;
        console.log('Project saved:', projectValue);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    chrome.runtime.sendMessage({ type: "REQ", data: "Send me data plssss!!" });
})

const renderProjectDetails = (projectId, projectName, shortCode) => {
    return `
        <div class="label">${projectName}:</div>
        <input type="text" id="${projectId}" value="${shortCode}">
    `
}

const updateUI = () => {
    document.getElementById("workspaceId").textContent = workspaceId;

    const container = document.querySelector(".projectList");

    container.innerHTML = ""
    projectData.forEach(row => {
        container.innerHTML += renderProjectDetails(row.projectId, row.projectName, row.shortCode);
    })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let workspaceIdLocal = "", projectDataLocal = "";
    
    console.log(message)

    if (message.type === "WORKSPACE_ID") {
        workspaceIdLocal = message.data
    } else if (message.type === "PROJECT_DATA") {
        projectDataLocal = JSON.parse(message.data)
    }

    if (workspaceIdLocal !== workspaceId || JSON.stringify(projectDataLocal) !== JSON.stringify(projectData)) {
        workspaceId = workspaceIdLocal;
        projectData = projectDataLocal;

        updateUI();
    }
})