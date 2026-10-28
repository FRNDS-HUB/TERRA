
"use strict";

document.addEventListener("DOMContentLoaded", initTERRA);

function initTERRA() {
  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  // Verify that the expected HTML elements exist.
  const requiredElements = [
    "#menuToggle",
    "#navLinks",
    "#checklist",
    "#progressText",
    "#progressFill",
    "#lessonSearch",
    "#lessonGrid",
    "#emptyState",
    "#lessonDialog",
    "#dialogClose",
    "#dialogCategory",
    "#dialogTitle",
    "#dialogBody",
    "#dialogSource",
    "#quizFeedback",
    "#quizRetry",
    "#year"
  ];

  const missing = requiredElements.filter((selector) => !$(selector));

  if (missing.length) {
    console.error("TERRA: Missing HTML elements:", missing);
  }

  // 1. Mobile navigation
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");

  function closeMenu() {
    if (!menuToggle || !navLinks) return;

    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.textContent = isOpen ? "×" : "☰";
    });

    $$("a", navLinks).forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  // 2. Footer year
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // 3. Preparedness checklist
  const checklist = $("#checklist");
  const progressText = $("#progressText");
  const progressFill = $("#progressFill");
  const storageKey = "terra-preparedness-v2";

  if (checklist && progressText && progressFill) {
    const checkboxes = $$("[data-task]", checklist);
    let savedTasks = {};

    try {
      const saved = localStorage.getItem(storageKey);
      savedTasks = saved ? JSON.parse(saved) : {};

      if (
        !savedTasks ||
        typeof savedTasks !== "object" ||
        Array.isArray(savedTasks)
      ) {
        savedTasks = {};
      }
    } catch (error) {
      console.warn("TERRA: Could not load checklist progress.", error);
      savedTasks = {};
    }

    checkboxes.forEach((checkbox) => {
      checkbox.checked = savedTasks[checkbox.dataset.task] === true;
    });

    function updateChecklist() {
      const completed = checkboxes.filter(
        (checkbox) => checkbox.checked
      ).length;

      const total = checkboxes.length;
      const percentage = total ? (completed / total) * 100 : 0;

      progressText.textContent = `${completed} / ${total}`;
      progressFill.style.width = `${percentage}%`;
      progressFill.setAttribute("role", "progressbar");
      progressFill.setAttribute("aria-valuemin", "0");
      progressFill.setAttribute("aria-valuemax", String(total));
      progressFill.setAttribute("aria-valuenow", String(completed));

      const currentTasks = {};

      checkboxes.forEach((checkbox) => {
        currentTasks[checkbox.dataset.task] = checkbox.checked;
      });

      try {
        localStorage.setItem(storageKey, JSON.stringify(currentTasks));
      } catch (error) {
        console.warn("TERRA: Progress could not be saved.", error);
      }
    }

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", updateChecklist);
    });

    updateChecklist();
  }

  // 4. Lesson search and category filters
  const searchInput = $("#lessonSearch");
  const lessonGrid = $("#lessonGrid");
  const emptyState = $("#emptyState");
  const filterButtons = $$("[data-filter]");
  const lessonCards = $$(".lesson-card");

  let activeFilter = "all";

  function filterLessons() {
    if (!searchInput || !emptyState) return;

    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    lessonCards.forEach((card) => {
      const category = (card.dataset.category || "").toLowerCase();
      const title = (
        card.dataset.title ||
        $("h3", card)?.textContent ||
        ""
      ).toLowerCase();

      const description = ($("p", card)?.textContent || "").toLowerCase();

      const matchesCategory =
        activeFilter === "all" || category === activeFilter;

      const matchesSearch =
        `${title} ${description} ${category}`.includes(query);

      const visible = matchesCategory && matchesSearch;
      card.hidden = !visible;

      if (visible) visibleCount++;
    });

    emptyState.hidden = visibleCount > 0;

    if (lessonGrid) {
      lessonGrid.setAttribute("aria-live", "polite");
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterLessons);
  }

  filterButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === activeFilter)
    );

    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";

      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      filterLessons();
    });
  });

  filterLessons();

  // 5. Lesson detail dialog
  const lessonDialog = $("#lessonDialog");
  const dialogClose = $("#dialogClose");
  const dialogCategory = $("#dialogCategory");
  const dialogTitle = $("#dialogTitle");
  const dialogBody = $("#dialogBody");
  const dialogSource = $("#dialogSource");

  const lessons = {
    plan: {
      category: "SAFETY / PREPAREDNESS",
      title: "Build a family emergency plan",
      body:
        "Identify hazards relevant to your area. Agree on how family " +
        "members will contact one another, choose a meeting point, " +
        "and learn evacuation procedures from your local emergency " +
        "management authority. Review and practice your plan together. " +
        "Verify details with official local guidance.",
      source: "https://www.ifrc.org/"
    },
    learning: {
      category: "LEARNING / ACCESS",
      title: "Make knowledge accessible",
      body:
        "Choose a learning goal, use accessible and credible resources, " +
        "and practice in small steps. Look for clear authorship, " +
        "publication dates, and evidence. Adapt the format to your " +
        "needs, including text, audio, captions, or translated material.",
      source: "https://www.unesco.org/"
    },
    planet: {
      category: "PLANET / ENVIRONMENT",
      title: "Small actions for a healthier planet",
      body:
        "Start by understanding a local environmental issue. Reduce " +
        "unnecessary waste, use resources thoughtfully, and support " +
        "evidence-based community efforts. Choose actions suited to " +
        "your local environment and circumstances.",
      source: "https://www.unep.org/"
    }
  };

  function closeDialog() {
    if (!lessonDialog) return;

    if (typeof lessonDialog.close === "function") {
      lessonDialog.close();
    } else {
      lessonDialog.removeAttribute("open");
    }
  }

  $$("[data-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      const lesson = lessons[button.dataset.lesson];

      if (!lesson) {
        console.warn("TERRA: Lesson not found:", button.dataset.lesson);
        return;
      }

      if (
        !lessonDialog ||
        !dialogCategory ||
        !dialogTitle ||
        !dialogBody ||
        !dialogSource
      ) {
        window.alert(`${lesson.title}\n\n${lesson.body}`);
        return;
      }

      dialogCategory.textContent = lesson.category;
      dialogTitle.textContent = lesson.title;
      dialogBody.textContent = lesson.body;
      dialogSource.href = lesson.source;

      if (typeof lessonDialog.showModal === "function") {
        if (!lessonDialog.open) lessonDialog.showModal();
      } else {
        window.alert(`${lesson.title}\n\n${lesson.body}`);
      }
    });
  });

  if (dialogClose) {
    dialogClose.addEventListener("click", closeDialog);
  }

  if (lessonDialog) {
    lessonDialog.addEventListener("click", (event) => {
      if (event.target === lessonDialog) closeDialog();
    });
  }

  // 6. One-question quiz
  const quizOptions = $$("[data-answer]");
  const quizFeedback = $("#quizFeedback");
  const quizRetry = $("#quizRetry");
  const correctAnswer = "b";
  let answered = false;

  quizOptions.forEach((button) => {
    button.addEventListener("click", () => {
      if (answered) return;

      answered = true;

      quizOptions.forEach((option) => {
        option.disabled = true;
        option.classList.toggle(
          "correct",
          option.dataset.answer === correctAnswer
        );
      });

      if (button.dataset.answer === correctAnswer) {
        if (quizFeedback) {
          quizFeedback.textContent =
            "Correct. Understanding local risks and planning ahead " +
            "can help households prepare.";
        }
      } else {
        button.classList.add("incorrect");

        if (quizFeedback) {
          quizFeedback.textContent =
            "Not quite. A useful first step is to identify local " +
            "risks and make a household plan.";
        }
      }

      if (quizRetry) quizRetry.hidden = false;
    });
  });

  if (quizRetry) {
    quizRetry.addEventListener("click", () => {
      answered = false;

      if (quizFeedback) quizFeedback.textContent = "";
      quizRetry.hidden = true;

      quizOptions.forEach((option) => {
        option.disabled = false;
        option.classList.remove("correct", "incorrect");
      });
    });
  }

  console.info("TERRA: JavaScript initialized.");
}
