<div align="center">
  <h1>🪨 Obsidian AutoGraphed</h1>
  <p>An Obsidian plugin to auto-connect your notes</p>
</div>

# About this plugin

This is a beta version of an Obsidian plug in to automatically create connections between your notes via an LLM.

You can input an OpenAI API key and choose a GPT model and it will help you auto-generate connections between your notes.

Note that we are constrained by the [token limit](https://platform.openai.com/account/limits) of your chosen model.

You have the ability to generate tags and then delete all generated tags if desired.

# Usage

**Requirement**

-   [OpenAI account with credits](https://platform.openai.com/api-keys)
-   [Obsidian](https://obsidian.md)
-   [Git](https://git-scm.com)
-   [GitHub](https://github.com) account
-   [Node.js](https://nodejs.org)

**Installation**

1. Open terminal
2. `cd path/to/your/obsidian/vault/.obsidian/plugins`
3. `git clone <this plugin>`
4. `npm install`
5. `npm run dev`
6. In Obsidian, press `Ctrl + P` and select `Reload app without saving`
7. In Obsidian, go to settings -> Community plugins -> Enable "AutoGraphed"

**Commands**

-   `npm i` (Install dependencies)
-   `npm run dev` (Install dependencies)
