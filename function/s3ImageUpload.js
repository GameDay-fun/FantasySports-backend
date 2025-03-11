const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_ZONE,
  acl: "public-read",
});
const s3 = new AWS.S3();

s3upload = (file, imageName) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_s3_BUCKET,
      Key: imageName,
      Body: new Buffer.from(file.data),
      ContentType: file.mimetype,
      // ACL: "public-read",
    };
    s3.upload(params, {}, async function (err, data) {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(data.Key);
    });
  });
};

// preSignedUrl = async (req, res) => {
//   // console.log(req.body.location)
//   const params = {
//     Bucket: process.env.AWS_s3_BUCKET + "/public",
//     Key: req.body.keyName,
//     Expires: 3600,
//   };

//   const preSignedUrl = s3.getSignedUrl("getObject", params);
//   return res.status(200).send({
//     status: "success",
//     data: preSignedUrl,
//     keyName: req.body.keyName
//   });
// }

presignedUrlUpload = async (req, res, next) => {
  const params = {
    Bucket: process.env.AWS_s3_BUCKET,
    Key: "public/" + req.body.keyName,
    Body: req.files.file.data,
    ContentType: req.files.file.mimetype,
  };
  // console.log("params...", params);
  return new Promise((resolve, reject) => {
    s3.upload(params, {}, async function (err, data) {
      if (err) {
        console.error(err);
        reject(err);
      }
      // console.log(data);
      // resolve(data.key);
      const paramss = {
        Bucket: process.env.AWS_s3_BUCKET + "/public",
        Key: req.body.keyName,
        Expires: 3600,
      };
      // console.log(paramss);

      try {
        const preSignedUrl = s3.getSignedUrl("getObject", paramss);
        return res.status(200).send({
          status: "success",
          data: preSignedUrl,
          keyName: "public/" + req.body.keyName
        });

      } catch (e) {
        return res.status(400).send({
          status: "error",
          error: e
        });
      }
    });
  });
};

// deleteMedia = async (req, res) => {
//   // console.log(req.body.location)
//   const params = {
//     Bucket: process.env.AWS_s3_BUCKET + "/public",
//     Key: req.body.keyName,
//   };

//   s3.deleteObject(params, (err, data) => {
//     if (err) {
//       console.log(err);
//       return res.status(400).send({
//         status: false,
//         message: "Error on delete",
//         flag: "deleteMedia",
//       });
//     } else {
//       return res.status(201).send({
//         status: "success",
//         flag: "deleteMedia",
//       });
//     }
//   });
 
// }

module.exports = {
  s3upload,
  // preSignedUrl,
  presignedUrlUpload,
  // deleteMedia
};
