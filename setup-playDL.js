// setup-playDL.js
require('dotenv').config();
const play = require('play-dl');

(async () => {
  await play.setToken({
    youtube: {
      cookie: process.env.YOUTUBE_COOKIE
    }
  });
  console.log('✅ Token de YouTube guardado correctamente');
})();