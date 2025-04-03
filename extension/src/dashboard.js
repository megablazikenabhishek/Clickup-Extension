let workspaceId = "";
let projectData = [];
const baseUrl = "https://clickup-extension.vercel.app"

const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        console.log("Saving shortcodes.......")

        const inputs = document.querySelectorAll('input');

        const dataList = []
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].disabled)
                continue;

            const projectId = inputs[i].id;
            const shortCode = inputs[i].value;

            const proj = projectData.find(proj => proj.projectId === projectId);

            dataList.push({projectId, shortCode, workspaceId, projectName: proj.projectName})
        }

        console.log(dataList);

        try {
            await fetch(`${baseUrl}/projects/updateShortCodes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataList)
            })

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });;
        } catch (error) {
            console.error(error.message)
        }
    });
}

const renderProjectDetails = (projectId, projectName, shortCode, editable) => {
    return `
        <div>
            <div class="label">${projectName}:</div>
            <input type="text" id="${projectId}" value="${shortCode}" ${editable ? '' : 'disabled'}>
        </div>
    `
}

const updateUI = () => {
    document.getElementById("workspaceId").textContent = workspaceId;

    const container = document.querySelector(".projectList");

    container.innerHTML = ""
    let disableBtn = true
    projectData.forEach(row => {
        container.innerHTML += renderProjectDetails(row.projectId, row.projectName, row.shortCode, row.editable);

        if (row.editable) {
            disableBtn = false;
        }
    })

    document.getElementById("saveBtn").disabled = disableBtn;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let dataLocal = {}
    if (message.type === "DATA") {
        dataLocal = message.data
    } else {
        return;
    }

    if (dataLocal !== JSON.stringify({workspaceId, projectData})) {
        const data = JSON.parse(dataLocal);

        workspaceId = data.workspaceId
        projectData = data.projectData;
        updateUI();
    }
})