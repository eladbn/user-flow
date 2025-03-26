/**
 * File Upload Handler
 * Handles drag and drop file uploads for the admin panel
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('File upload handler initializing...');
    
    // Initialize all general file uploads (for steps)
    initFileUploads();
    
    // Separate initialization for logo upload
    initLogoUpload();
    
    console.log('File upload handler initialized');
  });
  
  /**
   * Initialize all file upload inputs with drag & drop
   */
  function initFileUploads() {
    // Find all file upload containers
    const fileUploads = document.querySelectorAll('.file-upload');
    
    fileUploads.forEach(upload => {
      const input = upload.querySelector('input[type="file"]');
      
      if (!input) return;
      
      // Get the ID of the preview container based on the input's ID
      const previewId = input.id + '-preview';
      const previewContainer = document.getElementById(previewId);
      
      if (!previewContainer) {
        console.warn(`Preview container with id ${previewId} not found for input ${input.id}`);
        return;
      }
      
      // Make the file upload clickable to trigger file input
      upload.addEventListener('click', function(e) {
        // Don't trigger if clicking on the input itself (to avoid double events)
        if (e.target !== input) {
          input.click();
        }
      });
      
      // Add drag and drop functionality
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        upload.addEventListener(eventName, preventDefaults, false);
      });
      
      ['dragenter', 'dragover'].forEach(eventName => {
        upload.addEventListener(eventName, function() {
          upload.classList.add('highlight');
        }, false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        upload.addEventListener(eventName, function() {
          upload.classList.remove('highlight');
        }, false);
      });
      
      // Handle file drop
      upload.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
          input.files = files;
          handleFilePreview(input, previewContainer);
        }
      });
      
      // Handle file selection via input
      input.addEventListener('change', function() {
        handleFilePreview(input, previewContainer);
      });
      
      // Stop propagation on input click to prevent double events
      input.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    });
  }
  
  /**
   * Initialize logo upload specifically
   */
  function initLogoUpload() {
    const logoForm = document.getElementById('logo-form');
    const logoUploadInput = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const logoUploadContainer = document.querySelector('#logo-form .file-upload');
    const saveLogoBtn = document.getElementById('save-logo-btn');
    
    if (!logoForm || !logoUploadInput || !logoPreview || !logoUploadContainer) {
      console.error('Logo upload elements not found:', { 
        logoForm: !!logoForm, 
        logoUploadInput: !!logoUploadInput, 
        logoPreview: !!logoPreview,
        logoUploadContainer: !!logoUploadContainer
      });
      return;
    }
    
    // Debug message to verify initialization
    console.log('Logo upload initialized with elements:', { 
      logoForm: logoForm.id, 
      logoUploadInput: logoUploadInput.id, 
      logoPreview: logoPreview.id 
    });
    
    // Make the logo upload clickable
    logoUploadContainer.addEventListener('click', function(e) {
      // Don't trigger if clicking on the input itself (to avoid double events)
      if (e.target !== logoUploadInput) {
        logoUploadInput.click();
      }
    });
    
    // Add drag and drop functionality specifically for logo
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      logoUploadContainer.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      logoUploadContainer.addEventListener(eventName, function() {
        logoUploadContainer.classList.add('highlight');
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      logoUploadContainer.addEventListener(eventName, function() {
        logoUploadContainer.classList.remove('highlight');
      }, false);
    });
    
    // Handle file drop specifically for logo
    logoUploadContainer.addEventListener('drop', function(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files.length > 0) {
        logoUploadInput.files = files;
        // Use the direct function here for the logo preview
        handleLogoPreview(logoUploadInput, logoPreview);
      }
    });
    
    // Handle file selection via input for logo
    logoUploadInput.addEventListener('change', function() {
      // Use the direct function here for the logo preview
      handleLogoPreview(logoUploadInput, logoPreview);
    });
    
    // Stop propagation on input click to prevent double events
    logoUploadInput.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Load current logo if exists
   // Load current logo if exists
   fetch('/api/settings/logo')
   .then(response => {
     if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
       return response.json();
     }
     return { logoPath: null };
   })
   .then(data => {
     if (data && data.logoPath) {
       logoPreview.innerHTML = `<img src="${data.logoPath}" alt="לוגו">`;
       
       // Also update the sidebar logo
       const sidebarLogo = document.querySelector('.sidebar-header .logo');
       if (sidebarLogo) {
         sidebarLogo.src = data.logoPath;
       }
     }
   })
   .catch(error => {
     console.error('Error loading logo:', error);
     // Silently fail - we don't want to alert the user for this
   });
    
    // Handle logo form submission
    logoForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!logoUploadInput.files.length) {
        alert('נא לבחור קובץ לוגו להעלאה');
        return;
      }
      
      const formData = new FormData();
      formData.append('logo', logoUploadInput.files[0]);
      
      try {
        saveLogoBtn.disabled = true;
        saveLogoBtn.textContent = 'מעלה...';
        
        const response = await fetch('/api/settings/logo', {
          method: 'POST',
          body: formData
        });
        
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
          throw new Error('שגיאה בהעלאת הלוגו - סוג תגובה לא תקין');
        }
        
        const data = await response.json();
        
        // If we have no logo path, use the local preview instead
        if (!data.logoPath) {
          // Keep the current preview that shows the file they uploaded
          alert('הלוגו נשמר בהצלחה');
          return;
        }
        
        // Update preview with the server path
        // Update preview with the server path
        logoPreview.innerHTML = `<img src="${data.logoPath}" alt="לוגו">`;
        
        // Also update the sidebar logo
        const sidebarLogo = document.querySelector('.sidebar-header .logo');
        if (sidebarLogo) {
          sidebarLogo.src = data.logoPath;
        }
        
        // Save to localStorage for more reliable access
        localStorage.setItem('appLogo', data.logoPath);
        
        alert('הלוגו נשמר בהצלחה');
      } catch (error) {
        console.error('Error uploading logo:', error);
        alert('שגיאה בהעלאת הלוגו');
      } finally {
        saveLogoBtn.disabled = false;
        saveLogoBtn.textContent = 'שמור לוגו';
      }
    });
  }
  
  /**
   * Special function just for handling logo preview
   * This separates it from the general handleFilePreview function
   */
  function handleLogoPreview(input, previewContainer) {
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    
    // Validate file type is an image
    if (!file.type.startsWith('image/')) {
      alert('נא לבחור קובץ תמונה בלבד');
      input.value = ''; // Clear the input
      return;
    }
    
    console.log('Logo file selected:', file.name, file.type, file.size);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      console.log('Logo file read successfully');
      
      // Create image to check dimensions
      const img = new Image();
      
      img.onload = function() {
        console.log('Logo image dimensions:', img.width, 'x', img.height);
        
        // Show preview
        previewContainer.innerHTML = `<img src="${e.target.result}" alt="תצוגה מקדימה" style="max-width: 100%; max-height: 100%;">`;
        console.log('Logo preview updated');
      };
      
      img.onerror = function() {
        console.error('Error loading logo image');
        previewContainer.innerHTML = '<div style="color:red">שגיאה בטעינת התמונה</div>';
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      console.error('Error reading logo file');
      previewContainer.innerHTML = '<div style="color:red">שגיאה בקריאת הקובץ</div>';
    };
    
    reader.readAsDataURL(file);
  }
  
  /**
   * Prevent defaults for drag and drop events
   */
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  /**
   * Handle file preview for uploaded files
   */
  function handleFilePreview(input, previewContainer) {
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    
    // Validate file type is an image
    if (!file.type.startsWith('image/')) {
      alert('נא לבחור קובץ תמונה בלבד');
      input.value = ''; // Clear the input
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      // Create image to check dimensions
      const img = new Image();
      
      img.onload = function() {
        // For optimization, resize large images
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            // Width is the problem
            width = maxWidth;
            height = (img.height / img.width) * maxWidth;
          } else {
            // Height is the problem
            height = maxHeight;
            width = (img.width / img.height) * maxHeight;
          }
        }
        
        // Show preview
        previewContainer.innerHTML = `<img src="${e.target.result}" alt="תצוגה מקדימה" style="max-width: 100%; max-height: 100%;">`;
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
    
    // Mark form as having unsaved changes (if we're in admin context)
    if (typeof markUnsavedChanges === 'function') {
      markUnsavedChanges();
    }
  }