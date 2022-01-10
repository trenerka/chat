function generateMessage(username, message) {
  return { username, message, createdAt: new Date().getTime() };
}

function generateLocationMessage(username, url) {
  return { username, url, createdAt: new Date().getTime() };
}
module.exports = { generateMessage, generateLocationMessage };
