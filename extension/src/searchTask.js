function main() {
    const target = document.querySelector("cu-search-modal-toggle");

    if (target) {
        const container = document.createElement("div");
        container.id = "autocomplete-container";
        container.innerHTML = `
            <input type="text" id="searchBox" placeholder="Type to search..." autocomplete="off">
            <div id="suggestions"></div>
        `;

        target.insertAdjacentElement("afterend", container);

        const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');

        const searchBox = container.querySelector('#searchBox');
        const suggestionsContainer = container.querySelector('#suggestions');

        searchBox.addEventListener('input', () => {
            const input = normalize(searchBox.value);
            suggestionsContainer.innerHTML = '';

            if (input) {
            const filtered = [...ticketMap.entries()].filter(([key, item]) =>
                normalize(item).includes(input)
            );

            filtered.forEach(([key, item]) => {
                const div = document.createElement('div');
                div.textContent = item;
                div.addEventListener('click', () => {
                    searchBox.value = item;
                    suggestionsContainer.innerHTML = '';
                    window.location.href = "https://app.clickup.com/t/" + key;
                });
                suggestionsContainer.appendChild(div);
            });
            }
        });

        clearTimeout(main)
        return
    } 

    setTimeout(main, 500);
}

// Start the process
main();
