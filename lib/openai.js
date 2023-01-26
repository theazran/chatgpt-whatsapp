// Import the required libraries
const request = require("request");
require('dotenv').config()
const API_KEY = process.env.API_KEY;
async function openAi(promt) {
  return new Promise(async function (resolve, reject) {
    try {
      const options = {
        method: "POST",
        url: "https://api.openai.com/v1/completions",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        json: true,
        body: {
          prompt: promt,
          model: "text-davinci-003",
          max_tokens: 3000,
          n: 1,
          temperature: 0.5,
        },
      };
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        const h = body.choices[0].text;
        const hasil = h.replace("\n\n", "");
        resolve({
          hasil,
        });
        // console.log(hasil)
      });
    } catch (error) { }
  });
}
module.exports = openAi;
