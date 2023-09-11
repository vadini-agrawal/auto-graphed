import axios from 'axios';

import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import {preprocessAndDeduplicateNotes} from 'preprocessing';


interface AutoGraphedSettings {
  api_key: string;
  selected_gpt_model: string,
}

const DEFAULT_SETTINGS: AutoGraphedSettings = {
  api_key: '',
  selected_gpt_model: 'gpt-3.5-turbo',
}


export default class AutoGraphedPlugin extends Plugin {
	settings: AutoGraphedSettings;
    statusBarElement: HTMLSpanElement;

    onload() {
		this.loadSettings();

		this.addSettingTab(new AutoGraphedSettingTab(this.app, this));

        this.addRibbonIcon('brain-circuit', 'Create auto-gen connections', async () => {
            const files = this.app.vault.getMarkdownFiles();
            const fileContents: Record<string, string> = {};

            // Compile details from each file
            for (const file of files) {
                fileContents[file.basename] = await this.app.vault.read(file);
            }

            const processedContents = preprocessAndDeduplicateNotes(fileContents);

            const connections = await this.askConnections(processedContents);

            for (const file of files) {
                if (connections[file.basename]) {
                    const content = await this.app.vault.read(file);

                    // Check if "## Auto-Gen Connections" already exists in the file.
                    const splitContent = content.split("## Auto-Gen Connections\n");
                    let preexistingContent = splitContent[0]; // The content before "## Auto-Gen Connections"

                    // Create new connections string
                    const newConnections = "[[" + connections[file.basename].join(']], [[') + "]]";

                    let addNewLines = splitContent.length === 0 ? '\n\n\n' : '';

                    // Concatenate new content
                    const appendedContent = preexistingContent + addNewLines + '## Auto-Gen Connections\n' + newConnections;

                    await this.app.vault.modify(file, appendedContent);
                }
            }
            
            // Display connections
            console.log(connections);
<<<<<<< HEAD
=======
            new Notice(`Auto-generated connections with ${this.settings.selected_gpt_model}`);
>>>>>>> 312c06b (Add basic settings tab)
        });

        this.addRibbonIcon('list-x', 'Remove auto-gen connections', async () => {
            const files = this.app.vault.getMarkdownFiles();
            const fileContents: Record<string, string> = {};

            // Compile details from each file
            for (const file of files) {
                fileContents[file.basename] = await this.app.vault.read(file);
            }

            for (const file of files) {
                const content = await this.app.vault.read(file);

                // Check if "## Auto-Gen Connections" already exists in the file.
                const splitContent = content.split("## Auto-Gen Connections\n");
                let preexistingContent = splitContent[0]; // The content before "## Auto-Gen Connections"

                // Concatenate new content
                const appendedContent = preexistingContent;

                await this.app.vault.modify(file, appendedContent);
            }
        });
    }

    onunload() {
<<<<<<< HEAD
		// this.addSettingTab(new AutoGraphedSettingTab(this.app, this));
=======
>>>>>>> 312c06b (Add basic settings tab)
    }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

    async askConnections(fileContents: Record<string, string>): Promise<Record<string, string[]>> {
        const fileNames = Object.keys(fileContents);
        let promptText = "Determine the connections in keywords between the following documents. The keywords should be broader topics, like subjects or areas of study. Only list keywords they have in common.:\n\n";

        for (const name of fileNames) {
            promptText += `Doc ${name}: ${fileContents[name]}\n\n`;
        }

        promptText += "List out your response with the following format 'Doc <document name>: keyword1, keyword2; Doc <doc name>: keyword1, keyword3; ...;. Be sure to end the output with a semicolon'";

        const gpt4Response = await this.callGPT(promptText);

        console.log(gpt4Response);

        const connections: Record<string, string[]> = {};
        const matches = gpt4Response.matchAll(/Doc(?:ument)? (.*?): (.*?);/g);
        console.log(matches);
        for (const match of matches) {
<<<<<<< HEAD
            console.log(match);
=======
>>>>>>> 312c06b (Add basic settings tab)
            connections[match[1]] = match[2].split(', ').map((s: string) => s.trim());
        }

        return connections;
    }

    async callGPT(promptText: string): Promise<string> {
        try {
            const messages = [{
                role: "user",
                content: promptText
            }];
            
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: this.settings.selected_gpt_model,
                messages: messages,
                max_tokens: 600
            }, {
                headers: {
                    'Authorization': `Bearer ${this.settings.api_key}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
    
            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content?.trim() || '';
            } else {
                throw new Error('No response from OpenAI.');
            }
    
        } catch (error) {
            console.error("Error calling OpenAI: ", error);
            new Notice("Error getting connections between notes");
            throw error;
        }
    }

    async test_api_key() {
        const embed_input = "This is a test of the OpenAI API.";
        const resp = await this.callGPT('');
        if(resp) {
          return true;
        }else{
          return false;
        }
    }    
}


class AutoGraphedSettingTab extends PluginSettingTab {
  plugin: AutoGraphedPlugin;

  constructor(app: App, plugin: AutoGraphedPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;
    
	containerEl.empty();

	containerEl.createEl("h1", {
		text: "AutoGraphed Settings"
	});

    containerEl.createEl("p", {
		text: "This is a BETA version of AutoGraphed, an extension to automatically graph your notes."
	});

	containerEl.createEl("h2", {
		text: "OpenAI Settings"
	});

	containerEl.createEl("p", {
		text: "Please note that your notes are sent to OpenAI's servers to be processed and are subject to their Terms of Service"
	});

	// add a text input to enter the API key
	new Setting(containerEl).setName("OpenAI API Key").setDesc("Required: an OpenAI API key is currently required to use AutoGraphed.").addText((text) => text.setPlaceholder("Enter your api key").setValue(this.plugin.settings.api_key).onChange(async (value) => {
		this.plugin.settings.api_key = value.trim();
        console.log(this.plugin.settings.api_key);
		await this.plugin.saveSettings();
	}));

	// add a button to test the API key is working
	new Setting(containerEl).setName("Test your API Key").setDesc("Test your API Key").addButton((button) => button.setButtonText("Test API Key").onClick(async () => {
        // test API key
        const resp = await this.plugin.test_api_key();
        if (resp) {
            new Notice("Woo! The API key is valid");
        } else{
            new Notice("The API key is not working as expected!");
        }
	}));

    new Setting(containerEl)
    .setName('Select GPT Model')
    .setDesc('Choose your preferred GPT model for the plugin. GPT 3.5 is cheaper.')
    .addDropdown(drop => {
        drop.addOption('gpt-3.5-turbo', 'GPT-3.5 Turbo')
            .addOption('gpt-4-turbo-preview', 'GPT-4 Turbo')
            .setValue(this.plugin.settings.selected_gpt_model)
            .onChange(async (value: string) => {
                this.plugin.settings.selected_gpt_model = value;
                await this.plugin.saveSettings();
            });
    });
  }
}


class AutoGraphedSettingTab extends PluginSettingTab {
  plugin: AutoGraphedPlugin;

  constructor(app: App, plugin: AutoGraphedPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;
    
	containerEl.empty();

	containerEl.createEl("h1", {
		text: "AutoGraphed Settings"
	});

	containerEl.createEl("h2", {
		text: "OpenAI Settings"
	});

	containerEl.createEl("p", {
		text: "Please note that your notes are sent to OpenAI's servers to be processed and are subject to their Terms of Service"
	});

	// add a text input to enter the API key
	new Setting(containerEl).setName("OpenAI API Key").setDesc("Required: an OpenAI API key is currently required to use AutoGraphed.").addText((text) => text.setPlaceholder("Enter your api key").setValue(this.plugin.settings.api_key).onChange(async (value) => {
		this.plugin.settings.api_key = value.trim();
		await this.plugin.saveSettings();
	}));

	// add a button to test the API key is working
	new Setting(containerEl).setName("Test API Key").setDesc("Test API Key").addButton((button) => button.setButtonText("Test API Key").onClick(async () => {
		new Notice("Smart Connections: API key is valid");
	}));
  }
}
