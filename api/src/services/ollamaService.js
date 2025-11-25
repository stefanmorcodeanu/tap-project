/**
 * Ollama API service
 * Handles all interactions with the Ollama API
 */

import axios from "axios";

class OllamaService {
  constructor(config) {
    this.baseUrl = config.ollamaUrl;
    this.timeout = config.timeout;
  }

  /**
   * Calls Ollama API for non-streaming generation
   * @param {string} model - Model name
   * @param {string} prompt - Prompt text
   * @param {number} timeout - Request timeout in ms
   * @returns {Promise<string>} Model response
   */
  async generate(model, prompt, timeout = this.timeout) {
    const { data } = await axios.post(
      `${this.baseUrl}/api/generate`,
      { model, prompt, stream: false },
      { timeout }
    );
    return data.response;
  }

  /**
   * Calls Ollama API for streaming generation
   * @param {string} model - Model name
   * @param {string} prompt - Prompt text
   * @returns {Promise<Stream>} Axios stream response
   */
  async stream(model, prompt) {
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      { model, prompt, stream: true },
      { responseType: "stream" }
    );
    return response.data;
  }

  /**
   * Health check - gets available models
   * @returns {Promise<Array>} List of available models
   */
  async getModels() {
    const { data } = await axios.get(`${this.baseUrl}/api/tags`);
    return data?.models ?? [];
  }
}

export default OllamaService;

