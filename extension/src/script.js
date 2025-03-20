class FetchPipeline {
    constructor() {
        this.queue = Promise.resolve(); 
    }

    async addRequest(url, options) {
        this.queue = this.queue.then(() => this.makeRequest(url, options));
        return this.queue; 
    }

    async makeRequest(url, options) {
        try {
            console.log(`fetching url: ${url}`)
            const response = await fetch(url, options);
            const data = await response.json();
            console.log("Success:", data);
            return {success: true, data};
        } catch (error) {
            console.error("Error:", error);
            return {success: false}
        }
    }
}

const baseUrl = "https://clickup-extension.vercel.app"
const fetchPipeline = new FetchPipeline();
let workspaceId = null;
let projectData = [];
const ticketMap = new Map();
const shortCodeMap = new Map();
const editableMap = new Map();
const loadingSet = new Set();

const ticketIdHeaderHTML = `
    <cu-task-list-header-field mwlresizable="" cdkdrag="" class="cu-task-list-header-field cdk-drag cu-task-list-header__item __dcb_width_160px--important cu-task-list-header-field_list-view-v3 ng-star-inserted" data-field="id">
        <div mwlresizehandle="" class="cu-task-list-header__resizer cu-task-list-header__resizer_right ng-star-inserted"></div>
        <div cudropdown="" class="cu-dropdown ng-star-inserted">
            <div cudropdowntoggle="" aria-expanded="false" tabindex="0" role="button" aria-label="Dropdown menu" aria-disabled="false" class="cu-dropdown__toggle"></div>
        </div>
        <cu-dropdown-list class="cu-dropdown-list cu-task-list-header-field__item ng-star-inserted">
            <div cudropdown="" class="cu-dropdown">
                <div cudropdowntoggle="" id="null" aria-disabled="false" aria-expanded="false" tabindex="0" role="button" class="cu-dropdown__toggle">
                    <cu-editable class="cu-editable">
                        <div class="cu-task-list-header-field__title cu-task-list-header-field__title_not-sortable ng-star-inserted">
                            <div class="cu-task-list-header-field__title-text" data-hover="et"> Ticket ID </div>
                        </div>
                    </cu-editable>
                </div>
            </div>
        </cu-dropdown-list>
    </cu-task-list-header-field>
` 

const getTicketIdHTML = (id) => {
    return `
        <div 
            data-test="task-row__id" 
            class="cu-task-row-id__inner" 
            style="height: 100%; font-size: var(--cu-font-size-8); text-align: center; display: flex; justify-content: center; align-items: center; gap: 8px;"
        >
            <div 
                data-test="task-row__id-body" 
                class="cu-task-row-id__body ng-star-inserted"
            >
                ${id}
            </div>

            <!-- Copy Button with Icon -->
            <button 
                cu3iconbutton="tooltipmodifierwithplacement="tooltip_web-component" 
                class="cu-task-row-id__copy ng-star-inserted"
                id = "testing"
                data-hover="23" cu3-type="outline" cu3-size="small" cu3-variant="default" cu3-destructive="false" cu3-loading="false"
                style="cursor: pointer; border: none; background: none; padding: 4px; margin-left: 8px;"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    class="feather feather-copy"
                >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
        </div>
    `;
}


function getRandomNumber() {
    return Math.floor(Math.random() * 1000) + 1;
}

function extractWorkspaceIdFromURL(url) {
    const match = url.match(/clickup\.com\/(\d+)\//);
    return match ? match[1] : null;
}

function extractProjectId(url) {
    const match = url.match(/clickup\.com\/\d+\/v\/(?:s|o)\/(?:\d*-)?(\d+)-?/);
    return match ? match[1] : null;
}

function safeSendData(data) {
    try {
        chrome.runtime.sendMessage(
            {...data},
            (response) => {
                
            }
        );
    } catch (err) {
        
    }
}

function getShortName(projectName) {
    const cleanedName = projectName.replace(/[^a-zA-Z]/g, '');
    
    let shortName = cleanedName.toUpperCase().slice(0, 3);
    
    while (shortName.length < 3) {
        shortName += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random A-Z
    }
    
    return shortName;
}

const handleNewTasks = async (taskId) => {
    try {
        if(loadingSet.has(taskId))
            return;

        const url = new URL(window.location.href);
        const projectId = url.searchParams.get("pr");

        if (!projectId){
            console.log("can't add here")
            return
        }

        const project = projectData.find(proj => proj.projectId === projectId)

        if (!project) {
            console.log("This was not supposed to happen :(")
        }

        const body = {
            projectId,
            workspaceId,
            shortCode: project.shortCode,
            taskId
        }

        loadingSet.add(taskId);
        const response = await fetchPipeline.addRequest(`${baseUrl}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })

        loadingSet.delete(taskId)

        const result = response.data
        ticketMap.set(taskId, result.formattedTicketId);
        console.log(JSON.stringify(taskId), result.formattedTicketId)
        console.log(JSON.stringify(ticketMap), JSON.stringify(result))

        return true;
    } catch (error) {
        console.log(error)
        loadingSet.delete(taskId)
        return false;
    }
}

const handleTicketIdValue = (taskLists) => {
    taskLists.forEach((row, index) => {
        const taskId = row.getAttribute("data-id");

        if (taskId === null) {
            alert("Ticket ID is not available!!")
            return;
        }

        // handleing case where data is not rendered yet
        if (row.firstChild.children === undefined || row.firstChild.children === null) {
            return;
        }

        // adding a marker
        if (row.hasAttribute("task-value")) {
            return;
        }
        
        if (!ticketMap.has(taskId)) {
            handleNewTasks(taskId)
            return;
        }

        const ticketId = ticketMap.get(taskId);
        
        ticketMap.set(taskId, ticketId);
        row.setAttribute("task-value", ticketId)

        console.log(`${taskId} -> ${ticketId}`);

        const tempDiv = document.createElement("div");
        tempDiv.className = "cu-task-row-id cu-task-row__cell clickable __dcb_width_160px--important cu-task-row-id_list-view-v3 ng-star-inserted"
        tempDiv.innerHTML = getTicketIdHTML(ticketId);
        const newElement = tempDiv;

        const children = row.firstChild.children;
        const childCount = children.length;

        const insertBeforeIndex = childCount >= 2 ? children[childCount - 2] : row.firstChild.firstChild;

        row.firstChild.insertBefore(newElement, insertBeforeIndex);

        newElement.addEventListener("click", (event) => {
            const textElement = event.currentTarget.firstElementChild.firstElementChild;
            const textToCopy = textElement.textContent.trim();

            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log("Copied: " + textToCopy);
            }).catch(err => {
                console.error("Failed to copy: ", err);
            });
        })
    })
}

async function getTasks(workspaceId) {
    try {
        const response = await fetchPipeline.addRequest(`${baseUrl}/tasks/workspace/${workspaceId}`);
        if (!response.success){
            throw new Error("something went wrong")
        }
        const {tasks, projects} = response.data
        console.log(tasks);

        tasks.forEach(task => {
            ticketMap.set(task.taskId, task.formattedTicketId)
        })

        projects.forEach(proj => {
            shortCodeMap.set(proj.projectId, proj.shortCode);
            editableMap.set(proj.projectId, proj.editable);
        })
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

const startObserver = () => {
    const taskHeaders = document.querySelectorAll("cu-task-list")

    taskHeaders.forEach(header => {
        if (header.children.length < 2) {
            return;
        }

        if (header.className.includes("collapsed") || header.hasAttribute("dropdown-select")) {
            return;
        }

        header.setAttribute("dropdown-select", "true");

        const actualHeaderList = header.querySelector("cu-task-list-header").children[1].firstElementChild.children[1];
        actualHeaderList.innerHTML += ticketIdHeaderHTML

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                console.log("testing")
                if (mutation.attributeName === "class" && header.className.includes("collapsed")) {
                    header.removeAttribute("dropdown-select")
                }
            });
        });

        observer.observe(header, { attributes: true, attributeFilter: ["class"] });
    })

    // rendering the values
    taskHeaders.forEach(header => {
        const taskLists = header.querySelectorAll("cu-task-row");

        handleTicketIdValue(taskLists)
    })
}

// to handle if new projects are created
const updateProjectListDetails = (data) => {
    const projectDataLocal = []
    data.forEach(row => {
        const projectId = extractProjectId(row.firstElementChild.children[1].href);
        const projectName = row.firstElementChild.children[1].firstElementChild.firstElementChild.textContent.trim();

        if (projectId === null || projectName === null) {
            alert("Cannot config the extension!!")
        }

        let shortCode = "";
        let editable = true;
        if (shortCodeMap.has(projectId)) {
            editable = editableMap.get(projectId);
            shortCode = shortCodeMap.get(projectId);
        }
        else {
            shortCode = getShortName(projectName)
        }
        
        projectDataLocal.push({projectId, projectName, shortCode, editable});
    })
    
    projectData = [...projectDataLocal]

    safeSendData({ type: "DATA", data: JSON.stringify({workspaceId, projectData}) });

    localStorage.setItem("projectData", JSON.stringify(projectData));
}

const startInterval = async ()=> {
    const data = document.querySelectorAll("cu-project-row");

    if (data.length !== 0) {

        workspaceId = extractWorkspaceIdFromURL(window.location.href)
        
        await getTasks(workspaceId)

        updateProjectListDetails(data)

        localStorage.setItem("workspaceId", workspaceId);

        // interval to observer tasks
        setInterval(() => {
            startObserver()
        }, 1000);

        // interval to observe projects
        setInterval(()=> {
            const data = document.querySelectorAll("cu-project-row");
            updateProjectListDetails(data);
        }, 1000)
    }

    setTimeout(startInterval, 500)
}