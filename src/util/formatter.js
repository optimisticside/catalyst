module.exports = (title) => {
  return {
    warning: message => `:warning: ${message}`,
    alert: message => `:exclamation: ${message}`,
    neutral: message => `${message}`,
    denial: message => `:no_entry: ${message}`,
    success: message => `:white_check_mark: ${message}`,
    prompt: message => `:question: ${message}`
  };
};