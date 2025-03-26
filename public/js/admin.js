document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const flowSelect = document.getElementById('flow-select');
    const createFlowBtn = document.getElementById('create-flow-btn');
    const flowDetailsForm = document.getElementById('flow-details-form');
    const flowNameInput = document.getElementById('flow-name');
    const flowDescriptionInput = document.getElementById('flow-description');
    const saveFlowBtn = document.getElementById('save-flow-btn');
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
    initDragAndDrop();
    
    // Event listeners
    flowSelect.addEventListener('change', loadSelectedFlow);
    createFlowBtn.addEventListener('click', createNewFlow);
    flowDetailsForm.addEventListener('submit', saveFlowDetails);
    deleteFlowBtn.addEventListener('click', deleteFlow);
    addStepBtn.addEventListener('click', () => openStepModal());
    closeModal.addEventListener('click', closeStepModal);
    stepForm.addEventListener('submit', saveStep);
    previewDesktopBtn.addEventListener('click', () => setPreviewMode('desktop'));
    previewMobileBtn.addEventListener('click', () => setPreviewMode('mobile'));
    
    // Handle image uploads
    desktopImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          desktopImagePreview.innerHTML = `<img src="${e.target.result}" alt="Desktop Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });
    
    mobileImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          mobileImagePreview.innerHTML = `<img src="${e.target.result}" alt="Mobile Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });
    
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
      
      if (!selectedFlowId) {
        resetFlowEditor();
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
        })
        .catch(error => {
          console.error('Error loading flow:', error);
          alert('שגיאה בטעינת התהליך');
        });
    }
    
    function createNewFlow() {
      // Reset current flow
      resetFlowEditor();
      
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
          // Reset editor
          resetFlowEditor();
          
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
      stepModal.style.display = 'block';
    }
    
    function closeStepModal() {
      stepModal.style.display = 'none';
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
    
    function renderPreview() {
      if (!currentFlow || !currentFlow.steps || currentFlow.steps.length === 0) {
        previewContainer.innerHTML = '<div class="placeholder-message">אין צעדים להצגה בתצוגה מקדימה</div>';
        return;
      }
      
      // Clear container
      previewContainer.innerHTML = '';
      
      // Create and append steps
      currentFlow.steps.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = 'flow-step';
        
        const title = document.createElement('h3');
        title.textContent = step.title;
        stepElement.appendChild(title);
        
        if (step.description) {
          const description = document.createElement('p');
          description.textContent = step.description;
          stepElement.appendChild(description);
        }
        
        // Add the appropriate image based on view mode
        const imagePath = previewMode === 'desktop' ? step.desktopImage : step.mobileImage;
        
        if (imagePath) {
          const image = document.createElement('img');
          image.className = 'step-image';
          image.src = imagePath;
          image.alt = `תמונה לצעד ${index + 1}`;
          stepElement.appendChild(image);
        }
        
        previewContainer.appendChild(stepElement);
      });
      
      // Update preview mode
      updatePreviewMode();
    }
    
    function setPreviewMode(mode) {
      previewMode = mode;
      updatePreviewMode();
      
      // Update button states
      if (mode === 'desktop') {
        previewDesktopBtn.classList.add('active');
        previewMobileBtn.classList.remove('active');
      } else {
        previewMobileBtn.classList.add('active');
        previewDesktopBtn.classList.remove('active');
      }
      
      // Re-render preview to show correct images
      renderPreview();
    }
    
    function updatePreviewMode() {
      if (previewMode === 'desktop') {
        previewContainer.className = 'preview-container desktop-mode';
      } else {
        previewContainer.className = 'preview-container mobile-mode';
      }
    }
    
    function resetFlowEditor() {
      currentFlowId = null;
      currentFlow = null;
      currentStepIndex = -1;
      
      // Reset form
      flowNameInput.value = '';
      flowDescriptionInput.value = '';
      
      // Reset steps
      stepsContainer.innerHTML = '<p class="empty-steps-message">אין צעדים בתהליך זה. הוסף צעד חדש להתחלה.</p>';
      
      // Reset preview
      previewContainer.innerHTML = '<div class="placeholder-message">אין צעדים להצגה בתצוגה מקדימה</div>';
      
      // Disable delete button
      deleteFlowBtn.disabled = true;
    }
    
    // Handle window clicks to close modal
    window.addEventListener('click', function(event) {
      if (event.target === stepModal) {
        closeStepModal();
      }
    });
    
    // Handle key presses (Escape to close modal)
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && stepModal.style.display === 'block') {
        closeStepModal();
      }
    });
});

// Logo upload handling
const logoUploadInput = document.getElementById('logo-upload');
const logoPreview = document.getElementById('logo-preview');
const logoForm = document.getElementById('logo-form');
const saveLogoBtn = document.getElementById('save-logo-btn');

// Load current logo if exists
fetch('/api/settings/logo')
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    return { logoPath: null };
  })
  .then(data => {
    if (data.logoPath) {
      logoPreview.innerHTML = `<img src="${data.logoPath}" alt="לוגו">`;
    }
  })
  .catch(error => {
    console.error('Error loading logo:', error);
  });

// Preview logo when file selected
logoUploadInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      logoPreview.innerHTML = `<img src="${e.target.result}" alt="תצוגה מקדימה של הלוגו">`;
    };
    reader.readAsDataURL(file);
  }
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
    
    if (!response.ok) {
      throw new Error('שגיאה בהעלאת הלוגו');
    }
    
    const data = await response.json();
    
    // Update preview with the server path
    logoPreview.innerHTML = `<img src="${data.logoPath}" alt="לוגו">`;
    
    alert('הלוגו נשמר בהצלחה');
  } catch (error) {
    console.error('Error uploading logo:', error);
    alert('שגיאה בהעלאת הלוגו');
  } finally {
    saveLogoBtn.disabled = false;
    saveLogoBtn.textContent = 'שמור לוגו';
  }
});