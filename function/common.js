const jwt = require("jsonwebtoken");
// const config = require("../config");

const generateJwtToken = (data) => {
  try {
    // return jwt.sign(data, config.JWT_PRIVATE_KEY,  {expiresIn: "2m" });
    return jwt.sign({ data }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
  } catch (e) {
    console.log("Token generate err : ", e);
  }
};

const jwtVerify = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        reject(err);
      }
      resolve(decode);
    });
  });
};

module.exports = {
  generateJwtToken,
  jwtVerify,
};
