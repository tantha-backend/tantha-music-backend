require("dotenv").config();

const { ListBucketsCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

async function testS3() {
  try {
    const data = await s3.send(new ListBucketsCommand({}));

    console.log("✅ AWS Connected Successfully");
    console.log(data.Buckets);
  } catch (error) {
    console.error("❌ AWS Connection Failed");
    console.error(error);
  }
}

testS3();