// Global Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Tab switching listener is handled by inline onclick, but let's initialize if needed
    
    // Load sample button
    const btnLoadSample = document.getElementById("btn-load-sample");
    if (btnLoadSample) {
        btnLoadSample.addEventListener("click", loadSamplePIB);
    }

    // Form submission
    const form = document.getElementById("video-gen-form");
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
    }

    // Reset button
    const btnReset = document.getElementById("btn-reset");
    if (btnReset) {
        btnReset.addEventListener("click", resetStudioState);
    }
});

// Sample PIB Press Release Text
const SAMPLE_PIB_TEXT = `PRESS INFORMATION BUREAU
GOVERNMENT OF INDIA
***
ISRO ACHIEVES MAJOR MILESTONE IN GAGANYAAN MISSION: SERVICE MODULE PROPULSION SYSTEM SUCCESSFULLY TESTED

Bengaluru, June 26, 2026

The Indian Space Research Organisation (ISRO) has achieved a significant milestone in the Gaganyaan human spaceflight mission by successfully completing the hot testing of the Gaganyaan Service Module Propulsion System (SMPS) at the ISRO Propulsion Complex in Mahendragiri, Tamil Nadu.

The test, which lasted for 250 seconds, demonstrated the stable performance of the propulsion system in its full operational configuration. The system consists of five liquid engines and sixteen reaction control thrusters. The service module is a vital component of the spacecraft, providing power, life support, and propulsion to the crew module during its entire journey in space.

ISRO Chairman Dr. S. Somanath congratulated the mission team, stating that this successful test brings India one step closer to launching its first astronaut crew into orbit. The data collected will undergo detailed analysis to validate all system parameters for the upcoming unmanned orbital flights.`;

// Load Sample PIB
function loadSamplePIB() {
    const pibTextarea = document.getElementById("pib_text");
    if (pibTextarea) {
        pibTextarea.value = SAMPLE_PIB_TEXT;
        flashNotify("Sample Press Release loaded successfully!", "success");
    }
}

// Tab Switching Logic
function switchTab(event, tabId) {
    // Deactivate all tab buttons and content
    const buttons = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");
    
    buttons.forEach(btn => btn.classList.remove("active"));
    contents.forEach(content => content.classList.remove("active"));
    
    // Activate target tab and button
    event.currentTarget.classList.add("active");
    document.getElementById(tabId).classList.add("active");
}

// Helper to notify via flash messages
function flashNotify(message, type = "info") {
    const container = document.querySelector(".flash-messages-container");
    if (!container) return;

    const messageHtml = `
        <div class="flash-message ${type} fade-in">
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'danger' ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i>
            <span>${message}</span>
            <button class="close-flash" onclick="this.parentElement.remove();">&times;</button>
        </div>
    `;
    container.insertAdjacentHTML("beforeend", messageHtml);
}

// Form Submit Handler
async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const pibText = document.getElementById("pib_text").value;
    const language = document.getElementById("language").value;
    const engineMode = document.getElementById("engine_mode").value;
    const apiKey = document.getElementById("api_key").value;

    if (!pibText || pibText.trim().length < 100) {
        flashNotify("Please enter a valid Press Release (min 100 characters).", "danger");
        return;
    }

    // Toggle Panels
    document.getElementById("output-empty-state").classList.add("hidden");
    document.getElementById("output-result-state").classList.add("hidden");
    document.getElementById("output-loading-state").classList.remove("hidden");

    // Reset progress steps UI
    resetProgressSteps();

    // Prepare Form Data
    const formData = new FormData();
    formData.append("pib_text", pibText);
    formData.append("language", language);
    formData.append("engine_mode", engineMode);
    formData.append("api_key", apiKey);

    try {
        const response = await fetch("/api/generate", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Generation request failed.");
        }

        // Read Streaming Response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Split by double newline which is standard in SSE or simply newlines
            const lines = buffer.split("\n");
            // Keep the last partial line in the buffer
            buffer = lines.pop();

            for (const line of lines) {
                if (line.trim().startsWith("data:")) {
                    try {
                        const jsonStr = line.replace("data:", "").trim();
                        const data = JSON.parse(jsonStr);
                        updateProgressUI(data);
                    } catch (err) {
                        console.error("Error parsing progress chunk", err);
                    }
                }
            }
        }

    } catch (error) {
        console.error("Error:", error);
        flashNotify(error.message || "An unexpected error occurred during generation.", "danger");
        resetStudioState();
    }
}

// Reset the progress steps UI
function resetProgressSteps() {
    const steps = ["step-nlp", "step-translate", "step-audio", "step-visual", "step-compile"];
    steps.forEach(id => {
        const item = document.getElementById(id);
        if (item) {
            item.className = "progress-step-item pending";
            const icon = item.querySelector(".step-icon");
            icon.className = "step-icon fa-solid fa-circle-notch";
        }
    });
    document.getElementById("progress-bar-fill").style.width = "0%";
    document.getElementById("current-step-title").innerText = "Initializing Pipeline...";
    document.getElementById("current-step-detail").innerText = "Setting up local directories and validating input.";
}

// Update the Progress UI based on streaming status
function updateProgressUI(data) {
    const { status, progress, step, message, result } = data;

    // Update Progress Bar
    const progressBar = document.getElementById("progress-bar-fill");
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    // Update Headings
    if (status === "processing") {
        document.getElementById("current-step-title").innerText = `Processing: ${getStepTitle(step)}`;
        document.getElementById("current-step-detail").innerText = message;
        
        // Update Steps List
        activateStepUI(step);
    } else if (status === "success") {
        // Mark all steps as complete
        markAllStepsComplete();
        
        // Show Results
        setTimeout(() => {
            displayResults(result);
        }, 800);
    } else if (status === "error") {
        flashNotify(message || "Pipeline synthesis failed.", "danger");
        resetStudioState();
    }
}

// Map key steps to readable title
function getStepTitle(step) {
    const titles = {
        "nlp": "Summarizing & Extracting Keywords",
        "translate": "Translating to Regional Language",
        "audio": "Synthesizing Narration Voiceover",
        "visual": "Rendering Infographic Scenes",
        "compile": "Stitching Assets & Compiling Video"
    };
    return titles[step] || "Processing Pipeline";
}

// Set active class on active step and check previous ones
function activateStepUI(currentStep) {
    const steps = ["nlp", "translate", "audio", "visual", "compile"];
    const currentIndex = steps.indexOf(currentStep);

    steps.forEach((step, index) => {
        const item = document.getElementById(`step-${step}`);
        if (!item) return;

        const icon = item.querySelector(".step-icon");

        if (index < currentIndex) {
            // Completed step
            item.className = "progress-step-item completed";
            icon.className = "step-icon fa-solid fa-circle-check";
        } else if (index === currentIndex) {
            // Active step
            item.className = "progress-step-item active";
            icon.className = "step-icon fa-solid fa-circle-notch fa-spin";
        } else {
            // Pending step
            item.className = "progress-step-item pending";
            icon.className = "step-icon fa-solid fa-circle-notch";
        }
    });
}

// Mark all steps checkmark
function markAllStepsComplete() {
    const steps = ["nlp", "translate", "audio", "visual", "compile"];
    steps.forEach(step => {
        const item = document.getElementById(`step-${step}`);
        if (item) {
            item.className = "progress-step-item completed";
            const icon = item.querySelector(".step-icon");
            icon.className = "step-icon fa-solid fa-circle-check";
        }
    });
    document.getElementById("progress-bar-fill").style.width = "100%";
    document.getElementById("current-step-title").innerText = "Generation Completed!";
    document.getElementById("current-step-detail").innerText = "Stitching complete. Loading video player...";
}

// Display Generated Results
function displayResults(result) {
    // Hide loader, show results
    document.getElementById("output-loading-state").classList.add("hidden");
    document.getElementById("output-result-state").classList.remove("hidden");

    // Set Video Player Source
    const player = document.getElementById("output-video-player");
    player.src = result.video_url;
    player.load();

    // Set Download Link
    const btnDownload = document.getElementById("btn-download-video");
    btnDownload.href = result.video_url;

    // Fill Summary Tab
    document.getElementById("original-title-display").innerText = result.original_title;
    
    const summaryList = document.getElementById("summary-points-display");
    summaryList.innerHTML = "";
    result.summary_points.forEach(point => {
        const li = document.createElement("li");
        li.innerText = point;
        summaryList.appendChild(li);
    });

    // Fill Translation Tab
    document.getElementById("translated-lang-title").innerText = `Translated Highlights (${result.language_name})`;
    const translatedList = document.getElementById("translated-points-display");
    translatedList.innerHTML = "";
    result.translated_points.forEach(point => {
        const li = document.createElement("li");
        li.innerText = point;
        translatedList.appendChild(li);
    });

    // Fill Storyboard Script Tab
    const timeline = document.getElementById("storyboard-timeline");
    timeline.innerHTML = "";
    result.scenes.forEach((scene, index) => {
        const item = document.createElement("div");
        item.className = "timeline-item";
        item.innerHTML = `
            <div class="timeline-header">
                <span>SCENE ${index + 1}</span>
                <span>Duration: ~${scene.duration}s</span>
            </div>
            <div class="timeline-title">${scene.headline || 'Scene Headline'}</div>
            <div class="timeline-content">${scene.narration}</div>
            <div class="timeline-meta">
                <div class="meta-row">
                    <span class="meta-label">Visual prompt:</span> 
                    <span>${scene.visual_prompt || 'Slide text card with clean title'}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Keywords:</span> 
                    <span>${scene.keywords ? scene.keywords.join(', ') : 'PIB, Government'}</span>
                </div>
            </div>
        `;
        timeline.appendChild(item);
    });
}

// Reset Studio State
function resetStudioState() {
    document.getElementById("output-loading-state").classList.add("hidden");
    document.getElementById("output-result-state").classList.add("hidden");
    document.getElementById("output-empty-state").classList.remove("hidden");
    
    // Stop video if playing
    const player = document.getElementById("output-video-player");
    player.src = "";
}
