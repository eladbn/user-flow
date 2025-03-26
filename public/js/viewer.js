document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const stepsList = document.getElementById('steps-list');
    const contentDisplay = document.getElementById('content-display');
    const flowSelect = document.getElementById('flow-select');
    const desktopViewBtn = document.getElementById('desktop-view');
    const mobileViewBtn = document.getElementById('mobile-view');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const stepIndicator = document.getElementById('step-indicator');
    const appLogo = document.getElementById('app-logo');
    
    // State
    let currentFlow = null;
    let currentStep = 1;
    let totalSteps = 0;
    let viewMode = 'desktop';
    
    // Initialize
    loadAppLogo();
    loadFlowsList();
    
    // Event listeners
    flowSelect.addEventListener('change', loadSelectedFlow);
    desktopViewBtn.addEventListener('click', () => setViewMode('desktop'));
    mobileViewBtn.addEventListener('click', () => setViewMode('mobile'));
    prevBtn.addEventListener('click', goToPreviousStep);
    nextBtn.addEventListener('click', goToNextStep);
    
    // Functions
    function loadAppLogo() {
      // Try to fetch logo from settings or admin configuration
      fetch('/api/settings/logo')
        .then(response => {
          if (!response.ok) {
            // No logo set or endpoint doesn't exist, use default
            return null;
          }
          return response.json();
        })
        .then(data => {
          if (data && data.logoPath) {
            const logoImg = document.createElement('img');
            logoImg.src = data.logoPath;
            logoImg.alt = 'לוגו האפליקציה';
            appLogo.innerHTML = '';
            appLogo.appendChild(logoImg);
          }
          // If no logo data, the default CSS logo will show
        })
        .catch(error => {
          console.log('Using default logo');
          // Default logo will show via CSS
        });
    }
    
    function loadFlowsList() {
      console.log('Loading flows list...');
      fetch('/api/flows')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(flows => {
          console.log('Flows loaded:', flows);
          // Clear existing options
          flowSelect.innerHTML = '<option value="">-- בחר תהליך --</option>';
          
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
          stepsList.innerHTML = '<div class="error-message">שגיאה בטעינת רשימת התהליכים</div>';
        });
    }
    
    function loadSelectedFlow() {
      const selectedFlowId = flowSelect.value;
      console.log('Selected flow ID:', selectedFlowId);
      
      if (!selectedFlowId) {
        resetFlowContainer();
        return;
      }
      
      fetch(`/api/flows/${selectedFlowId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(flow => {
          console.log('Flow loaded:', flow);
          currentFlow = flow;
          currentStep = 1;
          totalSteps = flow.steps ? flow.steps.length : 0;
          
          if (totalSteps === 0) {
            stepsList.innerHTML = '<div class="placeholder-message">אין צעדים בתהליך זה</div>';
            contentDisplay.innerHTML = '<div class="placeholder-message">אין צעדים להצגה</div>';
            updateNavigation();
            return;
          }
          
          renderStepsList();
          renderStepContent(currentStep);
          updateNavigation();
        })
        .catch(error => {
          console.error('Error loading flow:', error);
          stepsList.innerHTML = '<div class="error-message">שגיאה בטעינת התהליך</div>';
          contentDisplay.innerHTML = '<div class="error-message">שגיאה בטעינת התהליך</div>';
        });
    }
    
    function renderStepsList() {
      if (!currentFlow || !currentFlow.steps || currentFlow.steps.length === 0) {
        stepsList.innerHTML = '<div class="placeholder-message">אין צעדים בתהליך זה</div>';
        return;
      }
      
      // Clear container
      stepsList.innerHTML = '';
      
      // Create and append step items
      currentFlow.steps.forEach((step, index) => {
        const stepItem = document.createElement('div');
        stepItem.className = `step-item ${index + 1 === currentStep ? 'active' : ''}`;
        stepItem.dataset.step = index + 1;
        
        const stepTitle = document.createElement('div');
        stepTitle.className = 'step-item-title';
        stepTitle.textContent = step.title || `צעד ${index + 1}`;
        stepItem.appendChild(stepTitle);
        
        if (step.description) {
          const stepDesc = document.createElement('div');
          stepDesc.className = 'step-item-desc';
          stepDesc.textContent = step.description;
          stepItem.appendChild(stepDesc);
        }
        
        // Add click event to select this step
        stepItem.addEventListener('click', () => {
          setCurrentStep(index + 1);
        });
        
        stepsList.appendChild(stepItem);
      });
    }
    
    function renderStepContent(stepNumber) {
      if (!currentFlow || !currentFlow.steps || stepNumber < 1 || stepNumber > currentFlow.steps.length) {
        contentDisplay.innerHTML = '<div class="placeholder-message">בחר צעד להצגה</div>';
        return;
      }
      
      const step = currentFlow.steps[stepNumber - 1];
      const imagePath = viewMode === 'desktop' ? step.desktopImage : step.mobileImage;
      
      const content = document.createElement('div');
      content.className = 'step-content';
      
      const title = document.createElement('h2');
      title.textContent = step.title || `צעד ${stepNumber}`;
      content.appendChild(title);
      
      if (step.description) {
        const description = document.createElement('p');
        description.textContent = step.description;
        content.appendChild(description);
      }
      
      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      
      if (imagePath) {
        const image = document.createElement('img');
        image.src = imagePath;
        image.alt = `תמונה לצעד ${stepNumber}`;
        // Preload image and set proper dimensions to avoid layout shifts
        const preloadImg = new Image();
        preloadImg.onload = function() {
          // Once loaded, add it to the DOM
          imageContainer.appendChild(image);
        };
        preloadImg.onerror = function() {
          // Handle image load error
          const noImage = document.createElement('div');
          noImage.className = 'no-image-message';
          noImage.textContent = 'לא ניתן לטעון את התמונה';
          imageContainer.appendChild(noImage);
        };
        preloadImg.src = imagePath;
        
        // Also append immediately (the onload will replace if successful)
        imageContainer.appendChild(image);
      } else {
        const noImage = document.createElement('div');
        noImage.className = 'no-image-message';
        noImage.textContent = 'אין תמונה להצגה';
        imageContainer.appendChild(noImage);
      }
      
      content.appendChild(imageContainer);
      
      // Clear and update content display
      contentDisplay.innerHTML = '';
      contentDisplay.appendChild(content);
    }
    
    function setCurrentStep(stepNumber) {
      if (stepNumber < 1 || stepNumber > totalSteps) {
        return;
      }
      
      currentStep = stepNumber;
      
      // Update active step in the list
      const stepItems = stepsList.querySelectorAll('.step-item');
      stepItems.forEach(item => {
        const itemStep = parseInt(item.dataset.step);
        item.classList.toggle('active', itemStep === currentStep);
      });
      
      // Scroll to the active step
      const activeItem = stepsList.querySelector('.step-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      
      // Render the step content
      renderStepContent(currentStep);
      
      // Update navigation
      updateNavigation();
    }
    
    function setViewMode(mode) {
      viewMode = mode;
      
      // Update button states
      if (mode === 'desktop') {
        desktopViewBtn.classList.add('active');
        mobileViewBtn.classList.remove('active');
      } else {
        mobileViewBtn.classList.add('active');
        desktopViewBtn.classList.remove('active');
      }
      
      // Re-render current step to update image
      renderStepContent(currentStep);
    }
    
    function goToNextStep() {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
    
    function goToPreviousStep() {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    }
    
    function updateNavigation() {
      // Update indicator
      stepIndicator.textContent = totalSteps > 0 ? 
        `${currentStep} / ${totalSteps}` : '';
      
      // Update button states
      prevBtn.disabled = currentStep <= 1 || totalSteps === 0;
      nextBtn.disabled = currentStep >= totalSteps || totalSteps === 0;
    }
    
    function resetFlowContainer() {
      currentFlow = null;
      currentStep = 1;
      totalSteps = 0;
      stepsList.innerHTML = '<div class="placeholder-message">בחר תהליך להצגה</div>';
      contentDisplay.innerHTML = '<div class="placeholder-message">בחר תהליך וצעד להצגה</div>';
      updateNavigation();
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' && !nextBtn.disabled) {
        // In RTL, left arrow means next
        goToNextStep();
      } else if (e.key === 'ArrowRight' && !prevBtn.disabled) {
        // In RTL, right arrow means previous
        goToPreviousStep();
      }
    });
    
    // Handle window resize - ensure everything fits
    window.addEventListener('resize', function() {
      // Rerender content if needed
      if (currentFlow && currentFlow.steps && currentFlow.steps.length > 0) {
        renderStepContent(currentStep);
      }
    });
  });