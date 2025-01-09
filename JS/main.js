document.addEventListener("DOMContentLoaded", () => {
  const noteForm = document.getElementById("note-form");
  const noteContent = document.getElementById("note-content");
  const noteSignature = document.getElementById("note-signature");
  const noteDisplay = document.getElementById("note-display");
  const noteText = document.getElementById("note-text");
  const noteAuthor = document.getElementById("note-author");
  const rerollButton = document.getElementById("reroll-button");
  const submitButton = noteForm.querySelector('button[type="submit"]');

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
      const response = await fetch("./netlify/functions/databaseHandle");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      return data;
    } catch (error) {
      console.log(error);
    }
  }

  setRandomPlaceholder();

  noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = noteContent.value.trim();
    const author = noteSignature.value.trim() || "Anonymous";

    if (content) {
      submitButton.classList.add("loading");
      submitButton.disabled = true;

      // Fake API Calls For Now
      await new Promise((resolve) => setTimeout(resolve, 1500));

      noteContent.value = "";
      noteSignature.value = "";
      submitButton.classList.remove("loading");
      submitButton.classList.add("success");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      submitButton.classList.remove("success");
      submitButton.disabled = false;
    }
  });

  rerollButton.addEventListener("click", async () => {
    rerollButton.classList.add("loading");
    rerollButton.disabled = true;

    randomStoryData = getRandomStory();

    noteText.textContent = randomStoryData.NoteContent;
    noteAuthor.textContent = `- ${randomStoryData.Signed}`;
    noteDisplay.scrollTop = 0;

    rerollButton.classList.remove("loading");
    rerollButton.disabled = false;
  });
});
