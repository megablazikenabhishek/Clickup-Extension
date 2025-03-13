console.log("Hii")

let workspaceId = null;
let projectData = [];
const ticketMap = new Map();

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

function generateShortName(projectName) {
    const cleanedName = projectName.replace(/[^a-zA-Z]/g, '');
    
    let shortName = cleanedName.toUpperCase().slice(0, 3);
    
    while (shortName.length < 3) {
        shortName += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random A-Z
    }
    
    return shortName;
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
        
        const ticketId = "MVP-"+index;
        
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


const interval = setInterval(() => {
    const taskHeaders = document.querySelectorAll("cu-task-list")

    taskHeaders.forEach(header => {
        if (header.children.length < 2) {
            return;
        }

        if (header.className.includes("collapsed") || header.hasAttribute("dropdown-select")) {
            return;
        }

        header.setAttribute("dropdown-select", "true");

        const actualHeaderList = header.firstElementChild.children[1].firstElementChild.children[1];
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
}, 500);


const projectInfoInterval = setInterval(()=> {
    const data = document.querySelectorAll("cu-project-row");

    
    if (data.length !== 0) {

        workspaceId = extractWorkspaceIdFromURL(window.location.href)

        data.forEach(row => {
            const projectId = extractProjectId(row.firstElementChild.children[1].href);
            const projectName = row.firstElementChild.children[1].firstElementChild.firstElementChild.textContent.trim();

            if (projectId === null || projectName === null) {
                alert("Cannot config the extension!!")
            }

            const projectShortName = generateShortName(projectName)
            
            projectData.push({projectId, projectName, projectShortName});
        })

        localStorage.setItem("workspaceId", workspaceId);
        localStorage.setItem("projectData", JSON.stringify(projectData));

        clearInterval(projectInfoInterval)
    }
}, 500)