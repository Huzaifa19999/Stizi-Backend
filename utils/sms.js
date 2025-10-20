

async function sendSMS(phone, message) {
  console.log(`[sendSMS placeholder] To: ${phone} Message: ${message}`);
  return Promise.resolve({ success: true });
}

module.exports = { sendSMS };
