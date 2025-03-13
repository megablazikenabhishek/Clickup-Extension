console.log("Hii")

const updateTaskIdColumn = (element) => {
    const tableHeaders = element.children[0].children[1];

    console.log(tableHeaders);
}

const interval = setInterval(() => {
    const taskLists = document.querySelectorAll("cu-task-list");

    console.log("checking...........")

    if (taskLists.length === 4) {
        clearInterval(interval);
        console.log("Found elements:", taskLists);

        taskLists.forEach((element, index) => {
            if (!element.hasAttribute("dropdown-tag")) {
                const uniqueTag = `dropdown-${index + 1}`;
                element.setAttribute("dropdown-tag", uniqueTag);

                if (!element.className.includes("collapsed")) {
                    updateTaskIdColumn(element);
                }
                
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === "class" && !element.className.includes("collapsed")) {
                            console.log(`Class changed in ${element.getAttribute("dropdown-tag")}:`, element.className);
                        }
                    });
                });

                observer.observe(element, { attributes: true, attributeFilter: ["class"] });
            }
        });

        console.log("Updated elements with tags:", taskLists);
    }
}, 500);


