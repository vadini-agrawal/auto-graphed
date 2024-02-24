type NoteFiles = { [fileName: string]: string };

export function preprocessAndDeduplicateNotes(files: NoteFiles): NoteFiles {
  const uniqueFiles: NoteFiles = {};

  for (const [fileName, content] of Object.entries(files)) {
    if (!uniqueFiles[fileName]) {
      // Deduplicate by filename
      uniqueFiles[fileName] = content;

      // Remove [[]] links
      let preprocessedContent = content.replace(/\[\[(.*?)\]\]/g, '$1');

      // Remove Markdown formatting (bold, italics, strikethrough, headers, etc.)
      preprocessedContent = preprocessedContent
        .replace(/(\*\*|__)(.*?)\1/g, '$2')  // Bold
        .replace(/(\*|_)(.*?)\1/g, '$2')    // Italics
        .replace(/~~(.*?)~~/g, '$2')        // Strikethrough
        .replace(/^#.*$/gm, '')             // Headers
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Inline links
        .replace(/```[^`]*```/g, '')       // Code blocks
        .replace(/^>.*$/gm, '')            // Block quotes
        .replace(/^-\s.*$/gm, '')          // Unordered list items
        .replace(/^\d+\.\s.*$/gm, '')      // Ordered list items
        .replace(/\n/g, '');               // Remove all newline characters


      uniqueFiles[fileName] = preprocessedContent;
      console.log(numTokensFromString(preprocessedContent));
    }
  }

  return uniqueFiles;
}

// Returns the number of tokens in a text string
function numTokensFromString(message: string) {
    return Math.ceil(message.length / 4);
}
