# Lightning Bounties - Automatic GitHub Issue Generator

This web application leverages the power of the Google Gemini AI to analyze public GitHub repositories and automatically generate actionable, well-structured issues for improvement. It's designed to help project maintainers and contributors quickly identify areas for enhancement, from refactoring and feature additions to addressing `TODO` comments left in the code.

## ✨ Features

* **🤖 AI-Powered Analysis:** Uses the Gemini API to intelligently scan a repository's structure and purpose.
* **📝 Structured Issue Generation:** Creates detailed issue descriptions with "Problem," "Proposed Solution," and "Required Technologies" sections.
* **⚙️ Advanced Customization:** Allows users to provide specific project goals to tailor the AI's suggestions.
* **✅ TODO Scanning:** Includes a toggle to find `// TODO:` comments in the codebase and convert them into formal issues.
* **🔗 Direct GitHub Integration:** Provides a one-click button to open a pre-filled "New Issue" form on the target repository.
* **💅 Clean & Responsive UI:** A modern and easy-to-use interface built with Tailwind CSS.

## 📂 Project Structure

The project is organized into separate files for clarity and maintainability:

```

.
├── .gitignore         \# Tells Git which files to ignore (e.g., config.js)
├── config.js          \# (You must create this) Stores your API key
├── index.html         \# The main HTML structure
├── script.js          \# Handles all application logic and API calls
└── style.css          \# Contains all custom CSS styles

````

## 🛠️ Setup for Local Development

Follow these steps to run the project on your local machine.

### Prerequisites

* A modern web browser (Chrome, Firefox, Edge).
* A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Application

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/lightningbounties-dev/issue-bounty-creator.git](https://github.com/lightningbounties-dev/issue-bounty-creator.git)
    cd issue-bounty-creator
    ```

2.  **Create the Configuration File:**
    * In the root of the project folder, create a new file named `config.js`.
    * Add the following code to this file, replacing the placeholder with your actual Gemini API key:
        ```javascript
        const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
        ```
    * *Note: This file is listed in `.gitignore` and will not be tracked by Git, keeping your key secure.*

3.  **Run with a Local Server:**
    * For the best experience, run this project using a local web server.
    * If you use Visual Studio Code, the **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)** extension is an excellent option.
    * After installing, right-click the `index.html` file and choose "Open with Live Server".

## 💻 Technologies Used

* **HTML5**
* **Tailwind CSS**
* **JavaScript (ES6+)**
* **Google Gemini API**
* **Marked.js**

> **⚠️ Security Warning:** This project is designed for client-side execution. The API key is loaded into the browser. For a production application that will be deployed publicly, you should move the API call logic to a secure backend environment (like a serverless function or a Node.js server) to protect your API key.
````
