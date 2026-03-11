// botSystem.js 

// ---------------- BOT PROFILES ----------------
const bots = [
  { name: "Keerthi" },
  { name: "Prithi" },
  { name: "Ananya" },
  { name: "Priya" },
  { name: "Sofia" },
  { name: "Aisha" },
  { name: "Neha" },
  { name: "Pooja" },
  { name: "Kavya" },
  { name: "Bhagya" },
  { name: "Kavya" },
  { name: "Lavanya" },
  { name: "Avantika" },
  { name: "Lohitha" },
  { name: "Divya" },
  { name: "Manoj" }
];

let lastBotIndex = -1;

// ---------------- CONVERSATION MEMORY ----------------
const userMemory = {};

// ---------------- RANDOM BOT ----------------
function getRandomBot() {

  let index;

  do {
    index = Math.floor(Math.random() * bots.length);
  } while (index === lastBotIndex);

  lastBotIndex = index;

  return bots[index];
}

// ---------------- RANDOM HELPER ----------------
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------- BOT REPLY SYSTEM ----------------
function getBotReply(message, bot, userId = "default") {

  if (!message || typeof message !== "string") return "Hmm"; // always return string

  const msg = message.toLowerCase().trim();

  // -------- GET USER MEMORY --------
  if (!userMemory[userId]) {
    userMemory[userId] = { step: 0 };
  }

  const memory = userMemory[userId];

  // -------- GREETING --------
  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
    return random([
      "Hi",
      "Hello",
      "Hey"
    ]);
  }

  // -------- GENDER --------
  if (
    msg.includes("male or female") ||
    msg.includes("are you male") ||
    msg.includes("are you female") ||
    msg.includes("boy or girl") ||
    msg.includes("m or f") ||
    msg.includes("morf") ||
    msg.includes("m or f ?") ||
    msg.includes("gender")
  ) {
    return random([
      "f here",
      "Female",
      "Girl here",
      "I'm a girl",
      "f"
    ]);
  }

  // -------- NAME --------
  if (msg.includes("name") || msg.includes("who are you")) {
    return random([
      `${bot.name} here, you?`,
      `I'm ${bot.name}. your name?`,
      `My name is ${bot.name}. yours?`
    ]);
  }

  // -------- AGE --------
  if (msg.includes("age") || msg.includes("how old")) {

    const ages = [];
    for (let i = 18; i <= 35; i++) ages.push(i);
    const age = random(ages);

    return random([
      `${age}, you?`,
      `${age}. how about you?`,
      `I'm ${age}`
    ]);
  }

  // -------- PURPOSE --------
  if (
    msg.includes("here for") ||
    msg.includes("here for?") ||
    msg.includes("what brings you here?") ||
    msg.includes("what brings you here") ||
    msg.includes("why are you here")
  ) {
    return random([
      `Just here to chat and meet new people. You?`,
      `fun`,
      `Just bored. What brings you here?`,
      `time pass`,
      `open talk`,
      `chat and fun`
    ]);
  }

  // -------- SOCIAL --------
  if (
    msg.includes("insta") ||
    msg.includes("instagram") ||
    msg.includes("tele") ||
    msg.includes("telegram") ||
    msg.includes("snap") ||
    msg.includes("snapchat")
  ) {
    return random([
      `No`,
      `Sorry chat Here only`,
      `I dont want to Share`,
      `chat here first`,
      `later on`
    ]);
  }

  // -------- MEDIA --------
  if (
    msg.includes("pic") ||
    msg.includes("photo") ||
    msg.includes("voice") ||
    msg.includes("see you") ||
    msg.includes("audio")
  ) {
    return random([
      `No`,
      `Sorry bye`,
      `No chat only`,
      `im feeling shy`,
      `dont want`
    ]);
  }

  // -------- LOCATION --------
  if (
    msg.includes("from") ||
    msg.includes("location") ||
    msg.includes("country")
  ) {
    const locations = [
      "Hyderabad",
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Chennai",
      "Kolkata",
      "Pune",
      "Goa",
      "Kerala"
    ];
    const city = random(locations);

    return random([
      `I'm from ${city}. you?`,
      `${city}. where are you from?`,
      `From ${city}`
    ]);
  }

  // -------- SIZE --------
  if (
    msg.includes("size") ||
    msg.includes("ur size") ||
    msg.includes("your size") ||
    msg.includes("figure")
  ) {
    return random([
      `Maybe something like 34-28-36 😉`,
      `Around 32-26-34 I think`,
      `Hmm maybe 34-27-35`,
      `Not sure exactly… maybe 33-27-36`,
      `36-28-38 lol`,
      `34-26-35`,
      `Maybe 32-25-34 😄`,
      `28-28-32`
    ]);
  }

  // -------- LANGUAGE --------
  if (
    msg.includes("language") ||
    msg.includes("lang") ||
    msg.includes("english") ||
    msg.includes("hindi") ||
    msg.includes("telugu")
  ) {
    return random([
      `I mostly speak English.`,
      `better to talk in English`,
      `talk in english`,
      `Chat in english`,
      `know but prefer english`
    ]);
  }

  // -------- WHAT DOING --------
  if (msg.includes("what are you doing") || msg.includes("wyd")) {
    return random([
      "Just chatting here",
      "Nothing much, you?",
      "Just passing time",
      "Talking to people here"
    ]);
  }

  // -------- HOW ARE YOU --------
  if (msg.includes("how are you")) {
    return random([
      "I'm good, you?",
      "Doing well",
      "I'm fine",
      "Pretty good today"
    ]);
  }

  // -------- AUTO CONVERSATION FLOW --------
  if (memory.step === 0) {
    memory.step = 1;
    return random([
      "what's your name?",
      "your name?",
      "can I know your name?"
    ]);
  }

  if (memory.step === 1 && msg.length > 1) {
    memory.step = 2;
    return random([
      "male or female?",
      "are you male or female?",
      "m or f?"
    ]);
  }

  if (memory.step === 2) {
    memory.step = 3;
    return random([
      "where are you from?",
      "your location?",
      "which country?"
    ]);
  }

  if (memory.step === 3) {
    memory.step = 4;
    return random([
      "what are you doing now?",
      "just bored?",
      "here for chat?"
    ]);
  }

  // -------- DEFAULT REPLIES --------
  return random(["hmm", "okay"]); // always return string
}

// ---------------- EXPORT ----------------
module.exports = {
  getRandomBot,
  getBotReply
};