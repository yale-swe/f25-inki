// Service for OpenAI API integration for document summarization
// Calls the backend API route to keep the API key secure

export class OpenAIService {
  static async generateSummary(documentId: string): Promise<string> {
    try {
      // Call the backend API route
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate summary: ${response.statusText}`);
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }
}
