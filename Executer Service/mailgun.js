const mailgun = require("mailgun-js");
const DOMAIN =
  "sandbox5220634659524fb79548fdeee490bdb7.mailgun.org";
const APIKEY = "01bf7ae8de608dab9c766489ad377c6b-d51642fa-ecf8da19";
const mailgunConfig = mailgun({ apiKey: APIKEY, domain: DOMAIN });
module.exports = mailgunConfig;
