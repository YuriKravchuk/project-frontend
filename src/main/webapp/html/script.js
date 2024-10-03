let accountsCount = null;
let defaultAccountsPerPage = 5;
let accountsPerPage = defaultAccountsPerPage;
let currentPageNumber = 0;

init();

function init() {
    fillTable(currentPageNumber, defaultAccountsPerPage);
    updatePlayersCount();
    createAccountPerPageDropDown();
    bindRowEvents($(".players_table_body"));
    bindCreateAccountForm();
}

function fillTable(pageNumber, pageSize) {
    $.get(`/rest/players?pageNumber=${pageNumber}&pageSize=${pageSize}`, (players) => {
        const $playersTableBody = $(".players_table_body");
        const htmlRows = players.map(createPlayerRow).join('');
        $playersTableBody.html(htmlRows);
    });
}

function createPlayerRow(player) {
    return `
        <tr class="row" data-account-id="${player.id}">
            <td class="cell cell_small">${player.id}</td>
            <td class="cell" data-account-name>${player.name}</td>
            <td class="cell" data-account-title>${player.title}</td>
            <td class="cell" data-account-race>${player.race}</td>
            <td class="cell" data-account-profession>${player.profession}</td>
            <td class="cell" data-account-level>${player.level}</td>
            <td class="cell" data-account-birthday>${new Date(player.birthday).toLocaleDateString()}</td>
            <td class="cell" data-account-banned>${player.banned}</td>
            <td class="cell cell_small">
                <button class="edit-button" id='${player.id}'>
                    <img src="/img/edit.png"> 
                </button>
            </td>
            <td class="cell cell_small">
                <button class="delete-button" id="${player.id}">
                    <img src="/img/delete.png"> 
                </button>
            </td>
        </tr>`;
}

function bindRowEvents($tableBody) {
    $tableBody.on("click", ".edit-button", (e) => editAccount(e.currentTarget.id));
    $tableBody.on("click", ".delete-button", (e) => removeAccount(e.currentTarget.id));
}

function bindCreateAccountForm() {
    document.getElementById('create-account-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const title = document.getElementById('title').value.trim();
        const race = document.getElementById('race').value;
        const profession = document.getElementById('profession').value;
        const birthdayInput = document.getElementById('birthday').value;
        const level = parseInt(document.getElementById('level').value);
        const banned = document.getElementById('banned').checked;

        // Data validation checks
        if (!name || name.length < 1 || name.length > 12) {
            alert("Name must be between 1 and 12 characters and cannot be empty.");
            return;
        }
        if (!title || title.length > 30) {
            alert("Title cannot exceed 30 characters.");
            return;
        }
        if (isNaN(level) || level < 0 || level > 100) {
            alert("Level must be a number between 0 and 100.");
            return;
        }
        if (!birthdayInput) {
            alert("Please select a birthday.");
            return;
        }

        const birthday = new Date(birthdayInput).getTime();
        if (birthday < 0) {
            alert("Birthday must be a valid date.");
            return;
        }

        const currentDate = Date.now();
        if (birthday > currentDate) {
            alert("Birthday cannot be in the future.");
            return;
        }

        const data = {
            name: name,
            title: title,
            race: race,
            profession: profession,
            birthday: birthday,
            banned: banned,
            level: level
        };

        $.ajax({
            url: '/rest/players',
            type: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function() {
                fillTable(currentPageNumber, accountsPerPage);
                updatePlayersCount();
            }
        });

    });
}



function updatePlayersCount() {
    $.get("rest/players/count", (count) => {
        accountsCount = count;
        updatePaginationButtons();
    });
}

function updatePaginationButtons() {
    const pagesCount = accountsCount ? Math.ceil(accountsCount / accountsPerPage) : 0;
    const $buttonsContainer = $(".paging_buttons");

    let paginationButtonsHtml = "";
    for (let i = 1; i <= pagesCount; i++) {
        paginationButtonsHtml += `<button value="${i - 1}">${i}</button>`;
    }
    $buttonsContainer.html(paginationButtonsHtml);
    setActiveButton(0);
    $buttonsContainer.children("button").on("click", onPageChange);
}

function createAccountPerPageDropDown() {
    const $dropDownAccountPerPage = $(".accounts-per-page");
    const options = createOptions([5, 10, 15, 20], defaultAccountsPerPage);
    $dropDownAccountPerPage.html(options);
    $dropDownAccountPerPage.on('change', dropDownListChange);
}

function createOptions(optionsArray, defaultValue) {
    return optionsArray.map(option =>
        `<option ${defaultValue === option ? 'selected' : ''} value="${option}">${option}</option>`
    ).join('');
}

function dropDownListChange(e) {
    accountsPerPage = e.currentTarget.value;
    fillTable(0, accountsPerPage);
    updatePaginationButtons();
}

function onPageChange(e) {
    $(".paging_buttons").children("button").removeClass("active-paging-button");
    currentPageNumber = e.currentTarget.value;
    setActiveButton(currentPageNumber);
    fillTable(currentPageNumber, accountsPerPage);
}

function setActiveButton(currentButton) {
    const $buttonsContainer = $(".paging_buttons");
    $buttonsContainer.children("button").removeClass("active-paging-button");
    $buttonsContainer.children("button").eq(currentButton).addClass("active-paging-button");
}

function removeAccount(playerId) {
    $.ajax({
        url: `/rest/players/${playerId}`,
        type: 'DELETE',
        success: function() {
            fillTable(currentPageNumber, accountsPerPage);
            updatePlayersCount();
        }
    });
}

function updateAccount(accountId, data) {
    $.ajax({
        url: `/rest/players/${accountId}`,
        type: 'POST',
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function() {
            fillTable(currentPageNumber, accountsPerPage);
            updatePlayersCount();
        }
    });
}

function editAccount(playerId) {
    const $currentRow = $(`.row[data-account-id="${playerId}"]`);
    const $editButton = $currentRow.find(".edit-button");
    const $deleteButton = $currentRow.find(".delete-button");

    if ($editButton.html().includes("save.png")) {
        const updatedData = {
            name: $currentRow.find("[data-account-name] input").val(),
            title: $currentRow.find("[data-account-title] input").val(),
            race: $currentRow.find("[data-account-race] select").val(),
            profession: $currentRow.find("[data-account-profession] select").val(),
            banned: $currentRow.find("[data-account-banned] input").is(":checked")
        };

        updateAccount(playerId, updatedData);
        $editButton.html('<img src="/img/edit.png">');
        $deleteButton.show();

    } else {
        $editButton.html('<img src="/img/save.png">');
        $deleteButton.hide();
        populateEditFields($currentRow);
    }
}


function populateEditFields($currentRow) {
    const fields = [
        { name: "data-account-name", type: "text" },
        { name: "data-account-title", type: "text" },
        { name: "data-account-race", type: "select", options: ["HUMAN", "DWARF", "ELF", "GIANT", "ORC", "TROLL", "HOBBIT"] },
        { name: "data-account-profession", type: "select", options: ["WARRIOR", "ROGUE", "SORCERER", "CLERIC", "PALADIN", "NAZGUL", "WARLOCK", "DRUID"] },
        { name: "data-account-banned", type: "checkbox" },
    ];

    fields.forEach(field => {
        const $fieldCell = $currentRow.find(`[${field.name}]`);
        const currentValue = $fieldCell.text().trim();

        if (field.type === "checkbox") {
            const isChecked = currentValue.toLowerCase() === "true";
            const $input = createInput(isChecked, field.type);
            $fieldCell.empty().append($input.prop("checked", isChecked));
        } else if (field.type === "select") {
            const $select = createSelect(currentValue, field.options);
            $fieldCell.empty().append($select);
        } else {
            const $input = createInput(currentValue, field.type);
            $fieldCell.empty().append($input);
        }
    });
}



function createSelect(selectedValue, options) {
    const $select = $('<select></select>');
    options.forEach(option => {
        const $option = $(`<option value="${option}" ${selectedValue === option ? 'selected' : ''}>${option}</option>`);
        $select.append($option);
    });
    return $select;
}

function createInput(value, type) {
    return $(`<input type="${type}" value="${value}">`);
}
