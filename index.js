var currentActionType = "";
var currentDetail = "N/A";
var currentSurface = "N/A";
var sequence = 1;
var half = 1;

function sequencesave() {
    sequence = document.getElementById("sequence").value;
}

function halfsave() {
    half = document.getElementById("half").value;
}

if (sessionStorage.getItem("rawShots")) {
    var rawShots = JSON.parse(sessionStorage.getItem("rawShots"));
    var shotsData = [];
} else {
    var shotsData = [];
    var rawShots = [];
    const pitch = document.getElementById("pitch");
}
let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

var table;

$(document).ready(function () {
    table = $('#event-table').DataTable({
        paging: false,
        info: false,
        responsive: true,
        "language": {
            searchPlaceholder: 'Filter by Detail and Event'
        }
    });
    console.log("table");
    console.log(table);
    if (rawShots.length > 0) {
        for (var i = 0; i < rawShots.length; i++) {
            addShotTwo(
                rawShots[i]["event"],
                rawShots[i]["startX"],
                rawShots[i]["startY"],
                rawShots[i]["endX"],
                rawShots[i]["endY"],
                rawShots[i]["time"],
                rawShots[i]["detail"],
                rawShots[i]["surface"],
                rawShots[i]["sequence"],
                rawShots[i]["half"]
            );
        }
    };
});


console.log("table");
console.log(table);

function setActionType(actionType) {
    if (currentActionType == actionType) {
        //Undo button active style
        var buttons = document.querySelectorAll(".event-button");
        // Remove the active class from all buttons
        buttons.forEach(function (button) {
            button.classList.remove("active");
        });
        currentActionType = "";
        return;
    }
    // Set the current action type
    currentActionType = actionType;

    // Get all action buttons
    var buttons = document.querySelectorAll(".event-button");

    // Remove the active class from all buttons
    buttons.forEach(function (button) {
        button.classList.remove("active");
    });
    // This assumes that this function is called with 'this' bound to the clicked button
    this.classList.add("active");
}

function setDetail(detail) {
    // Set the current detail type
    if (currentDetail == detail) {
        //If detail already pressed toggle the button
        currentDetail = "";
        var buttons = document.querySelectorAll(".detail-button");
        // Remove the active class from all buttons
        buttons.forEach(function (button) {
            button.classList.remove("active");
        });
        return;
    }
    currentDetail = detail;

    // Get all team buttons
    var buttons = document.querySelectorAll(".detail-button");

    // Remove the active class from all buttons
    buttons.forEach(function (button) {
        button.classList.remove("active");
    });

    // Add the active class to the clicked button
    this.classList.add("active");
}

function setSurface(surface) {
    // Set the current surface type
    if (currentSurface == surface) {
        //If surface already pressed toggle the button
        currentSurface = "";
        var buttons = document.querySelectorAll(".surface-button");
        // Remove the active class from all buttons
        buttons.forEach(function (button) {
            button.classList.remove("active");
        });
        return;
    }
    currentSurface = surface;

    // Get all team buttons
    var buttons = document.querySelectorAll(".surface-button");

    // Remove the active class from all buttons
    buttons.forEach(function (button) {
        button.classList.remove("active");
    });

    // Add the active class to the clicked button
    this.classList.add("active");
}

pitch.addEventListener("mousedown", function (event) {
    if (startX === null || startY === null) {
        isDragging = true;
        let rect = pitch.getBoundingClientRect();
        startX = ((event.clientX - rect.left) / pitch.offsetWidth) * 120;
        startY = ((event.clientY - rect.top) / pitch.offsetHeight) * 80;
        startX = Math.round(startX);
        startY = Math.round(startY);
    }
});

pitch.addEventListener("mousemove", function (event) {
    if (isDragging) {
        let rect = pitch.getBoundingClientRect();
        endX = ((event.clientX - rect.left) / pitch.offsetWidth) * 120;
        endY = ((event.clientY - rect.top) / pitch.offsetHeight) * 80;
        endX = Math.round(endX);
        endY = Math.round(endY);
    }
});

pitch.addEventListener("mouseup", function (event) {
    if (isDragging) {
        isDragging = false;
        var currentTime = getCurrentDateTime();
        addShot(currentActionType, startX, startY, endX, endY, currentTime, currentDetail, currentSurface, sequence, half); // Pass start and end coordinates to addShot
        rawShots.push({
            event: currentActionType, 
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            time: currentTime,
            detail: currentDetail,
            surface: currentSurface,
            sequence: sequence,
            half: half,
        });
        sessionStorage.setItem("rawShots", JSON.stringify(rawShots));
        startX = null;
        startY = null;
        endX = null;
        endY = null;
    }
});

pitch.addEventListener("touchstart", function (event) {
    if (startX === null || startY === null) {
        isDragging = true;
        let rect = pitch.getBoundingClientRect();
        startX = ((event.clientX - rect.left) / pitch.offsetWidth) * 120;
        startY = ((event.clientY - rect.top) / pitch.offsetHeight) * 80;
        startX = Math.round(startX);
        startY = Math.round(startY);
    }
});

pitch.addEventListener("touchmove", function (event) {
    if (isDragging) {
        let rect = pitch.getBoundingClientRect();
        endX = ((event.clientX - rect.left) / pitch.offsetWidth) * 120;
        endY = ((event.clientY - rect.top) / pitch.offsetHeight) * 80;
        endX = Math.round(endX);
        endY = Math.round(endY);
    }
});

pitch.addEventListener("touchend", function (event) {
    if (isDragging) {
        isDragging = false;
        var currentTime = getCurrentDateTime();
        addShot(currentActionType, startX, startY, endX, endY, currentTime, currentDetail, currentSurface, sequence, half); // Pass start and end coordinates to addShot
        rawShots.push({
            event: currentActionType, 
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            time: currentTime,
            detail: currentDetail,
            surface: currentSurface,
            sequence: sequence,
            half: half,
        });
        sessionStorage.setItem("rawShots", JSON.stringify(rawShots));
        startX = null;
        startY = null;
        endX = null;
        endY = null;
    }
});

function getCurrentDateTime() {
    let now = new Date();
    let day = ("0" + now.getDate()).slice(-2);
    let month = ("0" + (now.getMonth() + 1)).slice(-2);
    let year = now.getFullYear().toString().slice(-2);
    let hours = ("0" + now.getHours()).slice(-2);
    let minutes = ("0" + now.getMinutes()).slice(-2);
    let seconds = ("0" + now.getSeconds()).slice(-2);

    return (
        day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds
    );
}

function addShotTwo(event, startX, startY, endX, endY, time, detail, surface, sequence, half) {
    let wasDragged =
        startX !== null &&
        startY !== null &&
        endX !== null &&
        endY !== null &&
        (startX !== endX || startY !== endY);
    var actionType = currentActionType;

    var newRowData = [
        time,
        detail,
        event,
        surface,
        startX,
        startY,
        wasDragged ? endX : "N/A",
        wasDragged ? endY : "N/A",
        half,
        sequence,
        "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
    ];

    // Add new row data with DataTables API
    var rowIndex = table.row.add(newRowData).draw().index();

    // Store additional data using row().data() for easy access
    table.row(rowIndex).data().dotx = (startX * 1.0) / 120;
    table.row(rowIndex).data().doty = (startY * 1.0) / 80;
    if (wasDragged) {
        table.row(rowIndex).data().dotx2 = (endX * 1.0) / 120;
        table.row(rowIndex).data().doty2 = (endY * 1.0) / 80;
    }

    // Assign mouseenter and mouseleave events to show and remove dots
    $(table.row(rowIndex).node())
        .on("mouseenter", function () {
            showDot(this);
        })
        .on("mouseleave", function () {
            removeDot();
        });

    // Manually trigger the mouseenter event to show the dot for the new row
    $(table.row(rowIndex).node()).mouseenter();

    // Update any additional data or UI elements as needed
    shotsData.push({
        time: time,
        detail: detail,
        action: event,
        surface: surface,
        x: startX,
        y: startY,
        x2: wasDragged ? endX : "N/A",
        y2: wasDragged ? endY : "N/A",
        half,
        sequence,
    });
    localStorage.setItem("shotsData", JSON.stringify(shotsData));
    // populateDropdown();
}

function addShot(event, startX, startY, endX, endY, time, detail, surface, sequence, half) {
    let wasDragged =
        startX !== null &&
        startY !== null &&
        endX !== null &&
        endY !== null &&
        (startX !== endX || startY !== endY);
    var actionType = currentActionType;

    var newRowData = [
        time,
        detail,
        actionType,
        surface,
        startX,
        startY,
        wasDragged ? endX : "N/A",
        wasDragged ? endY : "N/A",
        half, 
        sequence,
        "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
    ];

    // Add new row data with DataTables API
    var rowIndex = table.row.add(newRowData).draw().index();

    // Store additional data using row().data() for easy access
    table.row(rowIndex).data().dotx = (startX * 1.0) / 120;
    table.row(rowIndex).data().doty = (startY * 1.0) / 80;
    if (wasDragged) {
        table.row(rowIndex).data().dotx2 = (endX * 1.0) / 120;
        table.row(rowIndex).data().doty2 = (endY * 1.0) / 80;
    }

    // Assign mouseenter and mouseleave events to show and remove dots
    $(table.row(rowIndex).node())
        .on("mouseenter", function () {
            showDot(this);
        })
        .on("mouseleave", function () {
            removeDot();
        });

    // Manually trigger the mouseenter event to show the dot for the new row
    $(table.row(rowIndex).node()).mouseenter();

    // Update any additional data or UI elements as needed
    shotsData.push({
        time: time,
        detail: detail,
        action: actionType,
        surface: surface,
        x: startX,
        y: startY,
        x2: wasDragged ? endX : "N/A",
        y2: wasDragged ? endY : "N/A",
        half, 
        sequence,
    });
    localStorage.setItem("shotsData", JSON.stringify(shotsData));
    // populateDropdown();
}

function removeShot(deleteButton) {
    // Retrieve the DataTables row for the delete button
    var row = $(deleteButton).closest("tr");
    var rowIndex = table.row(row).index();

    // Remove the shot from the shotsData array if storing shot data separately
    if (shotsData && rowIndex !== undefined) {
        shotsData.splice(rowIndex, 1);
        localStorage.setItem("shotsData", JSON.stringify(shotsData));
    }
    // Remove the row from the DataTable
    removeDot();
    // Assuming the table structure is consistent with the addShot function
    // If shotsData is not used to track each shot, you might need to retrieve values directly from the row before it's removed
    var rowData = table.row(row).data();
    var eventContent = rowData[2]; // Assuming the 3rd column is the event type
    console.log("eventcontent ", eventContent);
    //updateCumulative(xGContent, xSaveContent, eventContent, "subtract");
    table.row(row).remove().draw();
}

function showDot(rowNode) {
    removeDot();

    // Access row data using DataTables API
    var rowData = table.row(rowNode).data();

    var xPercent = parseFloat(rowData.dotx);
    var yPercent = parseFloat(rowData.doty);

    var x1 = xPercent * pitch.offsetWidth;
    var y1 = yPercent * pitch.offsetHeight;

    console.log("showdot x1 ", x1);
    console.log("showdot y1 ", y1);
    createDot(x1, y1, "hover-dot-1");

    if (rowData.dotx2 && rowData.doty2) {
        var x2Percent = parseFloat(rowData.dotx2);
        var y2Percent = parseFloat(rowData.doty2);
        var x2 = x2Percent * pitch.offsetWidth;
        var y2 = y2Percent * pitch.offsetHeight;
        createDot(x2, y2, "hover-dot-2");
        createArrow(x1, y1, x2, y2, "hover-arrow");
    }
}

function createDot(x, y, id) {
    var pitch = document.getElementById("pitch");
    var dot = document.createElement("div");
    dot.id = id;
    dot.className = "dot";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    pitch.appendChild(dot);
}

function removeDot() {
    // Modify to remove both dots
    var existingDot1 = document.getElementById("hover-dot-1");
    var existingDot2 = document.getElementById("hover-dot-2");
    var existingArrow = document.getElementById("hover-arrow");
    if (existingDot1) {
        existingDot1.parentNode.removeChild(existingDot1);
    }
    if (existingDot2) {
        existingDot2.parentNode.removeChild(existingDot2);
    }
    if (existingArrow) {
        existingArrow.parentNode.removeChild(existingArrow);
    }
}

function createArrow(x1, y1, x2, y2, id) {
    var minX = Math.min(x1, x2);
    var minY = Math.min(y1, y2);
    var width = Math.abs(x2 - x1);
    var height = Math.abs(y2 - y1);

    // Create an SVG element for the arrow
    var svgns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgns, "svg");
    // Adjust the width and height to include the markers
    svg.setAttribute("height", height + 20); // Add some padding for the marker
    svg.setAttribute("width", width + 20);
    // Position the SVG absolutely within the pitch
    svg.style.position = "absolute";
    svg.style.left = `${minX - 10}px`; // Shift to the left to account for marker
    svg.style.top = `${minY - 10}px`; // Shift up to account for marker
    svg.setAttribute("id", id);
    svg.setAttribute("class", "arrow");
    // Define the arrow marker
    var defs = document.createElementNS(svgns, "defs");
    var marker = document.createElementNS(svgns, "marker");
    marker.setAttribute("id", "markerArrow");
    marker.setAttribute("markerWidth", "13");
    marker.setAttribute("markerHeight", "13");
    marker.setAttribute("refX", "2");
    marker.setAttribute("refY", "6");
    marker.setAttribute("orient", "auto");
    var path = document.createElementNS(svgns, "path");
    path.setAttribute("d", "M2,2 L2,11 L10,6 L2,2");
    path.style.fill = "black";
    marker.appendChild(path);
    defs.appendChild(marker);
    svg.appendChild(defs);

    var angle = Math.atan2(y2 - y1, x2 - x1);
    let arrowheadLength = 22;
    // Calculate the adjustment based on the angle
    var adjustX = arrowheadLength * Math.cos(angle);
    var adjustY = arrowheadLength * Math.sin(angle);

    // Adjust the line's end point
    x2 = x2 - adjustX;
    y2 = y2 - adjustY;

    // Create the line for the arrow
    var line = document.createElementNS(svgns, "line");
    line.setAttribute("x1", x1 - minX + 10);
    line.setAttribute("y1", y1 - minY + 10);
    line.setAttribute("x2", x2 - minX + 10);
    line.setAttribute("y2", y2 - minY + 10);
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#markerArrow)");
    svg.appendChild(line);
    // Append the SVG to the pitch
    pitch.appendChild(svg);
}

///////////////////////////////// Download CSV function DOESNT WORK!!!
function downloadCSV() {
    console.log(shotsData);
    fetch("/download_csv", {
        method: "POST",
        body: JSON.stringify(shotsData),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.blob())
        .then((blob) => {
            // Create a link element, use it to download the CSV file
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = "shots_data.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch((error) => console.error("Error:", error));
}

///////////////////////////////// Keyboard Shortcuts
document.addEventListener('keydown', function(event) {
    // Player Selection
    const detailButtons = document.querySelectorAll('.detail-button');
    const eventButtons = document.querySelectorAll('.event-button');
    const surfaceButtons = document.querySelectorAll('.surface-button');
    if (event.key >= '1' && event.key <= '9') {
        // Calculate the index to select the right button
        const index = event.key - '1'; // Convert from string to number and adjust for 0-based indexing
        if (index < detailButtons.length) {
            // If the calculated button exists, simulate a click on it
            detailButtons[index].click();
        }
    }
    const detailkeyMap = {
        '0': 9, // Index of P10 
        'Q': 10, // Index of P11 
        'W': 11, // Index of P12
        'E': 12, // Index of P13
        'R': 13, // Index of P14
        'T': 14, // Index of P15
        'Y': 15, // Index of P16
    };
    
    // Check if the pressed key is in our map
    if (detailkeyMap.hasOwnProperty(event.key.toUpperCase())) {
        // Get the index from the map
        const index = detailkeyMap[event.key.toUpperCase()];
        const detailButtons = document.querySelectorAll('.detail-button');
        if (index < detailButtons.length) {
            // If the calculated button exists, simulate a click on it
            detailButtons[index].click();
        }
    }

    const eventKeyMap = {
        'A': 0, 
        'S': 1, 
        'D': 2, 
        'F': 3, 
        'G': 4, 
        'H': 5, 
        'J': 6, 
        'K': 7, 
        'L': 8, 
        ';': 9, 
        '.': 10,
    };
    if (eventKeyMap.hasOwnProperty(event.key.toUpperCase())) {
        // Get the index from the map
        const index = eventKeyMap[event.key.toUpperCase()];
        if (index < eventButtons.length) {
            // If the calculated button exists, simulate a click on it
            eventButtons[index].click();
        }
    }

    const surfaceKeyMap = {
        'Z': 0, // Index of Head?????
        'X': 1, 
        'C': 2, 
    };
    if (surfaceKeyMap.hasOwnProperty(event.key.toUpperCase())) {
        // Get the index from the map
        const index = surfaceKeyMap[event.key.toUpperCase()];
        if (index < surfaceButtons.length) {
            // If the calculated button exists, simulate a click on it
            surfaceButtons[index].click();
        }
    }
});
