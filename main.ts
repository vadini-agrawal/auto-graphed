import axios from 'axios';
import data from "./data.json";

import { Plugin } from "obsidian";

import {preprocessAndDeduplicateNotes} from 'preprocessing';

const OPENAI_API_URL = data.OPENAI_API_URL;
const API_KEY = data.OPENAI_API_KEY;


export default class AutoGraphedPlugin extends Plugin {
	statusBarElement: HTMLSpanElement;

	onload() {
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
	}

	async askConnections(fileContents: Record<string, string>): Promise<Record<string, string[]>> {
        const fileNames = Object.keys(fileContents);
        let promptText = "Determine the connections in keywords between the following documents. The keywords should be broader topics, like subjects or areas of study. Only list keywords they have in common.:\n\n";

        for (const name of fileNames) {
            promptText += `Document ${name}: ${fileContents[name]}\n\n`;
        }

        promptText += "List out your response with the following format 'Doc <document name>: keyword1, keyword2; Document: keyword1, keyword3; ...;. Be sure to end the output with a semicolon'";

        const gpt4Response = await this.callGPT4(promptText);

		console.log(gpt4Response);

        const connections: Record<string, string[]> = {};
        const matches = gpt4Response.matchAll(/Doc(?:ument)? (.*?): (.*?);/g);
		console.log(matches);
        for (const match of matches) {
			console.log(match);
            connections[match[1]] = match[2].split(', ').map((s: string) => s.trim());
        }

        return connections;
	}

	async callGPT4(promptText: string): Promise<string> {
		try {
			const messages = [{
				role: "user",
				content: promptText
			}];
	
			const response = await axios.post(OPENAI_API_URL, {
				model: "gpt-3.5-turbo",
				messages: messages,
				max_tokens: 400
			}, {
				headers: {
					'Authorization': `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			});
	
			if (response.data && response.data.choices && response.data.choices.length > 0) {
				return response.data.choices[0].message.content.trim();
			} else {
				throw new Error('No response from OpenAI.');
			}
	
		} catch (error) {
			console.error("Error calling OpenAI: ", error);
			throw error;
		}
	}

}
