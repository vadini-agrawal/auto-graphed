import axios from 'axios';
import data from "./data.json";

import { Plugin } from "obsidian";

const OPENAI_API_URL = data.OPENAI_API_URL;
const API_KEY = data.OPENAI_API_KEY;

export default class AutoGrpahedPlugin extends Plugin {
	statusBarElement: HTMLSpanElement;

	onload() {
		this.addRibbonIcon('dice', 'Send to GPT-4', async () => {
			const files = this.app.vault.getMarkdownFiles();
            const fileContents: Record<string, string> = {};

            // Compile details from each file
            for (const file of files) {
                fileContents[file.basename] = await this.app.vault.read(file);
            }

            const connections = await this.askConnections(fileContents);

            // Display connections
            console.log(connections);
		});
	}

	onunload() {
	}
	
	
	async askConnections(fileContents: Record<string, string>): Promise<Record<string, string[]>> {
        const fileNames = Object.keys(fileContents);
        let promptText = "Determine the connections in keywords between the following documents, only list keywords they have in common:\n\n";

        for (const name of fileNames) {
            promptText += `Document ${name} details: ${fileContents[name]}\n\n`;
        }

        promptText += "List out your response with the following format 'Document Name1<->Name2: keyword1, keyword2; Document Name1<->Name2: keyword1, keyword3; ...'";

        const gpt4Response = await this.callGPT4(promptText);

		console.log(gpt4Response);

        const connections: Record<string, string[]> = {};
        const matches = gpt4Response.matchAll(/Document (.*?): (.*?);/g);
        for (const match of matches) {
            connections[match[1]] = match[2].split(', ').map(s => s.trim());
        }

        return connections;
	}

	async callGPT4(promptText: string): Promise<string> {
        try {
            const response = await axios.post(OPENAI_API_URL, {
                prompt: promptText,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].text.trim();
            } else {
                throw new Error('No response from GPT-4.');
            }

        } catch (error) {
            console.error("Error calling GPT-4: ", error);
            throw error;
        }
    }

}
