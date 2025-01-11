document.addEventListener("DOMContentLoaded", () => {
  const noteForm = document.getElementById("note-form");
  const noteContent = document.getElementById("note-content");
  const noteSignature = document.getElementById("note-signature");
  const viewExpiration = document.getElementById("view-expiration");
  const noteDisplay = document.getElementById("note-display");
  const noteText = document.getElementById("note-text");
  const noteAuthor = document.getElementById("note-author");
  const rerollButton = document.getElementById("reroll-button");
  const submitButton = noteForm.querySelector('button[type="submit"]');
  const decrementButton = document.querySelector(".btn-decrement");
  const incrementButton = document.querySelector(".btn-increment");
  const upvoteButton = document.getElementById("upvote-button");
  const downvoteButton = document.getElementById("downvote-button");
  const flagButton = document.getElementById("flag-button");
  const upvoteCount = document.getElementById("upvote-count");
  const downvoteCount = document.getElementById("downvote-count");
  const sectionContainers = document.querySelectorAll(".section-container");

  let currentNoteId = null;

  function updateViewExpiration(change) {
    let value = parseInt(viewExpiration.value, 10) || 0;
    value = Math.max(0, value + change);
    viewExpiration.value = value;
    updateViewExpirationUI();
  }

  function updateViewExpirationUI() {
    const value = parseInt(viewExpiration.value, 10) || 0;
    decrementButton.disabled = value === 0;
  }

  decrementButton.addEventListener("click", () => updateViewExpiration(-1));
  incrementButton.addEventListener("click", () => updateViewExpiration(1));

  viewExpiration.addEventListener("input", updateViewExpirationUI);
  viewExpiration.addEventListener("change", () => {
    let value = parseInt(viewExpiration.value, 10);
    if (isNaN(value) || value < 0) {
      viewExpiration.value = 0;
    }
    updateViewExpirationUI();
  });

  async function loggingData() {
    await fetch("/.netlify/functions/userHandle");
  }

  function setRandomPlaceholder() {
    const contentQuestions = [
      "Who was your first love? Why did you fall in love with them?",
      "What was your biggest mistake?",
      "What is the most memorable journey you have ever taken and why?",
      "If you could relive one moment in your life, which one would it be?",
      "What is something you've always wanted to tell someone but never did?",
      "Describe a time when you took a huge risk and how it turned out.",
      "What is the best piece of advice you have ever received and who gave it to you?",
      "What is one thing you wish people knew about you?",
      "Tell me about a stranger who left a lasting impact on your life.",
      "What is a secret talent or hobby you have that most people don't know about?",
      "What is the kindest act someone has ever done for you?",
    ];

    noteContent.placeholder =
      contentQuestions[Math.floor(Math.random() * contentQuestions.length)];
  }

  async function getRandomStory() {
    try {
      const response = await fetch("/.netlify/functions/databaseHandle");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async function postNewStory(content) {
    try {
      console.log(content);
      const response = await fetch("/.netlify/functions/databaseHandle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function handleVote(type) {
    if (!currentNoteId) return;

    const button = type === "upvote" ? upvoteButton : downvoteButton;
    const oppositeButton = type === "upvote" ? downvoteButton : upvoteButton;

    button.classList.add("loading");
    button.disabled = true;

    try {
      const response = await fetch("/.netlify/functions/databaseHandle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: type, noteId: currentNoteId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      upvoteCount.textContent = result.upvotes;
      downvoteCount.textContent = result.downvotes;

      button.classList.add("active");
      oppositeButton.classList.remove("active");
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      button.classList.remove("loading");
      button.disabled = false;
    }
  }

  async function handleFlag() {
    if (!currentNoteId) return;

    flagButton.classList.add("loading");
    flagButton.disabled = true;

    try {
      const response = await fetch("/.netlify/functions/databaseHandle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "flag", noteId: currentNoteId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      alert("Note has been flagged for review.");
    } catch (error) {
      console.error("Error flagging note:", error);
    } finally {
      flagButton.classList.remove("loading");
      flagButton.disabled = false;
    }
  }

  function handleTilt(event, element) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 100;
    const tiltY = (centerX - x) / 100;

    element.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${-tiltY}deg)`;
  }

  function resetTilt(element) {
    element.style.transform =
      "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
  }

  sectionContainers.forEach((container) => {
    container.addEventListener("mousemove", (event) =>
      handleTilt(event, container)
    );
    container.addEventListener("mouseleave", () => resetTilt(container));
  });

  loggingData();
  setRandomPlaceholder();

  noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = noteContent.value.trim();
    const author = noteSignature.value.trim() || "Anonymous";
    const expiration = parseInt(viewExpiration.value, 10);

    if (content) {
      submitButton.classList.add("loading");
      submitButton.disabled = true;

      await postNewStory({
        NoteContent: content,
        Signed: author,
        ViewExpiration: expiration,
      });

      noteContent.value = "";
      noteSignature.value = "";
      viewExpiration.value = "0";

      submitButton.classList.remove("loading");
      submitButton.classList.add("success");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      submitButton.classList.remove("success");
      submitButton.disabled = false;
      setRandomPlaceholder();
    }
  });

  rerollButton.addEventListener("click", async () => {
    rerollButton.classList.add("loading");
    rerollButton.disabled = true;

    const randomStoryData = await getRandomStory();

    noteText.textContent = randomStoryData.NoteContent;
    noteAuthor.textContent = `- ${randomStoryData.Signed}`;
    noteDisplay.scrollTop = 0;

    currentNoteId = randomStoryData._id;
    upvoteCount.textContent = randomStoryData.upvotes || 0;
    downvoteCount.textContent = randomStoryData.downvotes || 0;

    upvoteButton.classList.remove("active");
    downvoteButton.classList.remove("active");

    rerollButton.classList.remove("loading");
    rerollButton.disabled = false;
  });

  upvoteButton.addEventListener("click", () => handleVote("upvote"));
  downvoteButton.addEventListener("click", () => handleVote("downvote"));
  flagButton.addEventListener("click", handleFlag);

  updateViewExpirationUI();
});
