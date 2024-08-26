document.addEventListener('DOMContentLoaded', function() {
    var minSelect = document.getElementById('minBpm');
    var maxSelect = document.getElementById('maxBpm');
    var tableRows = document.querySelectorAll('#songsTable tbody tr');
    var playlistButton = document.getElementById('makePlaylist');
    var dummy = document.getElementById('fake');

    function filterTableRows() {
        var minBPM = parseInt(minSelect.value);
        var maxBPM = parseInt(maxSelect.value);

        tableRows.forEach(function(row) {
            var rowBPM = parseInt(row.getAttribute('data-bpm'));
            console.log(rowBPM)
            if (rowBPM >= minBPM && rowBPM <= maxBPM) {
                row.style.display = ''; // Show row
            } else {
                row.style.display = 'none'; // Hide row
            }
        });
    }

    var selectedArtists = [];
    var selectedGenres = [];
    var selectedSongs = [];
    var totalSelected = 0;

    function handleArtist(checkbox, itemName) {
        if (checkbox.checked && totalSelected < 5) {
            selectedArtists.push(itemName);
            totalSelected++;
        } else if (!checkbox.checked && selectedArtists.includes(itemName)) {
            selectedArtists = selectedArtists.filter(item => item !== itemName);
            totalSelected--; 
        } else {
            // If trying to select more than 5, uncheck the checkbox
            checkbox.checked = false;
            alert('You can only select up to 5 items.');
        }
        console.log('Selected Items: ', selectedArtists);
    }
    function handleSong(checkbox, itemName) {
        if (checkbox.checked && totalSelected < 5) {
            selectedSongs.push(itemName);
            totalSelected++;
        } else if (!checkbox.checked && selectedSongs.includes(itemName)) {
            selectedSongs = selectedSongs.filter(item => item !== itemName);
            totalSelected--; 
        } else {
            // If trying to select more than 5, uncheck the checkbox
            checkbox.checked = false;
            alert('You can only select up to 5 items.');
        }
        console.log('Selected Items: ', selectedSongs);
    }
    function handleGenre(checkbox, itemName) {
        if (checkbox.checked && totalSelected < 5) {
            selectedGenres.push(itemName);
            totalSelected++;
        } else if (!checkbox.checked && selectedGenres.includes(itemName)) {
            selectedGenres = selectedGenres.filter(item => item !== itemName);
            totalSelected--; 
        } else {
            // If trying to select more than 5, uncheck the checkbox
            checkbox.checked = false;
            alert('You can only select up to 5 items.');
        }
        console.log('Selected Items: ', selectedGenres);
    }
    

    


    function addToPlaylist(button) {
        // Get the row of the button clicked
        var songRow = button.parentNode.parentNode;
        var tempo = songRow.getAttribute('data-bpm');
        var songName = songRow.cells[1].textContent;
        
        // Create a new row for the playlist
        var newRow = document.createElement('tr');
        newRow.innerHTML = '<td>' + tempo + '</td><td>' + songName + '</td>';
        var removeButton = document.createElement('button');
        removeButton.textContent = '-';
        removeButton.className = 'removeFromPlaylist';
        removeButton.onclick = function() { removeFromPlaylist(this);};
        newRow.appendChild(removeButton);
        // Add the new row to the playlist table
        document.getElementById('playlistTable').querySelector('tbody').appendChild(newRow);
    
        // Remove the song from the songs table
        songRow.parentNode.removeChild(songRow);
    }

    function removeFromPlaylist(button, e) {
        //theres an issue with the stopPropagation here 
        e.stopPropagation();
        var songRow = button.parentNode;
        var tempo = songRow.cells[0].textContent;
        var songName = songRow.cells[1].textContent;

        var newRow = document.createElement('tr');
        newRow.setAttribute('data-bpm', tempo);
        newRow.innerHTML = '<td>' + tempo + '</td><td>' + songName + '</td><td> <button class="addToPlaylist"> + </button></td>';
        document.getElementById('songsTable').querySelector('tbody').appendChild(newRow);

        songRow.parentNode.removeChild(songRow);
    }


    // Add click event listeners to all buttons in the songs table
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('addToPlaylist')) {
            addToPlaylist(e.target);
        } else if (e.target && e.target.classList.contains('removeFromPlaylist')) {
            removeFromPlaylist(e.target, e);
        }
    });
    var genreChecks = document.querySelectorAll('input[type="checkbox"][name="genres"]');
    var artistChecks = document.querySelectorAll('input[type="checkbox"][name="artists"]');
    var songChecks = document.querySelectorAll('input[type="checkbox"][name="songs"]');

    songChecks.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleSong(this, this.value);
        });
    });
    artistChecks.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleArtist(this, this.value);
        });
    });
    genreChecks.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            handleGenre(this, this.value);
        });
    });

    var playlistTracks = [];
    function sendSelection() {
        fetch('/process_selection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({selectedArtists: selectedArtists, selectedGenres: selectedGenres, selectedSongs:selectedSongs})
        })
        .then(response => response.json())
        .then(data => {
            playlistTracks = data['recs']['tracks']
            createTableFromArray(playlistTracks);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function sendTracks() {
        fetch('/make_playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({tracks:playlistTracks})
        })
        .then(response => response.json())
        .then(data => {
            addLink(data['url'], 'Visit Spotify');

        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function addLink(url, linkText) {
        // Create a new anchor element
        var link = document.getElementById('playlistLink');
        link.href = url;
        link.textContent = linkText;
        link.target = '_blank';
    
    }
    // Function to create a table from an array
function createTableFromArray(dataArray) {
    // Create table elements
    var table = document.getElementById('selectedSongsTable');
    var tbody = table.getElementsByTagName('tbody')[0];
    var thead = table.getElementsByTagName('thead')[0];
    tbody.innerHTML = ''
    thead.innerHTML = '<tr><th>Suggested Songs</th></tr>'

    // Create and append rows to the table body
    dataArray.forEach(function(item) {
        var row = document.createElement('tr');
        var nameCell = document.createElement('td');
        nameCell.innerHTML = `${item.name} (${item.artists[0].name})  <audio controls style="width: 200px; height: 30px"> <source src='${item.preview_url}' type='audio/mpeg'>Your browser does not support the audio element.</audio>`
        row.appendChild(nameCell);
        tbody.appendChild(row);
    });

}

    var updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', sendSelection);

    var playlistButton = document.getElementById('makePlaylist');
    playlistButton.addEventListener('click', sendTracks);

    minSelect.addEventListener('change', filterTableRows);
    maxSelect.addEventListener('change', filterTableRows);
});



