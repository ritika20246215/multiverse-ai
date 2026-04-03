const state = {
  tasks: [],
  filters: {
    status: "all",
    priority: "all",
    search: ""
  },
  sortable: null,
  deleteTargetId: "",
  completionAudio: null
};

const elements = {
  body: document.body,
  sidebar: document.getElementById("sidebar"),
  openSidebar: document.getElementById("openSidebar"),
  closeSidebar: document.getElementById("closeSidebar"),
  taskForm: document.getElementById("taskForm"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  priority: document.getElementById("priority"),
  dueDate: document.getElementById("dueDate"),
  searchInput: document.getElementById("searchInput"),
  tasksContainer: document.getElementById("tasksContainer"),
  emptyState: document.getElementById("emptyState"),
  toastStack: document.getElementById("toastStack"),
  progressRing: document.getElementById("progressRing"),
  progressValue: document.getElementById("progressValue"),
  completionLabel: document.getElementById("completionLabel"),
  taskSummary: document.getElementById("taskSummary"),
  pendingSummary: document.getElementById("pendingSummary"),
  visibleCount: document.getElementById("visibleCount"),
  statTotal: document.getElementById("statTotal"),
  statCompleted: document.getElementById("statCompleted"),
  statPending: document.getElementById("statPending"),
  statHigh: document.getElementById("statHigh"),
  statusFilters: document.getElementById("statusFilters"),
  priorityFilters: document.getElementById("priorityFilters"),
  exportPdf: document.getElementById("exportPdf"),
  exportCsv: document.getElementById("exportCsv"),
  themeToggle: document.getElementById("themeToggle"),
  greetingLabel: document.getElementById("greetingLabel"),
  greetingTitle: document.getElementById("greetingTitle"),
  dragHint: document.getElementById("dragHint"),
  libraryWarning: document.getElementById("libraryWarning"),
  taskModalBackdrop: document.getElementById("taskModalBackdrop"),
  editTaskForm: document.getElementById("editTaskForm"),
  editTaskId: document.getElementById("editTaskId"),
  editTitle: document.getElementById("editTitle"),
  editDescription: document.getElementById("editDescription"),
  editPriority: document.getElementById("editPriority"),
  editDueDate: document.getElementById("editDueDate"),
  editCompleted: document.getElementById("editCompleted"),
  closeModal: document.getElementById("closeModal"),
  cancelModal: document.getElementById("cancelModal"),
  confirmBackdrop: document.getElementById("confirmBackdrop"),
  confirmDelete: document.getElementById("confirmDelete"),
  cancelDelete: document.getElementById("cancelDelete")
};

const PRIORITY_META = {
  high: { emoji: "🔴", label: "High" },
  medium: { emoji: "🟠", label: "Medium" },
  low: { emoji: "🟢", label: "Low" }
};

const COMPLETION_SOUND_URL = "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=success-1-6297.mp3";

const debounce = (callback, delay = 250) => {
  let timeoutId = 0;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

const formatDateForInput = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const formatReadableDate = (value) => {
  if (!value) {
    return "No due date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { label: "Good morning", title: "Start strong and clear a meaningful task." };
  }
  if (hour < 18) {
    return { label: "Good afternoon", title: "Keep the middle of the day focused and intentional." };
  }
  return { label: "Good evening", title: "Wrap the day with one clean task win." };
};

const showToast = (message, type = "info", title = "TaskFlow") => {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-title">${escapeHtml(title)}</span>
    <span>${escapeHtml(message)}</span>
  `;
  elements.toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(12px)";
    window.setTimeout(() => toast.remove(), 220);
  }, 3600);
};

const setTheme = (theme) => {
  const isDark = theme === "dark";
  elements.body.classList.toggle("dark", isDark);
  elements.themeToggle.checked = isDark;
  localStorage.setItem("taskflow-theme", theme);
};

const applySavedTheme = () => {
  const savedTheme = localStorage.getItem("taskflow-theme");
  if (savedTheme) {
    setTheme(savedTheme);
    return;
  }
  setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
};

const setGreeting = () => {
  const greeting = getGreeting();
  elements.greetingLabel.textContent = greeting.label;
  elements.greetingTitle.textContent = greeting.title;
};

const apiRequest = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
  } catch (_error) {
    throw new Error("Unable to reach the API. Make sure the server is running.");
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
};

const syncFilterButtons = () => {
  [...elements.statusFilters.querySelectorAll("[data-status]")].forEach((button) => {
    button.classList.toggle("active", button.dataset.status === state.filters.status);
  });

  [...elements.priorityFilters.querySelectorAll("[data-priority]")].forEach((button) => {
    button.classList.toggle("active", button.dataset.priority === state.filters.priority);
  });
};

const getFilteredTasks = () => {
  const query = state.filters.search.trim().toLowerCase();
  return state.tasks.filter((task) => {
    const matchesStatus =
      state.filters.status === "all" ||
      (state.filters.status === "active" && !task.completed) ||
      (state.filters.status === "completed" && task.completed);

    const matchesPriority =
      state.filters.priority === "all" || task.priority === state.filters.priority;

    const searchHaystack = [
      task.title,
      task.description,
      PRIORITY_META[task.priority]?.label || task.priority,
      formatReadableDate(task.dueDate)
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !query || searchHaystack.includes(query);
    return matchesStatus && matchesPriority && matchesSearch;
  });
};

const updateStats = (visibleTasks) => {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const highPriority = state.tasks.filter((task) => task.priority === "high" && !task.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  elements.statTotal.textContent = String(total);
  elements.statCompleted.textContent = String(completed);
  elements.statPending.textContent = String(pending);
  elements.statHigh.textContent = String(highPriority);
  elements.progressValue.textContent = `${percent}%`;
  elements.completionLabel.textContent = `${percent}%`;
  elements.progressRing.style.setProperty("--progress", `${(percent / 100) * 360}deg`);
  elements.taskSummary.textContent = `${pluralize(total, "task")} tracked`;
  elements.pendingSummary.textContent = `${pluralize(pending, "task")} pending`;
  elements.visibleCount.textContent = `${pluralize(visibleTasks.length, "task")} visible`;
};

const taskTemplate = (task) => {
  const meta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  return `
    <article class="task-card ${task.completed ? "completed" : ""}" data-id="${task._id}" data-priority="${task.priority}">
      <input class="task-checkbox" type="checkbox" data-action="toggle" data-id="${task._id}" ${task.completed ? "checked" : ""} aria-label="Toggle task completion for ${escapeHtml(task.title)}">
      <div class="task-content">
        <div class="task-topline">
          <h4 class="task-title">${escapeHtml(task.title)}</h4>
          <span class="badge priority-${task.priority}">
            <span>${meta.emoji}</span>
            ${escapeHtml(meta.label)}
          </span>
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
        <div class="task-meta">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(formatReadableDate(task.dueDate))}</span>
          <span><i class="fa-solid fa-grip-vertical"></i> Drag to reorder</span>
          <span><i class="fa-regular fa-clock"></i> Created ${escapeHtml(formatReadableDate(task.createdAt))}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action" data-action="edit" data-id="${task._id}" aria-label="Edit ${escapeHtml(task.title)}">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="task-action" data-action="delete" data-id="${task._id}" aria-label="Delete ${escapeHtml(task.title)}">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </article>
  `;
};

const render = () => {
  const visibleTasks = getFilteredTasks();
  elements.tasksContainer.innerHTML = visibleTasks.map(taskTemplate).join("");
  elements.emptyState.classList.toggle("hidden", visibleTasks.length > 0);
  syncFilterButtons();
  updateStats(visibleTasks);
};

const fetchTasks = async () => {
  const tasks = await apiRequest("/api/tasks");
  state.tasks = Array.isArray(tasks) ? tasks : [];
  render();
};

const lazyLoadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });

const fireConfetti = async () => {
  try {
    if (!window.confetti) {
      await lazyLoadScript("https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js");
    }
    if (window.confetti) {
      window.confetti({
        particleCount: 120,
        spread: 68,
        startVelocity: 28,
        origin: { y: 0.66 }
      });
    }
  } catch (_error) {
    showToast("Confetti is unavailable right now, but your task still completed.", "info", "Nice work");
  }
};

const playCompletionSound = () => {
  try {
    if (!state.completionAudio) {
      state.completionAudio = new Audio(COMPLETION_SOUND_URL);
      state.completionAudio.preload = "auto";
      state.completionAudio.volume = 0.35;
    }
    state.completionAudio.currentTime = 0;
    state.completionAudio.play().catch(() => {});
  } catch (_error) {
    // Ignore playback errors.
  }
};

const initSortable = () => {
  if (!window.Sortable) {
    elements.dragHint.textContent = "Drag-and-drop unavailable because SortableJS did not load.";
    elements.libraryWarning.classList.remove("hidden");
    elements.libraryWarning.textContent = "SortableJS failed to load. Reordering is disabled, but the rest of the app still works.";
    return;
  }

  state.sortable = new window.Sortable(elements.tasksContainer, {
    animation: 180,
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    onEnd: async () => {
      const reorderedVisibleIds = [...elements.tasksContainer.querySelectorAll(".task-card")].map((card) => card.dataset.id);
      const visibleIdSet = new Set(reorderedVisibleIds);
      const reorderedVisibleTasks = reorderedVisibleIds
        .map((id) => state.tasks.find((task) => task._id === id))
        .filter(Boolean);
      const untouchedTasks = state.tasks.filter((task) => !visibleIdSet.has(task._id));
      const payload = [...reorderedVisibleTasks, ...untouchedTasks].map((task, index) => ({
        id: task._id,
        order: index
      }));

      try {
        const tasks = await apiRequest("/api/tasks/reorder", {
          method: "PUT",
          body: JSON.stringify({ tasks: payload })
        });
        state.tasks = tasks;
        render();
        showToast("Task order updated.", "success", "Reordered");
      } catch (error) {
        showToast(error.message, "error", "Reorder failed");
        fetchTasks().catch(() => {});
      }
    }
  });
};

const openEditModal = (task) => {
  elements.editTaskId.value = task._id;
  elements.editTitle.value = task.title;
  elements.editDescription.value = task.description || "";
  elements.editPriority.value = task.priority;
  elements.editDueDate.value = formatDateForInput(task.dueDate);
  elements.editCompleted.checked = Boolean(task.completed);
  elements.taskModalBackdrop.classList.remove("hidden");
  elements.editTitle.focus();
};

const closeEditModal = () => {
  elements.taskModalBackdrop.classList.add("hidden");
  elements.editTaskForm.reset();
  elements.editTaskId.value = "";
};

const openDeleteDialog = (taskId) => {
  state.deleteTargetId = taskId;
  elements.confirmBackdrop.classList.remove("hidden");
};

const closeDeleteDialog = () => {
  state.deleteTargetId = "";
  elements.confirmBackdrop.classList.add("hidden");
};

const createTask = async (payload) => {
  const task = await apiRequest("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  state.tasks.push(task);
  state.tasks.sort((a, b) => a.order - b.order);
  render();
  elements.taskForm.reset();
  elements.priority.value = "medium";
  elements.title.focus();
  showToast("Task added successfully.", "success", "Task created");
};

const updateTask = async (taskId, payload, { celebrate = false } = {}) => {
  const updatedTask = await apiRequest(`/api/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  state.tasks = state.tasks.map((task) => (task._id === taskId ? updatedTask : task));
  state.tasks.sort((a, b) => a.order - b.order);
  render();
  if (celebrate) {
    playCompletionSound();
    fireConfetti();
  }
};

const deleteTask = async (taskId) => {
  const result = await apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" });
  state.tasks = Array.isArray(result.tasks) ? result.tasks : state.tasks.filter((task) => task._id !== taskId);
  render();
  showToast("Task deleted.", "success", "Deleted");
};

const exportCsv = () => {
  if (!state.tasks.length) {
    showToast("Add at least one task before exporting.", "info", "Nothing to export");
    return;
  }

  const header = ["Title", "Description", "Priority", "Completed", "Due Date", "Created At", "Order"];
  const rows = state.tasks.map((task) => [
    task.title,
    task.description || "",
    task.priority,
    task.completed ? "Yes" : "No",
    task.dueDate ? formatReadableDate(task.dueDate) : "",
    formatReadableDate(task.createdAt),
    String(task.order)
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "taskflow-tasks.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("CSV export downloaded.", "success", "Export complete");
};

const exportPdf = async () => {
  if (!state.tasks.length) {
    showToast("Add at least one task before exporting.", "info", "Nothing to export");
    return;
  }

  if (!window.html2pdf) {
    showToast("html2pdf failed to load. PDF export is unavailable.", "error", "Export unavailable");
    return;
  }

  const wrapper = document.createElement("section");
  wrapper.style.padding = "28px";
  wrapper.style.fontFamily = "Inter, sans-serif";
  wrapper.style.color = "#102235";
  wrapper.innerHTML = `
    <h1 style="margin:0 0 8px;">TaskFlow Export</h1>
    <p style="margin:0 0 24px;color:#4f6277;">Generated ${new Date().toLocaleString()}</p>
    ${state.tasks
      .map(
        (task) => `
        <article style="padding:16px;border:1px solid #dce6f1;border-radius:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
            <div>
              <h2 style="margin:0 0 8px;font-size:18px;">${escapeHtml(task.title)}</h2>
              <p style="margin:0 0 10px;color:#5b6f84;line-height:1.6;">${escapeHtml(task.description || "No description provided.")}</p>
            </div>
            <strong>${escapeHtml((PRIORITY_META[task.priority] || PRIORITY_META.medium).label)}</strong>
          </div>
          <p style="margin:0;color:#4f6277;">Status: ${task.completed ? "Completed" : "Pending"} | Due: ${escapeHtml(formatReadableDate(task.dueDate))}</p>
        </article>`
      )
      .join("")}
  `;

  await window.html2pdf().set({
    margin: 0.5,
    filename: "taskflow-tasks.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  }).from(wrapper).save();

  showToast("PDF export downloaded.", "success", "Export complete");
};

const handleTaskFormSubmit = async (event) => {
  event.preventDefault();
  const payload = {
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    priority: elements.priority.value,
    dueDate: elements.dueDate.value || null
  };

  if (!payload.title) {
    showToast("Task title is required.", "error", "Validation");
    elements.title.focus();
    return;
  }

  try {
    await createTask(payload);
  } catch (error) {
    showToast(error.message, "error", "Create failed");
  }
};

const handleEditSubmit = async (event) => {
  event.preventDefault();
  const taskId = elements.editTaskId.value;
  const currentTask = state.tasks.find((task) => task._id === taskId);
  const payload = {
    title: elements.editTitle.value.trim(),
    description: elements.editDescription.value.trim(),
    priority: elements.editPriority.value,
    dueDate: elements.editDueDate.value || null,
    completed: elements.editCompleted.checked
  };

  if (!payload.title) {
    showToast("Task title is required.", "error", "Validation");
    elements.editTitle.focus();
    return;
  }

  try {
    await updateTask(taskId, payload, {
      celebrate: !currentTask?.completed && payload.completed
    });
    closeEditModal();
    showToast("Task updated successfully.", "success", "Saved");
  } catch (error) {
    showToast(error.message, "error", "Update failed");
  }
};

const handleTaskInteractions = async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const task = state.tasks.find((item) => item._id === target.dataset.id);
  if (!task) {
    return;
  }

  if (target.dataset.action === "edit") {
    openEditModal(task);
    return;
  }

  if (target.dataset.action === "delete") {
    openDeleteDialog(task._id);
    return;
  }

  if (target.dataset.action === "toggle") {
    try {
      const nextCompleted = !task.completed;
      await updateTask(task._id, { completed: nextCompleted }, { celebrate: nextCompleted });
      showToast(nextCompleted ? "Task completed." : "Task marked active again.", "success", "Updated");
    } catch (error) {
      showToast(error.message, "error", "Update failed");
    }
  }
};

const bindEvents = () => {
  elements.taskForm.addEventListener("submit", handleTaskFormSubmit);
  elements.editTaskForm.addEventListener("submit", handleEditSubmit);
  elements.tasksContainer.addEventListener("click", handleTaskInteractions);
  elements.tasksContainer.addEventListener("change", handleTaskInteractions);

  elements.statusFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-status]");
    if (!button) {
      return;
    }
    state.filters.status = button.dataset.status;
    render();
  });

  elements.priorityFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-priority]");
    if (!button) {
      return;
    }
    state.filters.priority = button.dataset.priority;
    render();
  });

  elements.searchInput.addEventListener(
    "input",
    debounce((event) => {
      state.filters.search = event.target.value;
      render();
    }, 220)
  );

  elements.exportCsv.addEventListener("click", exportCsv);
  elements.exportPdf.addEventListener("click", () => {
    exportPdf().catch((error) => showToast(error.message, "error", "Export failed"));
  });

  elements.themeToggle.addEventListener("change", () => {
    setTheme(elements.themeToggle.checked ? "dark" : "light");
  });

  elements.openSidebar.addEventListener("click", () => {
    elements.sidebar.classList.add("open");
  });

  elements.closeSidebar.addEventListener("click", () => {
    elements.sidebar.classList.remove("open");
  });

  elements.closeModal.addEventListener("click", closeEditModal);
  elements.cancelModal.addEventListener("click", closeEditModal);
  elements.cancelDelete.addEventListener("click", closeDeleteDialog);
  elements.confirmDelete.addEventListener("click", async () => {
    if (!state.deleteTargetId) {
      return;
    }
    try {
      await deleteTask(state.deleteTargetId);
      closeDeleteDialog();
    } catch (error) {
      showToast(error.message, "error", "Delete failed");
    }
  });

  elements.taskModalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.taskModalBackdrop) {
      closeEditModal();
    }
  });

  elements.confirmBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.confirmBackdrop) {
      closeDeleteDialog();
    }
  });

  elements.title.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      elements.taskForm.requestSubmit();
    }
  });
};

const init = async () => {
  applySavedTheme();
  setGreeting();
  bindEvents();
  initSortable();

  try {
    await fetchTasks();
  } catch (error) {
    showToast(error.message, "error", "Startup failed");
  }
};

init();
