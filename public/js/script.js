// File: public/script.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const flowContainer = document.querySelector('.flow-container');
    const desktopViewBtn = document.getElementById('desktop-view');
    const mobileViewBtn = document.getElementById('mobile-view');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const stepIndicator = document.getElementById('step-indicator');
    const flowSteps = document.querySelectorAll('.flow-step');
    
    // State
    let currentStep = 1;
    const totalSteps = flowSteps.length;
    
    // Toggle view mode
    desktopViewBtn.addEventListener('click', function() {
      flowContainer.className = 'flow-container desktop-mode';
      desktopViewBtn.classList.add('active');
      mobileViewBtn.classList.remove('active');
      updateStepVisibility();
    });
    
    mobileViewBtn.addEventListener('click', function() {
      flowContainer.className = 'flow-container mobile-mode';
      mobileViewBtn.classList.add('active');
      desktopViewBtn.classList.remove('active');
      updateStepVisibility();
    });
    
    // Navigation
    prevBtn.addEventListener('click', function() {
      if (currentStep > 1) {
        currentStep--;
        updateStepVisibility();
      }
    });
    
    nextBtn.addEventListener('click', function() {
      if (currentStep < totalSteps) {
        currentStep++;
        updateStepVisibility();
      }
    });
    
    // Update UI based on current step
    function updateStepVisibility() {
      // Update step indicator
      stepIndicator.textContent = `Step ${currentStep} of ${totalSteps}`;
      
      // Update navigation buttons
      prevBtn.disabled = currentStep === 1;
      nextBtn.disabled = currentStep === totalSteps;
      
      // Update active step
      flowSteps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        step.classList.remove('active');
        
        if (stepNumber === currentStep) {
          step.classList.add('active');
        }
      });
      
      // In desktop mode, all steps are visible
      // In mobile mode, only the active step is visible
      if (flowContainer.classList.contains('mobile-mode')) {
        flowSteps.forEach(step => {
          step.style.display = 'none';
        });
        document.querySelector(`.flow-step[data-step="${currentStep}"]`).style.display = 'block';
      } else {
        flowSteps.forEach(step => {
          step.style.display = 'block';
        });
      }
    }
    
    // Initialize
    updateStepVisibility();
  });