document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const addNoteBtn = document.getElementById('add-note');
    const clearFormBtn = document.getElementById('clear-form');
    const notesContainer = document.getElementById('notes-container');
    const searchInput = document.getElementById('search-notes');
    const profilePhoto = document.querySelector('.profile-photo');
    
    // Set profile photo - replace with your actual image path
    profilePhoto.style.backgroundImage = "url('https://i.imgur.com/YourImageID.jpg')";
    
    // Allow user to upload a profile photo
    profilePhoto.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    profilePhoto.style.backgroundImage = `url('${event.target.result}')`;
                    // Save to localStorage
                    localStorage.setItem('profilePhoto', event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        
        fileInput.click();
    });
    
    // Load profile photo from localStorage if available
    const savedProfilePhoto = localStorage.getItem('profilePhoto');
    if (savedProfilePhoto) {
        profilePhoto.style.backgroundImage = `url('${savedProfilePhoto}')`;
    }
    
    // Current note being edited (null if adding a new note)
    let currentEditingId = null;
    
    // Load notes from localStorage
    loadNotes();
    
    // Event listeners
    addNoteBtn.addEventListener('click', function() {
        saveOrUpdateNote();
    });
    
    clearFormBtn.addEventListener('click', function() {
        clearForm();
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to save note
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            saveOrUpdateNote();
        }
    });
    
    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterNotes(searchTerm);
    });
    
    // Function to save or update a note
    function saveOrUpdateNote() {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        
        if (title === '' && content === '') {
            showNotification('Please add a title or content to your note!', 'error');
            return;
        }
        
        if (currentEditingId) {
            // Update existing note
            updateNote(currentEditingId, title, content);
        } else {
            // Create new note
            createNote(title, content);
        }
        
        clearForm();
    }
    
    // Function to create a new note
    function createNote(title, content) {
        const note = {
            id: Date.now(),
            title: title || 'Untitled',
            content: content,
            date: new Date().toLocaleString()
        };
        
        // Create note element
        createNoteElement(note);
        
        // Save to localStorage
        saveNote(note);
        
        showNotification('Note added successfully!', 'success');
    }
    
    // Function to update an existing note
    function updateNote(id, title, content) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const noteIndex = notes.findIndex(note => note.id === parseInt(id));
        
        if (noteIndex !== -1) {
            notes[noteIndex].title = title || 'Untitled';
            notes[noteIndex].content = content;
            notes[noteIndex].date = new Date().toLocaleString() + ' (Edited)';
            
            localStorage.setItem('notes', JSON.stringify(notes));
            
            // Refresh notes display
            refreshNotes();
            
            showNotification('Note updated successfully!', 'success');
        }
    }
    
    // Function to create note DOM element
    function createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.dataset.id = note.id;
        
        noteElement.innerHTML = `
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
            <div class="timestamp">${note.date}</div>
            <button class="edit-btn" title="Edit Note"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" title="Delete Note"><i class="fas fa-trash"></i></button>
        `;
        
        // Add delete event listener
        const deleteBtn = noteElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this note?')) {
                deleteNote(note.id);
                noteElement.remove();
                showNotification('Note deleted!', 'info');
            }
        });
        
        // Add edit event listener
        const editBtn = noteElement.querySelector('.edit-btn');
        editBtn.addEventListener('click', function() {
            editNote(note.id);
        });
        
        // Add to DOM
        notesContainer.prepend(noteElement);
    }
    
    // Function to edit a note
    function editNote(id) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const note = notes.find(note => note.id === parseInt(id));
        
        if (note) {
            noteTitle.value = note.title;
            noteContent.value = note.content;
            currentEditingId = note.id;
            
            // Change button text
            addNoteBtn.innerHTML = '<i class="fas fa-save"></i> Update Note';
            
            // Scroll to form
            document.querySelector('.note-form').scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Function to clear the form
    function clearForm() {
        noteTitle.value = '';
        noteContent.value = '';
        currentEditingId = null;
        
        // Reset button text
        addNoteBtn.innerHTML = '<i class="fas fa-plus"></i> Add Note';
    }
    
    // Function to save note to localStorage
    function saveNote(note) {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes.push(note);
        localStorage.setItem('notes', JSON.stringify(notes));
    }
    
    // Function to load notes from localStorage
    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        
        if (notes.length === 0) {
            notesContainer.innerHTML = '<div class="empty-state">No notes yet. Create your first note!</div>';
        } else {
            notes.sort((a, b) => b.id - a.id); // Sort by newest first
            notes.forEach(note => {
                createNoteElement(note);
            });
        }
    }
    
    // Function to refresh notes display
    function refreshNotes() {
        notesContainer.innerHTML = '';
        loadNotes();
    }
    
    // Function to delete note
    function deleteNote(id) {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes = notes.filter(note => note.id !== parseInt(id));
        localStorage.setItem('notes', JSON.stringify(notes));
        
        if (notes.length === 0) {
            notesContainer.innerHTML = '<div class="empty-state">No notes yet. Create your first note!</div>';
        }
    }
    
    // Function to filter notes based on search term
    function filterNotes(searchTerm) {
        const noteElements = document.querySelectorAll('.note');
        
        if (searchTerm === '') {
            // If search is empty, show all notes
            noteElements.forEach(note => {
                note.style.display = 'block';
            });
            return;
        }
        
        // Filter notes based on title and content
        noteElements.forEach(note => {
            const title = note.querySelector('h3').textContent.toLowerCase();
            const content = note.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || content.includes(searchTerm)) {
                note.style.display = 'block';
            } else {
                note.style.display = 'none';
            }
        });
        
        // Show message if no results
        const visibleNotes = document.querySelectorAll('.note[style="display: block;"]');
        if (visibleNotes.length === 0) {
            if (!document.querySelector('.no-results')) {
                const noResults = document.createElement('div');
                noResults.classList.add('no-results', 'empty-state');
                noResults.textContent = `No notes found matching "${searchTerm}"`;
                notesContainer.appendChild(noResults);
            }
        } else {
            const noResults = document.querySelector('.no-results');
            if (noResults) {
                noResults.remove();
            }
        }
    }
    
    // Function to escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Function to show notifications
    function showNotification(message, type) {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.classList.add('notification', `notification-${type}`);
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Helper function to get notification icon based on type
    function getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
                return 'fa-exclamation-circle';
            case 'info':
                return 'fa-info-circle';
            default:
                return 'fa-bell';
        }
    }
});