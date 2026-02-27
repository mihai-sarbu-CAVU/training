document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup =
          details.participants.length > 0
            ? `<ul class="participants-list">${details.participants
                .map(
                  (participant) =>
                    `<li class="participant-item" data-email="${participant}" data-activity="${name}">
                      <span class="participant-email">${participant}</span>
                      <div class="participant-actions">
                        <button
                          type="button"
                          class="participant-delete"
                          aria-label="Remove ${participant} from ${name}"
                        >🗑️</button>
                        <div class="participant-confirm hidden">
                          <button type="button" class="participant-confirm-yes">Remove</button>
                          <button type="button" class="participant-confirm-no">Cancel</button>
                        </div>
                      </div>
                    </li>`
                )
                .join("")}</ul>`
            : '<p class="participants-empty">No participants yet.</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants:</strong></p>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");
    const cancelButton = event.target.closest(".participant-confirm-no");
    const confirmButton = event.target.closest(".participant-confirm-yes");

    const closeAllConfirmations = () => {
      activitiesList.querySelectorAll(".participant-item").forEach((item) => {
        const rowDeleteButton = item.querySelector(".participant-delete");
        const rowConfirm = item.querySelector(".participant-confirm");

        if (rowDeleteButton) {
          rowDeleteButton.classList.remove("hidden");
        }

        if (rowConfirm) {
          rowConfirm.classList.add("hidden");
        }
      });
    };

    if (cancelButton) {
      const participantItem = cancelButton.closest(".participant-item");
      const rowDeleteButton = participantItem?.querySelector(".participant-delete");
      const rowConfirm = participantItem?.querySelector(".participant-confirm");

      if (rowDeleteButton) {
        rowDeleteButton.classList.remove("hidden");
      }

      if (rowConfirm) {
        rowConfirm.classList.add("hidden");
      }

      return;
    }

    if (deleteButton) {
      closeAllConfirmations();

      const participantItem = deleteButton.closest(".participant-item");
      const rowConfirm = participantItem?.querySelector(".participant-confirm");

      deleteButton.classList.add("hidden");
      rowConfirm?.classList.remove("hidden");
      return;
    }

    if (!confirmButton) {
      return;
    }

    const participantItem = confirmButton.closest(".participant-item");
    const email = participantItem?.dataset.email;
    const activity = participantItem?.dataset.activity;

    if (!email || !activity) {
      messageDiv.textContent = "Missing participant details.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        closeAllConfirmations();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
