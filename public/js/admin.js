document.addEventListener('DOMContentLoaded', function() {
  // Authentication related functions
  function checkAuthentication() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    
    if (!isAuthenticated) {
      showLoginPrompt();
    }
  }

  function showLoginPrompt() {
    // Create login overlay
    const loginOverlay = document.createElement('div');
    loginOverlay.className = 'login-overlay';
    
    const loginBox = document.createElement('div');
    loginBox.className = 'login-box';
    
    const loginTitle = document.createElement('h2');
    loginTitle.textContent = 'כניסת מנהל';
    
    const loginForm = document.createElement('form');
    loginForm.id = 'login-form';
    
    const passwordGroup = document.createElement('div');
    passwordGroup.className = 'form-group';
    
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'סיסמה';
    passwordLabel.setAttribute('for', 'admin-password');
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'admin-password';
    passwordInput.className = 'form-control';
    passwordInput.required = true;
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary w-100';
    submitButton.textContent = 'כניסה';
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'login-error';
    errorMessage.style.display = 'none';
    errorMessage.textContent = 'סיסמה שגויה';
    
    // Assemble the login form
    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);
    
    loginForm.appendChild(passwordGroup);
    loginForm.appendChild(submitButton);
    loginForm.appendChild(errorMessage);
    
    loginBox.appendChild(loginTitle);
    loginBox.appendChild(loginForm);
    
    loginOverlay.appendChild(loginBox);
    
    // Add to document
    document.body.appendChild(loginOverlay);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Focus on password input
    passwordInput.focus();
    
    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const password = passwordInput.value;
      const defaultPassword = 'adminadminadmin';
      
      if (password === defaultPassword) {
        // Set as authenticated
        localStorage.setItem('adminAuthenticated', 'true');
        
        // Remove login overlay
        document.body.removeChild(loginOverlay);
        document.body.style.overflow = ''; // Restore scrolling
        
        // Load the logo after successful authentication
        const logoElem = document.getElementById('header-logo');
        const savedLogo = localStorage.getItem('appLogo');
        if (savedLogo && logoElem) {
          logoElem.src = savedLogo;
        }
      } else {
        // Show error message
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
      }
    });
  }
  
  // Password protection - This line is important for resetting authentication
  // KEEP THIS LINE but only run it when we're managing authentication
  localStorage.removeItem('adminAuthenticated');
  checkAuthentication();
  
  // Unsaved changes tracking
  let hasUnsavedChangeFlag = false;
  
  function markUnsavedChanges() {
    hasUnsavedChangeFlag = true;
  }
  
  function resetUnsavedChanges() {
    hasUnsavedChangeFlag = false;
  }
  
  function hasUnsavedChanges() {
    return hasUnsavedChangeFlag;
  }
  
  // DOM elements
  const flowSelect = document.getElementById('flow-select');
  const createFlowBtn = document.getElementById('create-flow-btn');
  const flowDetailsForm = document.getElementById('flow-details-form');
  const flowNameInput = document.getElementById('flow-name');
  const flowDescriptionInput = document.getElementById('flow-description');
  const deleteFlowBtn = document.getElementById('delete-flow-btn');
  const stepsContainer = document.getElementById('steps-container');
  const addStepBtn = document.getElementById('add-step-btn');
  const stepModal = document.getElementById('step-modal');
  const stepForm = document.getElementById('step-form');
  const stepTitleInput = document.getElementById('step-title');
  const stepDescriptionInput = document.getElementById('step-description');
  const desktopImageInput = document.getElementById('desktop-image');
  const mobileImageInput = document.getElementById('mobile-image');
  const desktopImagePreview = document.getElementById('desktop-image-preview');
  const mobileImagePreview = document.getElementById('mobile-image-preview');
  const closeModal = document.querySelector('.close-modal');
  const previewContainer = document.getElementById('preview-container');
  const previewDesktopBtn = document.getElementById('preview-desktop-view');
  const previewMobileBtn = document.getElementById('preview-mobile-view');
  
  // State
  let currentFlowId = null;
  let currentFlow = null;
  let currentStepIndex = -1;
  let previewMode = 'desktop';
  
  // Initialize
  loadFlowsList();
  
  // Event listeners for tracking changes
  flowNameInput.addEventListener('change', markUnsavedChanges);
  flowDescriptionInput.addEventListener('change', markUnsavedChanges);
  
  // Add beforeunload event to warn about unsaved changes
  window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges()) {
      // Standard way to show a confirmation dialog before leaving
      const confirmationMessage = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב את הדף?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });
  
  // Event listeners
  flowSelect.addEventListener('change', loadSelectedFlow);
  createFlowBtn.addEventListener('click', createNewFlow);
  flowDetailsForm.addEventListener('submit', saveFlowDetails);
  deleteFlowBtn.addEventListener('click', deleteFlow);
  addStepBtn.addEventListener('click', () => openStepModal());
  closeModal.addEventListener('click', closeStepModal);
  stepForm.addEventListener('submit', saveStep);
  
  // Reset function for the editor
  function resetEditor() {
    // Reset flow state
    currentFlowId = null;
    currentFlow = null;
    
    // Reset form values
    flowNameInput.value = '';
    flowDescriptionInput.value = '';
    
    // Reset steps container
    stepsContainer.innerHTML = '<p class="empty-steps-message">אין צעדים בתהליך זה. הוסף צעד חדש להתחלה.</p>';
    
    // Reset preview container
    previewContainer.innerHTML = '<div class="placeholder-message">אין צעדים להצגה בתצוגה מקדימה</div>';
    
    // Disable delete button
    deleteFlowBtn.disabled = true;
    
    // Reset unsaved changes flag
    resetUnsavedChanges();
  }
  
  // Functions
  function loadFlowsList() {
    fetch('/api/flows')
      .then(response => response.json())
      .then(flows => {
        // Clear existing options
        flowSelect.innerHTML = '<option value="">-- בחר תהליך לעריכה --</option>';
        
        // Add flow options
        flows.forEach(flow => {
          const option = document.createElement('option');
          option.value = flow.id;
          option.textContent = flow.name;
          flowSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading flows:', error);
        alert('שגיאה בטעינת רשימת התהליכים');
      });
  }
  
  function loadSelectedFlow() {
    const selectedFlowId = flowSelect.value;
    
    // Check for unsaved changes before changing flow
    if (hasUnsavedChanges() && !confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעבור לתהליך אחר?')) {
      // Revert the dropdown to the previous selection
      flowSelect.value = currentFlowId || '';
      return;
    }
    
    if (!selectedFlowId) {
      resetEditor();
      return;
    }
    
    fetch(`/api/flows/${selectedFlowId}`)
      .then(response => response.json())
      .then(flow => {
        currentFlowId = flow.id;
        currentFlow = flow;
        
        // Populate flow details
        flowNameInput.value = flow.name || '';
        flowDescriptionInput.value = flow.description || '';
        
        // Render steps
        renderSteps();
        
        // Update preview
        renderPreview();
        
        // Enable delete button
        deleteFlowBtn.disabled = false;
        
        // Reset unsaved changes flag
        resetUnsavedChanges();
      })
      .catch(error => {
        console.error('Error loading flow:', error);
        alert('שגיאה בטעינת התהליך');
      });
  }
  
  function createNewFlow() {
    // Reset current flow
    resetEditor();
    
    // Set up new flow defaults
    currentFlowId = null;
    currentFlow = {
      name: 'תהליך חדש',
      description: '',
      steps: []
    };
    
    // Populate form with defaults
    flowNameInput.value = currentFlow.name;
    flowDescriptionInput.value = currentFlow.description;
    
    // Render empty steps container
    renderSteps();
    
    // Update preview
    renderPreview();
    
    // Disable delete button (can't delete unsaved flow)
    deleteFlowBtn.disabled = true;
  }
  
  function saveFlowDetails(e) {
    e.preventDefault();
    
    const flowData = {
      name: flowNameInput.value,
      description: flowDescriptionInput.value,
      steps: currentFlow ? currentFlow.steps : []
    };
    
    const method = currentFlowId ? 'PUT' : 'POST';
    const url = currentFlowId ? `/api/flows/${currentFlowId}` : '/api/flows';
    
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flowData)
    })
      .then(response => response.json())
      .then(flow => {
        // Update current flow
        currentFlowId = flow.id;
        currentFlow = flow;
        
        // Refresh flow list
        loadFlowsList();
        
        // Set the select value to the current flow
        flowSelect.value = currentFlowId;
        
        // Enable delete button
        deleteFlowBtn.disabled = false;
        
        // Reset unsaved changes flag
        resetUnsavedChanges();
        
        alert('התהליך נשמר בהצלחה');
      })
      .catch(error => {
        console.error('Error saving flow:', error);
        alert('שגיאה בשמירת התהליך');
      });
  }
  
  function deleteFlow() {
    if (!currentFlowId) return;
    
    if (!confirm('האם אתה בטוח שברצונך למחוק תהליך זה?')) {
      return;
    }
    
    fetch(`/api/flows/${currentFlowId}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(() => {
        // Reset editor state
        currentFlowId = null;
        currentFlow = null;
        flowNameInput.value = '';
        flowDescriptionInput.value = '';
        stepsContainer.innerHTML = '<p class="empty-steps-message">אין צעדים בתהליך זה. הוסף צעד חדש להתחלה.</p>';
        previewContainer.innerHTML = '<div class="placeholder-message">אין צעדים להצגה בתצוגה מקדימה</div>';
        deleteFlowBtn.disabled = true;
        
        // Reset flow selection in dropdown
        flowSelect.value = '';
        
        // Reset unsaved changes flag
        resetUnsavedChanges();
        
        // Refresh flow list
        loadFlowsList();
        
        alert('התהליך נמחק בהצלחה');
      })
      .catch(error => {
        console.error('Error deleting flow:', error);
        alert('שגיאה במחיקת התהליך');
      });
  }
  
  function renderSteps() {
    if (!currentFlow || !currentFlow.steps) {
      stepsContainer.innerHTML = '<p class="empty-steps-message">אין צעדים בתהליך זה. הוסף צעד חדש להתחלה.</p>';
      return;
    }
    
    if (currentFlow.steps.length === 0) {
      stepsContainer.innerHTML = '<p class="empty-steps-message">אין צעדים בתהליך זה. הוסף צעד חדש להתחלה.</p>';
      return;
    }
    
    // Clear container
    stepsContainer.innerHTML = '';
    
    // Create and append step items
    currentFlow.steps.forEach((step, index) => {
      const stepItem = document.createElement('div');
      stepItem.className = 'step-item';
      stepItem.dataset.index = index;
      
      const stepTitle = document.createElement('div');
      stepTitle.className = 'step-item-title';
      stepTitle.textContent = step.title || `צעד ${index + 1}`;
      
      const stepActions = document.createElement('div');
      stepActions.className = 'step-item-actions';
      
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'ערוך';
      editBtn.addEventListener('click', () => openStepModal(index));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-step';
      deleteBtn.textContent = 'מחק';
      deleteBtn.addEventListener('click', () => deleteStep(index));
      
      stepActions.appendChild(editBtn);
      stepActions.appendChild(deleteBtn);
      
      stepItem.appendChild(stepTitle);
      stepItem.appendChild(stepActions);
      stepsContainer.appendChild(stepItem);
    });
    
    // Reinitialize drag and drop
    initDragAndDrop();
  }
  
  function openStepModal(index = -1) {
    currentStepIndex = index;
    
    if (index >= 0 && currentFlow && currentFlow.steps && currentFlow.steps[index]) {
      // Edit existing step
      const step = currentFlow.steps[index];
      stepTitleInput.value = step.title || '';
      stepDescriptionInput.value = step.description || '';
      
      // Show image previews if available
      if (step.desktopImage) {
        desktopImagePreview.innerHTML = `<img src="${step.desktopImage}" alt="Desktop Preview">`;
      } else {
        desktopImagePreview.innerHTML = '';
      }
      
      if (step.mobileImage) {
        mobileImagePreview.innerHTML = `<img src="${step.mobileImage}" alt="Mobile Preview">`;
      } else {
        mobileImagePreview.innerHTML = '';
      }
    } else {
      // New step
      stepTitleInput.value = '';
      stepDescriptionInput.value = '';
      desktopImagePreview.innerHTML = '';
      mobileImagePreview.innerHTML = '';
    }
    
    // Reset file inputs
    desktopImageInput.value = '';
    mobileImageInput.value = '';
    
    // Show modal
    stepModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling of background
  }
  
  function closeStepModal() {
    stepModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    currentStepIndex = -1;
  }
  
  async function saveStep(e) {
    e.preventDefault();
    
    // Ensure we have a flow object
    if (!currentFlow) {
      currentFlow = {
        name: flowNameInput.value || 'תהליך חדש',
        description: flowDescriptionInput.value || '',
        steps: []
      };
    }
    
    // Ensure steps array exists
    if (!currentFlow.steps) {
      currentFlow.steps = [];
    }
    
    // Prepare step data
    const stepData = {
      title: stepTitleInput.value,
      description: stepDescriptionInput.value
    };
    
    // Handle desktop image upload
    if (desktopImageInput.files.length > 0) {
      const formData = new FormData();
      formData.append('desktopImage', desktopImageInput.files[0]);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        stepData.desktopImage = data.desktopImage;
      } catch (error) {
        console.error('Error uploading desktop image:', error);
      }
    } else if (currentStepIndex >= 0 && currentFlow.steps[currentStepIndex]) {
      // Keep existing image if editing and no new file selected
      stepData.desktopImage = currentFlow.steps[currentStepIndex].desktopImage;
    }
    
    // Handle mobile image upload
    if (mobileImageInput.files.length > 0) {
      const formData = new FormData();
      formData.append('mobileImage', mobileImageInput.files[0]);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        stepData.mobileImage = data.mobileImage;
      } catch (error) {
        console.error('Error uploading mobile image:', error);
      }
    } else if (currentStepIndex >= 0 && currentFlow.steps[currentStepIndex]) {
      // Keep existing image if editing and no new file selected
      stepData.mobileImage = currentFlow.steps[currentStepIndex].mobileImage;
    }
    
    // Add or update step
    if (currentStepIndex >= 0) {
      // Update existing step
      currentFlow.steps[currentStepIndex] = stepData;
    } else {
      // Add new step
      currentFlow.steps.push(stepData);
    }
    
    // Mark changes as unsaved
    markUnsavedChanges();
    
    // Close modal
    closeStepModal();
    
    // Render steps
    renderSteps();
    
    // Update preview
    renderPreview();
  }
  
  function deleteStep(index) {
    if (!currentFlow || !currentFlow.steps || index < 0 || index >= currentFlow.steps.length) {
      return;
    }
    
    if (!confirm('האם אתה בטוח שברצונך למחוק צעד זה?')) {
      return;
    }
    
    // Remove step
    currentFlow.steps.splice(index, 1);
    
    // Mark changes as unsaved
    markUnsavedChanges();
    
    // Render steps
    renderSteps();
    
    // Update preview
    renderPreview();
  }
  
  function initDragAndDrop() {
    // Initialize sortable if there are steps
    if (stepsContainer.querySelectorAll('.step-item').length > 0) {
      new Sortable(stepsContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function(evt) {
          // Get new order
          const items = stepsContainer.querySelectorAll('.step-item');
          const newSteps = [];
          
          items.forEach(item => {
            const index = parseInt(item.dataset.index);
            if (currentFlow && currentFlow.steps && index >= 0 && index < currentFlow.steps.length) {
              newSteps.push(currentFlow.steps[index]);
            }
          });
          
          // Update steps array
          if (currentFlow) {
            currentFlow.steps = newSteps;
          }
          
          // Re-render steps to update indices
          renderSteps();
          
          // Update preview
          renderPreview();
        }
      });
    }
  }
  
  // New and improved renderPreview function that only shows images for selected steps
  function renderPreview() {
    if (!currentFlow || !currentFlow.steps || currentFlow.steps.length === 0) {
      previewContainer.innerHTML = '<div class="placeholder-message">אין צעדים להצגה בתצוגה מקדימה</div>';
      return;
    }
    
    // Clear container
    previewContainer.innerHTML = '';
    
    // Hide the original view toggle buttons to avoid duplicates
    if (previewDesktopBtn && previewMobileBtn) {
      const viewToggleContainer = previewDesktopBtn.parentElement;
      if (viewToggleContainer) {
        viewToggleContainer.style.display = 'none';
      }
    }
    
    // Create steps list
    const stepsList = document.createElement('div');
    stepsList.className = 'steps-list';
    
    // Create image preview area
    const imagePreview = document.createElement('div');
    imagePreview.className = 'image-preview-area';
    
    // Create steps navigation
    currentFlow.steps.forEach((step, index) => {
      const stepItem = document.createElement('div');
      stepItem.className = 'step-nav-item';
      stepItem.textContent = step.title || `צעד ${index + 1}`;
      
      // Add active class to first step initially
      if (index === 0) {
        stepItem.classList.add('active');
      }
      
      // Click event to show step details
      stepItem.addEventListener('click', () => {
        // Update active step
        document.querySelectorAll('.step-nav-item').forEach(item => {
          item.classList.remove('active');
        });
        stepItem.classList.add('active');
        
        // Update image preview
        updateImagePreview(step, index);
      });
      
      stepsList.appendChild(stepItem);
    });
    
    // Add view mode toggle
    const viewModeToggle = document.createElement('div');
    viewModeToggle.className = 'view-mode-toggle';
    
    const desktopModeBtn = document.createElement('button');
    desktopModeBtn.className = 'btn btn-toggle';
    desktopModeBtn.innerHTML = '<i class="ri-computer-line"></i> מחשב';
    desktopModeBtn.dataset.mode = 'desktop';
    
    const mobileModeBtn = document.createElement('button');
    mobileModeBtn.className = 'btn btn-toggle';
    mobileModeBtn.innerHTML = '<i class="ri-smartphone-line"></i> מובייל';
    mobileModeBtn.dataset.mode = 'mobile';
    
    // Set active button based on current previewMode
    if (previewMode === 'desktop') {
      desktopModeBtn.classList.add('active');
    } else {
      mobileModeBtn.classList.add('active');
    }
    
    // View mode toggle event listeners
    desktopModeBtn.addEventListener('click', () => {
      previewMode = 'desktop';
      desktopModeBtn.classList.add('active');
      mobileModeBtn.classList.remove('active');
      
      // Update image preview with current selected step
      const activeStep = document.querySelector('.step-nav-item.active');
      if (activeStep) {
        const stepIndex = Array.from(stepsList.children).indexOf(activeStep);
        updateImagePreview(currentFlow.steps[stepIndex], stepIndex);
      }
    });
    
    mobileModeBtn.addEventListener('click', () => {
      previewMode = 'mobile';
      mobileModeBtn.classList.add('active');
      desktopModeBtn.classList.remove('active');
      
      // Update image preview with current selected step
      const activeStep = document.querySelector('.step-nav-item.active');
      if (activeStep) {
        const stepIndex = Array.from(stepsList.children).indexOf(activeStep);
        updateImagePreview(currentFlow.steps[stepIndex], stepIndex);
      }
    });
    
    viewModeToggle.appendChild(desktopModeBtn);
    viewModeToggle.appendChild(mobileModeBtn);
    
    // Combine elements
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'preview-wrapper';
    
    // Add view toggle first, then image preview in their own container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    imageContainer.appendChild(viewModeToggle);
    imageContainer.appendChild(imagePreview);
    
    previewWrapper.appendChild(stepsList);
    previewWrapper.appendChild(imageContainer);
    
    // Add to main preview container
    previewContainer.appendChild(previewWrapper);
    
    // Initial preview of first step
    if (currentFlow.steps.length > 0) {
      updateImagePreview(currentFlow.steps[0], 0);
    }
  }
  
  function updateImagePreview(step, index) {
    const imagePreviewArea = document.querySelector('.image-preview-area');
    
    // Clear previous preview
    imagePreviewArea.innerHTML = '';
    
    // Create step details container
    const stepDetails = document.createElement('div');
    stepDetails.className = 'step-details';
    
    // Add step title
    const title = document.createElement('h3');
    title.textContent = step.title || `צעד ${index + 1}`;
    stepDetails.appendChild(title);
    
    // Add step description if available
    if (step.description) {
      const description = document.createElement('p');
      description.textContent = step.description;
      stepDetails.appendChild(description);
    }
    
    // Add step details to preview area
    imagePreviewArea.appendChild(stepDetails);
    
    // Determine image path based on current preview mode
    const imagePath = previewMode === 'desktop' ? step.desktopImage : step.mobileImage;
    
    // Add image if available
    if (imagePath) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'step-image-wrapper';
      
      const image = document.createElement('img');
      image.className = 'step-image';
      image.src = imagePath;
      image.alt = `תמונה לצעד ${index + 1}`;
      
      imageWrapper.appendChild(image);
      imagePreviewArea.appendChild(imageWrapper);
    } else {
      // Show placeholder if no image available
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder-message';
      placeholder.textContent = `אין תמונת ${previewMode === 'desktop' ? 'מחשב' : 'מובייל'} לצעד זה`;
      imagePreviewArea.appendChild(placeholder);
    }
  }

  /**
 * Collapsible Sidebar Functionality
 * This adds toggle functionality to the sidebar
 */
  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'sidebar-toggle';
  toggleButton.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
  toggleButton.setAttribute('aria-label', 'toggle sidebar');
  toggleButton.setAttribute('type', 'button');
  
  // Get sidebar element
  const sidebar = document.querySelector('.sidebar');
  
  // Add toggle button to sidebar
  if (sidebar) {
    sidebar.appendChild(toggleButton);
    
    // Check if sidebar state is saved in localStorage
    const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isSidebarCollapsed) {
      sidebar.classList.add('collapsed');
    }
    
    // Add click event to toggle sidebar
    toggleButton.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      
      // Save state to localStorage
      localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
  }
});